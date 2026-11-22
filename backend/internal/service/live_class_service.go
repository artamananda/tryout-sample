package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

// JoinOpensBefore is how early the meeting link becomes available.
const JoinOpensBefore = 30 * time.Minute

type LiveClassService struct {
	LiveClassRepository *repository.LiveClassRepository
	ProgramRepository   *repository.ProgramRepository
	AccessService       *AccessService
	Now                 func() time.Time
}

func NewLiveClassService(liveClassRepository *repository.LiveClassRepository, programRepository *repository.ProgramRepository, accessService *AccessService) LiveClassService {
	return LiveClassService{
		LiveClassRepository: liveClassRepository,
		ProgramRepository:   programRepository,
		AccessService:       accessService,
		Now:                 time.Now,
	}
}

func classStatus(class entity.LiveClass, now time.Time) string {
	switch {
	case now.Before(class.StartsAt):
		return "UPCOMING"
	case now.After(class.EndsAt):
		return "FINISHED"
	default:
		return "LIVE"
	}
}

func baseClassResponse(class entity.LiveClass, now time.Time) model.LiveClassResponse {
	return model.LiveClassResponse{
		ClassID:     class.ClassID,
		ProgramID:   class.ProgramID,
		Sequence:    class.Sequence,
		Title:       class.Title,
		Description: class.Description,
		TryoutID:    class.TryoutID,
		TutorName:   class.TutorName,
		StartsAt:    class.StartsAt,
		EndsAt:      class.EndsAt,
		Status:      classStatus(class, now),
		JoinOpensAt: class.StartsAt.Add(-JoinOpensBefore),
	}
}

// ClassAccess explains what a membership allows for one class.
type ClassAccess struct {
	HasAccess          bool
	Reason             string
	RecordingExpiresAt *time.Time
}

// EvaluateClass applies the package rules: class k needs class_count >= k,
// and recordings last recording_days after the class date. Registrations
// without a package (legacy) get full access without expiry.
func EvaluateClass(class entity.LiveClass, memberships map[uuid.UUID]Membership) ClassAccess {
	membership, ok := memberships[class.ProgramID]
	if !ok {
		return ClassAccess{Reason: "Kelas ini khusus peserta program. Pilih paket untuk mengikutinya."}
	}
	if membership.Package == nil {
		return ClassAccess{HasAccess: true}
	}
	if class.Sequence > membership.Package.ClassCount {
		if membership.Package.ClassCount == 0 {
			return ClassAccess{Reason: fmt.Sprintf("Paket %s belum termasuk kelas live.", membership.Package.Name)}
		}
		return ClassAccess{Reason: fmt.Sprintf("Paket %s mencakup kelas 1 sampai %d.", membership.Package.Name, membership.Package.ClassCount)}
	}
	expires := class.StartsAt.AddDate(0, 0, membership.Package.RecordingDays)
	return ClassAccess{HasAccess: true, RecordingExpiresAt: &expires}
}

func (service *LiveClassService) participantResponse(class entity.LiveClass, access ClassAccess, attended bool, rating int, now time.Time) model.LiveClassResponse {
	response := baseClassResponse(class, now)
	response.HasAccess = access.HasAccess
	response.LockedReason = access.Reason
	response.Attended = attended
	response.MyRating = rating
	if !access.HasAccess {
		return response
	}
	response.CanJoin = class.MeetingURL != "" && !now.Before(response.JoinOpensAt) && !now.After(class.EndsAt)
	response.CanRate = !now.Before(class.StartsAt)
	recordingValid := access.RecordingExpiresAt == nil || now.Before(*access.RecordingExpiresAt)
	response.HasRecording = class.RecordingURL != "" && recordingValid
	response.RecordingExpiresAt = access.RecordingExpiresAt
	return response
}

// ListForUser returns the classes of every program the user belongs to (or
// one program), with what the user can do in each.
func (service *LiveClassService) ListForUser(ctx context.Context, userID string, programID string) ([]model.LiveClassResponse, error) {
	memberships, err := service.AccessService.Memberships(ctx, userID)
	if err != nil {
		return nil, err
	}
	programIDs := []uuid.UUID{}
	if programID != "" {
		id, err := parseID(programID, "program_id")
		if err != nil {
			return nil, err
		}
		programIDs = append(programIDs, id)
	} else {
		for id := range memberships {
			programIDs = append(programIDs, id)
		}
	}

	classes, err := service.LiveClassRepository.FindByPrograms(ctx, programIDs)
	if err != nil {
		return nil, err
	}
	classIDs := make([]uuid.UUID, 0, len(classes))
	for _, class := range classes {
		classIDs = append(classIDs, class.ClassID)
	}
	parsedUserID, err := parseID(userID, "user_id")
	if err != nil {
		return nil, err
	}
	attended, ratings, err := service.LiveClassRepository.UserState(ctx, parsedUserID, classIDs)
	if err != nil {
		return nil, err
	}

	now := service.Now()
	responses := make([]model.LiveClassResponse, 0, len(classes))
	for _, class := range classes {
		access := EvaluateClass(class, memberships)
		responses = append(responses, service.participantResponse(class, access, attended[class.ClassID], ratings[class.ClassID], now))
	}
	return responses, nil
}

func (service *LiveClassService) loadForUser(ctx context.Context, userID string, classID string) (entity.LiveClass, ClassAccess, error) {
	id, err := parseID(classID, "class_id")
	if err != nil {
		return entity.LiveClass{}, ClassAccess{}, err
	}
	class, err := service.LiveClassRepository.FindByID(ctx, id)
	if errors.Is(err, repository.ErrLiveClassNotFound) {
		return entity.LiveClass{}, ClassAccess{}, exception.NotFoundError{Message: "kelas tidak ditemukan"}
	}
	if err != nil {
		return entity.LiveClass{}, ClassAccess{}, err
	}
	memberships, err := service.AccessService.Memberships(ctx, userID)
	if err != nil {
		return entity.LiveClass{}, ClassAccess{}, err
	}
	access := EvaluateClass(class, memberships)
	if !access.HasAccess {
		return entity.LiveClass{}, ClassAccess{}, exception.BadRequestError{Message: access.Reason}
	}
	return class, access, nil
}

// Join returns the meeting link during the join window and records attendance.
func (service *LiveClassService) Join(ctx context.Context, userID string, classID string) (string, error) {
	class, _, err := service.loadForUser(ctx, userID, classID)
	if err != nil {
		return "", err
	}
	now := service.Now()
	if class.MeetingURL == "" {
		return "", exception.BadRequestError{Message: "Link kelas belum tersedia."}
	}
	if now.Before(class.StartsAt.Add(-JoinOpensBefore)) {
		return "", exception.BadRequestError{Message: "Link kelas dibuka 30 menit sebelum kelas dimulai (" + formatWIB(class.StartsAt) + ")."}
	}
	if now.After(class.EndsAt) {
		return "", exception.BadRequestError{Message: "Kelas sudah selesai. Tonton rekamannya bila tersedia."}
	}
	if err := service.LiveClassRepository.RecordAttendance(ctx, class.ClassID, uuid.MustParse(userID), now); err != nil {
		return "", err
	}
	return class.MeetingURL, nil
}

// Recording returns the recording link while the package still includes it.
func (service *LiveClassService) Recording(ctx context.Context, userID string, classID string) (string, error) {
	class, access, err := service.loadForUser(ctx, userID, classID)
	if err != nil {
		return "", err
	}
	if class.RecordingURL == "" {
		return "", exception.BadRequestError{Message: "Rekaman belum tersedia."}
	}
	if access.RecordingExpiresAt != nil && !service.Now().Before(*access.RecordingExpiresAt) {
		return "", exception.BadRequestError{Message: "Masa tonton rekaman paket Anda sudah berakhir pada " + formatWIB(*access.RecordingExpiresAt) + "."}
	}
	return class.RecordingURL, nil
}

func (service *LiveClassService) Rate(ctx context.Context, userID string, classID string, request model.RateLiveClassRequest) error {
	if err := common.Validate(request); err != nil {
		return err
	}
	class, _, err := service.loadForUser(ctx, userID, classID)
	if err != nil {
		return err
	}
	now := service.Now()
	if now.Before(class.StartsAt) {
		return exception.BadRequestError{Message: "Rating bisa diberikan setelah kelas dimulai."}
	}
	return service.LiveClassRepository.UpsertRating(ctx, entity.LiveClassRating{
		ClassID:   class.ClassID,
		UserID:    uuid.MustParse(userID),
		Rating:    request.Rating,
		Comment:   strings.TrimSpace(request.Comment),
		CreatedAt: now,
		UpdatedAt: now,
	})
}

// ---- admin

func (service *LiveClassService) adminResponse(class entity.LiveClass, stats repository.ClassStats, now time.Time) model.LiveClassResponse {
	response := baseClassResponse(class, now)
	response.MeetingURL = class.MeetingURL
	response.RecordingURL = class.RecordingURL
	attendees := stats.Attendees
	count := stats.RatingCount
	avg := math.Round(stats.RatingAvg*100) / 100
	response.Attendees = &attendees
	response.RatingCount = &count
	response.RatingAvg = &avg
	return response
}

func (service *LiveClassService) ListForAdmin(ctx context.Context, programID string) ([]model.LiveClassResponse, error) {
	id, err := parseID(programID, "program_id")
	if err != nil {
		return nil, err
	}
	classes, err := service.LiveClassRepository.FindByPrograms(ctx, []uuid.UUID{id})
	if err != nil {
		return nil, err
	}
	classIDs := make([]uuid.UUID, 0, len(classes))
	for _, class := range classes {
		classIDs = append(classIDs, class.ClassID)
	}
	stats, err := service.LiveClassRepository.Stats(ctx, classIDs)
	if err != nil {
		return nil, err
	}
	now := service.Now()
	responses := make([]model.LiveClassResponse, 0, len(classes))
	for _, class := range classes {
		responses = append(responses, service.adminResponse(class, stats[class.ClassID], now))
	}
	return responses, nil
}

func uniqueClassError(err error) error {
	if err != nil && strings.Contains(err.Error(), "live_classes_program_id_sequence_key") {
		return exception.BadRequestError{Message: "Nomor kelas sudah dipakai di program ini."}
	}
	if err != nil && strings.Contains(err.Error(), "live_classes_check") {
		return exception.BadRequestError{Message: "Waktu selesai harus setelah waktu mulai."}
	}
	return err
}

func (service *LiveClassService) Create(ctx context.Context, request model.CreateLiveClassRequest) (model.LiveClassResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.LiveClassResponse{}, err
	}
	if !request.EndsAt.After(request.StartsAt) {
		return model.LiveClassResponse{}, exception.BadRequestError{Message: "Waktu selesai harus setelah waktu mulai."}
	}
	if _, err := service.ProgramRepository.FindByID(ctx, request.ProgramID); err != nil {
		return model.LiveClassResponse{}, exception.NotFoundError{Message: "program Not Found"}
	}
	class, err := service.LiveClassRepository.Create(ctx, entity.LiveClass{
		ProgramID:    request.ProgramID,
		Sequence:     request.Sequence,
		Title:        strings.TrimSpace(request.Title),
		Description:  request.Description,
		TryoutID:     request.TryoutID,
		TutorName:    strings.TrimSpace(request.TutorName),
		StartsAt:     request.StartsAt,
		EndsAt:       request.EndsAt,
		MeetingURL:   strings.TrimSpace(request.MeetingURL),
		RecordingURL: strings.TrimSpace(request.RecordingURL),
	})
	if err != nil {
		return model.LiveClassResponse{}, uniqueClassError(err)
	}
	return service.adminResponse(class, repository.ClassStats{}, service.Now()), nil
}

func (service *LiveClassService) Update(ctx context.Context, classID string, request model.UpdateLiveClassRequest) (model.LiveClassResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.LiveClassResponse{}, err
	}
	id, err := parseID(classID, "class_id")
	if err != nil {
		return model.LiveClassResponse{}, err
	}
	class, err := service.LiveClassRepository.FindByID(ctx, id)
	if err != nil {
		return model.LiveClassResponse{}, exception.NotFoundError{Message: "kelas tidak ditemukan"}
	}

	changes := map[string]interface{}{}
	if request.Sequence != nil {
		changes["sequence"] = *request.Sequence
	}
	if request.Title != nil {
		changes["title"] = strings.TrimSpace(*request.Title)
	}
	if request.Description != nil {
		changes["description"] = *request.Description
	}
	if request.ClearTryout {
		changes["tryout_id"] = nil
	} else if request.TryoutID != nil {
		changes["tryout_id"] = *request.TryoutID
	}
	if request.TutorName != nil {
		changes["tutor_name"] = strings.TrimSpace(*request.TutorName)
	}
	starts, ends := class.StartsAt, class.EndsAt
	if request.StartsAt != nil {
		starts = *request.StartsAt
		changes["starts_at"] = starts
	}
	if request.EndsAt != nil {
		ends = *request.EndsAt
		changes["ends_at"] = ends
	}
	if !ends.After(starts) {
		return model.LiveClassResponse{}, exception.BadRequestError{Message: "Waktu selesai harus setelah waktu mulai."}
	}
	for column, value := range map[string]*string{"meeting_url": request.MeetingURL, "recording_url": request.RecordingURL} {
		if value == nil {
			continue
		}
		url := strings.TrimSpace(*value)
		if url != "" && !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
			return model.LiveClassResponse{}, exception.BadRequestError{Message: column + " harus diawali http:// atau https://"}
		}
		changes[column] = url
	}

	if err := service.LiveClassRepository.UpdateFields(ctx, id, changes); err != nil {
		return model.LiveClassResponse{}, uniqueClassError(err)
	}
	updated, err := service.LiveClassRepository.FindByID(ctx, id)
	if err != nil {
		return model.LiveClassResponse{}, err
	}
	stats, err := service.LiveClassRepository.Stats(ctx, []uuid.UUID{id})
	if err != nil {
		return model.LiveClassResponse{}, err
	}
	return service.adminResponse(updated, stats[id], service.Now()), nil
}

func (service *LiveClassService) Delete(ctx context.Context, classID string) error {
	id, err := parseID(classID, "class_id")
	if err != nil {
		return err
	}
	return service.LiveClassRepository.Delete(ctx, id)
}
