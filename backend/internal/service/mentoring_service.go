package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	// MentoringBookingCutoff: a slot can no longer be booked this close to it.
	MentoringBookingCutoff = 2 * time.Hour
	// MentoringCancelCutoff: participants can cancel until this long before.
	MentoringCancelCutoff = 24 * time.Hour
)

type MentoringService struct {
	MentoringRepository *repository.MentoringRepository
	UserRepository      *repository.UserRepository
	ProgramRepository   *repository.ProgramRepository
	AccessService       *AccessService
	Now                 func() time.Time
}

func NewMentoringService(mentoringRepository *repository.MentoringRepository, userRepository *repository.UserRepository, programRepository *repository.ProgramRepository, accessService *AccessService) MentoringService {
	return MentoringService{
		MentoringRepository: mentoringRepository,
		UserRepository:      userRepository,
		ProgramRepository:   programRepository,
		AccessService:       accessService,
		Now:                 time.Now,
	}
}

func (service *MentoringService) allowedSessions(ctx context.Context, userID string, programID uuid.UUID) (int, error) {
	memberships, err := service.AccessService.Memberships(ctx, userID)
	if err != nil {
		return 0, err
	}
	membership, ok := memberships[programID]
	if !ok || membership.Package == nil {
		return 0, nil
	}
	return membership.Package.MentoringSessions, nil
}

func (service *MentoringService) slotResponse(slot entity.MentoringSlot, userID uuid.UUID, now time.Time) model.MentoringSlotResponse {
	response := model.MentoringSlotResponse{
		SlotID:          slot.SlotID,
		ProgramID:       slot.ProgramID,
		TutorName:       slot.TutorName,
		StartsAt:        slot.StartsAt,
		DurationMinutes: slot.DurationMinutes,
		Status:          slot.Status,
	}
	if slot.BookedBy != nil && *slot.BookedBy == userID {
		response.IsMine = true
		response.MeetingURL = slot.MeetingURL
		response.CanCancel = slot.Status == entity.SlotBooked && slot.StartsAt.Sub(now) > MentoringCancelCutoff
	} else if slot.Status != entity.SlotOpen {
		// Other people's bookings only show as taken.
		response.Status = entity.SlotBooked
	}
	return response
}

// Overview lists the bookable slots and the participant's own sessions.
func (service *MentoringService) Overview(ctx context.Context, userID string, programID string) (model.MentoringOverviewResponse, error) {
	id, err := parseID(programID, "program_id")
	if err != nil {
		return model.MentoringOverviewResponse{}, err
	}
	parsedUserID, err := parseID(userID, "user_id")
	if err != nil {
		return model.MentoringOverviewResponse{}, err
	}
	allowed, err := service.allowedSessions(ctx, userID, id)
	if err != nil {
		return model.MentoringOverviewResponse{}, err
	}
	used, err := service.MentoringRepository.CountUsed(ctx, service.MentoringRepository.DB, parsedUserID, id)
	if err != nil {
		return model.MentoringOverviewResponse{}, err
	}

	now := service.Now()
	response := model.MentoringOverviewResponse{Allowed: allowed, Used: int(used), Slots: []model.MentoringSlotResponse{}}
	if remaining := allowed - int(used); remaining > 0 {
		response.Remaining = remaining
	}
	if allowed == 0 {
		return response, nil
	}

	slots, err := service.MentoringRepository.FindForParticipant(ctx, id, parsedUserID, now)
	if err != nil {
		return model.MentoringOverviewResponse{}, err
	}
	for _, slot := range slots {
		if slot.StartsAt.Sub(now) < MentoringBookingCutoff && (slot.BookedBy == nil || *slot.BookedBy != parsedUserID) {
			continue
		}
		response.Slots = append(response.Slots, service.slotResponse(slot, parsedUserID, now))
	}
	return response, nil
}

// Book reserves an open slot for the participant.
func (service *MentoringService) Book(ctx context.Context, userID string, slotID string) (model.MentoringSlotResponse, error) {
	id, err := parseID(slotID, "slot_id")
	if err != nil {
		return model.MentoringSlotResponse{}, err
	}
	parsedUserID := uuid.MustParse(userID)
	now := service.Now()

	var booked entity.MentoringSlot
	err = service.MentoringRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		slot, err := service.MentoringRepository.LockByID(ctx, tx, id)
		if errors.Is(err, repository.ErrSlotNotFound) {
			return exception.NotFoundError{Message: "slot tidak ditemukan"}
		}
		if err != nil {
			return err
		}
		if slot.Status != entity.SlotOpen {
			return exception.BadRequestError{Message: "Slot ini sudah diambil peserta lain."}
		}
		if slot.StartsAt.Sub(now) < MentoringBookingCutoff {
			return exception.BadRequestError{Message: "Booking ditutup 2 jam sebelum sesi dimulai."}
		}

		allowed, err := service.allowedSessions(ctx, userID, slot.ProgramID)
		if err != nil {
			return err
		}
		if allowed == 0 {
			return exception.BadRequestError{Message: "Paket Anda belum termasuk mentoring 1:1."}
		}
		// Serialize bookings of the same participant to keep the limit exact.
		if err := tx.Exec("SELECT pg_advisory_xact_lock(hashtext(?))", "mentoring:"+userID+":"+slot.ProgramID.String()).Error; err != nil {
			return err
		}
		used, err := service.MentoringRepository.CountUsed(ctx, tx, parsedUserID, slot.ProgramID)
		if err != nil {
			return err
		}
		if int(used) >= allowed {
			return exception.BadRequestError{Message: "Jatah mentoring Anda sudah terpakai semua."}
		}

		if err := service.MentoringRepository.UpdateFields(ctx, tx, slot.SlotID, map[string]interface{}{
			"status":    entity.SlotBooked,
			"booked_by": parsedUserID,
			"booked_at": now,
		}); err != nil {
			return err
		}
		slot.Status = entity.SlotBooked
		slot.BookedBy = &parsedUserID
		slot.BookedAt = &now
		booked = slot
		return nil
	})
	if err != nil {
		return model.MentoringSlotResponse{}, err
	}
	return service.slotResponse(booked, parsedUserID, now), nil
}

// Cancel releases the participant's booking up to 24 hours before the session.
func (service *MentoringService) Cancel(ctx context.Context, userID string, slotID string) error {
	id, err := parseID(slotID, "slot_id")
	if err != nil {
		return err
	}
	now := service.Now()
	return service.MentoringRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		slot, err := service.MentoringRepository.LockByID(ctx, tx, id)
		if err != nil || slot.BookedBy == nil || slot.BookedBy.String() != userID {
			return exception.NotFoundError{Message: "booking tidak ditemukan"}
		}
		if slot.Status != entity.SlotBooked {
			return exception.BadRequestError{Message: "Sesi ini tidak bisa dibatalkan."}
		}
		if slot.StartsAt.Sub(now) <= MentoringCancelCutoff {
			return exception.BadRequestError{Message: "Pembatalan hanya bisa sampai 24 jam sebelum sesi. Hubungi admin."}
		}
		return service.MentoringRepository.UpdateFields(ctx, tx, slot.SlotID, map[string]interface{}{
			"status":    entity.SlotOpen,
			"booked_by": nil,
			"booked_at": nil,
		})
	})
}

// ---- admin

// CreateSlots makes one slot per date x time x tutor (times in WIB).
func (service *MentoringService) CreateSlots(ctx context.Context, request model.CreateMentoringSlotsRequest) (int64, error) {
	if err := common.Validate(request); err != nil {
		return 0, err
	}
	if _, err := service.ProgramRepository.FindByID(ctx, request.ProgramID); err != nil {
		return 0, exception.NotFoundError{Message: "program Not Found"}
	}
	slots := []entity.MentoringSlot{}
	for _, date := range request.Dates {
		for _, clock := range request.Times {
			startsAt, err := time.ParseInLocation("2006-01-02 15:04", date+" "+clock, wib)
			if err != nil {
				return 0, exception.BadRequestError{Message: "tanggal/jam tidak valid: " + date + " " + clock}
			}
			for _, tutor := range request.Tutors {
				tutor = strings.TrimSpace(tutor)
				if tutor == "" {
					continue
				}
				slots = append(slots, entity.MentoringSlot{
					SlotID:          uuid.New(),
					ProgramID:       request.ProgramID,
					TutorName:       tutor,
					StartsAt:        startsAt,
					DurationMinutes: request.DurationMinutes,
					MeetingURL:      strings.TrimSpace(request.MeetingURL),
					Status:          entity.SlotOpen,
				})
			}
		}
	}
	return service.MentoringRepository.CreateMany(ctx, slots)
}

func (service *MentoringService) ListForAdmin(ctx context.Context, programID string) ([]model.MentoringSlotResponse, error) {
	id, err := parseID(programID, "program_id")
	if err != nil {
		return nil, err
	}
	slots, err := service.MentoringRepository.FindByProgram(ctx, id)
	if err != nil {
		return nil, err
	}
	userIDs := []uuid.UUID{}
	for _, slot := range slots {
		if slot.BookedBy != nil {
			userIDs = append(userIDs, *slot.BookedBy)
		}
	}
	users, err := service.UserRepository.FindByIDs(ctx, userIDs)
	if err != nil {
		return nil, err
	}
	userByID := map[uuid.UUID]entity.User{}
	for _, user := range users {
		userByID[user.UserID] = user
	}

	responses := make([]model.MentoringSlotResponse, 0, len(slots))
	for _, slot := range slots {
		response := model.MentoringSlotResponse{
			SlotID:          slot.SlotID,
			ProgramID:       slot.ProgramID,
			TutorName:       slot.TutorName,
			StartsAt:        slot.StartsAt,
			DurationMinutes: slot.DurationMinutes,
			Status:          slot.Status,
			MeetingURL:      slot.MeetingURL,
			Notes:           slot.Notes,
		}
		if slot.BookedBy != nil {
			user := userByID[*slot.BookedBy]
			response.BookedBy = &model.OrderUserSummary{UserID: user.UserID, Name: user.Name, Email: user.Email, PhoneNumber: user.PhoneNumber}
		}
		responses = append(responses, response)
	}
	return responses, nil
}

func (service *MentoringService) UpdateSlot(ctx context.Context, slotID string, request model.UpdateMentoringSlotRequest) error {
	if err := common.Validate(request); err != nil {
		return err
	}
	id, err := parseID(slotID, "slot_id")
	if err != nil {
		return err
	}
	return service.MentoringRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		slot, err := service.MentoringRepository.LockByID(ctx, tx, id)
		if err != nil {
			return exception.NotFoundError{Message: "slot tidak ditemukan"}
		}
		changes := map[string]interface{}{}
		if request.MeetingURL != nil {
			changes["meeting_url"] = strings.TrimSpace(*request.MeetingURL)
		}
		if request.Notes != nil {
			changes["notes"] = *request.Notes
		}
		if request.Status != nil {
			status := *request.Status
			switch status {
			case entity.SlotOpen:
				// Re-opening frees the seat.
				changes["booked_by"] = nil
				changes["booked_at"] = nil
			case entity.SlotBooked, entity.SlotDone, entity.SlotNoShow:
				if slot.BookedBy == nil {
					return exception.BadRequestError{Message: "Slot belum dipesan peserta."}
				}
			}
			changes["status"] = status
		}
		return service.MentoringRepository.UpdateFields(ctx, tx, slot.SlotID, changes)
	})
}

func (service *MentoringService) DeleteSlot(ctx context.Context, slotID string) error {
	id, err := parseID(slotID, "slot_id")
	if err != nil {
		return err
	}
	slot, err := service.MentoringRepository.FindByID(ctx, id)
	if err != nil {
		return exception.NotFoundError{Message: "slot tidak ditemukan"}
	}
	if slot.BookedBy != nil {
		return exception.BadRequestError{Message: "Slot sudah dipesan; ubah statusnya menjadi CANCELLED atau OPEN dulu."}
	}
	return service.MentoringRepository.Delete(ctx, id)
}
