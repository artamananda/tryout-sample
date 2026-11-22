package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"sort"
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

// referralAlphabet leaves out look-alike characters (0/O, 1/I/L).
const referralAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

func randomCode(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	code := make([]byte, length)
	for i, b := range bytes {
		code[i] = referralAlphabet[int(b)%len(referralAlphabet)]
	}
	return string(code), nil
}

// GrowthService covers referrals, the "garansi naik kelas" and certificates.
type GrowthService struct {
	GrowthRepository             *repository.GrowthRepository
	UserRepository               *repository.UserRepository
	OrderRepository              *repository.OrderRepository
	ProgramRepository            *repository.ProgramRepository
	PackageRepository            *repository.PackageRepository
	TransactionProgramRepository *repository.TransactionProgramRepository
	AccessService                *AccessService
	SKDResultService             *SKDResultService
	Now                          func() time.Time
}

func NewGrowthService(
	growthRepository *repository.GrowthRepository,
	userRepository *repository.UserRepository,
	orderRepository *repository.OrderRepository,
	programRepository *repository.ProgramRepository,
	packageRepository *repository.PackageRepository,
	transactionProgramRepository *repository.TransactionProgramRepository,
	accessService *AccessService,
	skdResultService *SKDResultService,
) GrowthService {
	return GrowthService{
		GrowthRepository:             growthRepository,
		UserRepository:               userRepository,
		OrderRepository:              orderRepository,
		ProgramRepository:            programRepository,
		PackageRepository:            packageRepository,
		TransactionProgramRepository: transactionProgramRepository,
		AccessService:                accessService,
		SKDResultService:             skdResultService,
		Now:                          time.Now,
	}
}

// ---- referral

// ReferralInfo returns the user's referral code (created on first use) and
// what it has earned.
func (service *GrowthService) ReferralInfo(ctx context.Context, userID string) (model.ReferralInfoResponse, error) {
	user, err := service.UserRepository.FindById(ctx, userID)
	if err != nil {
		return model.ReferralInfoResponse{}, exception.NotFoundError{Message: "user Not Found"}
	}

	code := ""
	if user.ReferralCode != nil {
		code = *user.ReferralCode
	}
	for attempt := 0; code == "" && attempt < 5; attempt++ {
		candidate, err := randomCode(8)
		if err != nil {
			return model.ReferralInfoResponse{}, err
		}
		saved, err := service.UserRepository.SetReferralCodeIfEmpty(ctx, user.UserID, candidate)
		if err != nil {
			if strings.Contains(err.Error(), "users_referral_code_unique") {
				continue
			}
			return model.ReferralInfoResponse{}, err
		}
		code = saved
	}
	if code == "" {
		return model.ReferralInfoResponse{}, errors.New("gagal membuat kode rujukan, silakan coba lagi")
	}

	paidReferrals, err := service.OrderRepository.CountPaidReferrals(ctx, user.UserID)
	if err != nil {
		return model.ReferralInfoResponse{}, err
	}
	bonus, err := service.GrowthRepository.SumReferralBonus(ctx, user.UserID)
	if err != nil {
		return model.ReferralInfoResponse{}, err
	}
	return model.ReferralInfoResponse{
		Code:             code,
		DiscountAmount:   ReferralDiscount,
		BonusPerReferral: ReferralBonusTryouts,
		PaidReferrals:    int(paidReferrals),
		BonusEarned:      bonus,
	}, nil
}

// ---- progress, guarantee and certificate

type programState struct {
	program    entity.Program
	membership Membership
	progress   []model.SKDTryoutProgress
	limit      int
}

func (service *GrowthService) loadState(ctx context.Context, userID string, programID string) (programState, error) {
	id, err := parseID(programID, "program_id")
	if err != nil {
		return programState{}, err
	}
	program, err := service.ProgramRepository.FindByID(ctx, id)
	if err != nil {
		return programState{}, exception.NotFoundError{Message: "program Not Found"}
	}
	memberships, err := service.AccessService.Memberships(ctx, userID)
	if err != nil {
		return programState{}, err
	}
	membership, ok := memberships[id]
	if !ok {
		return programState{}, exception.NotFoundError{Message: "Anda belum terdaftar di program ini."}
	}
	limit := 0
	if membership.Package != nil {
		limit = membership.Package.TryoutCount
	}
	progress, err := service.SKDResultService.ProgramProgress(ctx, id, uuid.MustParse(userID), limit)
	if err != nil {
		return programState{}, err
	}
	return programState{program: program, membership: membership, progress: progress, limit: limit}, nil
}

func completedCount(progress []model.SKDTryoutProgress) int {
	count := 0
	for _, item := range progress {
		if item.Completed {
			count++
		}
	}
	return count
}

// allPackageTryoutsDone reports whether every TO the package includes exists
// and was completed.
func allPackageTryoutsDone(state programState) (bool, string) {
	expected := state.limit
	if expected == 0 {
		expected = len(state.progress)
	}
	if expected == 0 || len(state.progress) < expected {
		return false, fmt.Sprintf("Selesaikan seluruh %d TO paket Anda terlebih dahulu.", expected)
	}
	done := completedCount(state.progress)
	if done < expected {
		return false, fmt.Sprintf("Baru %d dari %d TO yang selesai.", done, expected)
	}
	return true, ""
}

func (service *GrowthService) guaranteeStatus(ctx context.Context, userID uuid.UUID, state programState) *model.GuaranteeStatus {
	status := &model.GuaranteeStatus{}
	if state.membership.Package == nil || !state.membership.Package.HasGuarantee {
		status.Reason = "Paket Anda tidak termasuk garansi naik kelas."
		return status
	}
	status.Included = true
	if claim, ok := service.GrowthRepository.FindClaim(ctx, userID, state.program.ProgramID); ok {
		status.ClaimStatus = claim.Status
		status.FirstScore = claim.FirstScore
		status.LastScore = claim.LastScore
		status.Reason = "Klaim garansi sudah diajukan."
		return status
	}
	done, reason := allPackageTryoutsDone(state)
	if !done {
		status.Reason = reason
		return status
	}
	first := state.progress[0]
	last := state.progress[len(state.progress)-1]
	status.FirstScore = first.TotalScore
	status.LastScore = last.TotalScore
	if last.TotalScore > first.TotalScore {
		status.Reason = "Skor akhir Anda sudah lebih tinggi dari TO pertama. Selamat!"
		return status
	}
	status.Eligible = true
	status.Reason = "Skor akhir tidak lebih tinggi dari TO pertama. Anda bisa mengulang satu siklus kelas tanpa biaya."
	return status
}

func (service *GrowthService) certificateStatus(ctx context.Context, userID uuid.UUID, state programState) *model.CertificateStatus {
	status := &model.CertificateStatus{}
	if state.membership.Package == nil || !state.membership.Package.HasCertificate {
		status.Reason = "Paket Anda tidak termasuk sertifikat."
		return status
	}
	status.Included = true
	if certificate, ok := service.GrowthRepository.FindCertificate(ctx, userID, state.program.ProgramID); ok {
		issued := certificate.IssuedAt
		status.Eligible = true
		status.CertificateNumber = certificate.CertificateNumber
		status.IssuedAt = &issued
		return status
	}
	done, reason := allPackageTryoutsDone(state)
	status.Eligible = done
	status.Reason = reason
	return status
}

// Progress returns the user's progress in a program with guarantee and
// certificate status.
func (service *GrowthService) Progress(ctx context.Context, userID string, programID string) (model.ProgramProgressResponse, error) {
	state, err := service.loadState(ctx, userID, programID)
	if err != nil {
		return model.ProgramProgressResponse{}, err
	}
	parsedUserID := uuid.MustParse(userID)
	done, _ := allPackageTryoutsDone(state)
	response := model.ProgramProgressResponse{
		ProgramID:      state.program.ProgramID,
		ProgramName:    state.program.Name,
		TryoutLimit:    state.membership.TryoutLimit(),
		Tryouts:        state.progress,
		CompletedCount: completedCount(state.progress),
		AllCompleted:   done,
		Guarantee:      service.guaranteeStatus(ctx, parsedUserID, state),
		Certificate:    service.certificateStatus(ctx, parsedUserID, state),
	}
	if state.membership.Package != nil {
		response.PackageName = state.membership.Package.Name
		if state.membership.Package.HasStudyGroup {
			response.StudyGroupURL = state.membership.Package.StudyGroupURL
		}
	}
	return response, nil
}

// ClaimGuarantee files a guarantee claim when the participant is eligible.
func (service *GrowthService) ClaimGuarantee(ctx context.Context, userID string, programID string) (model.GuaranteeClaimResponse, error) {
	state, err := service.loadState(ctx, userID, programID)
	if err != nil {
		return model.GuaranteeClaimResponse{}, err
	}
	parsedUserID := uuid.MustParse(userID)
	status := service.guaranteeStatus(ctx, parsedUserID, state)
	if !status.Eligible {
		return model.GuaranteeClaimResponse{}, exception.BadRequestError{Message: status.Reason}
	}
	claim, err := service.GrowthRepository.CreateClaim(ctx, entity.GuaranteeClaim{
		UserID:     parsedUserID,
		ProgramID:  state.program.ProgramID,
		PackageID:  state.membership.Package.PackageID,
		FirstScore: status.FirstScore,
		LastScore:  status.LastScore,
		Status:     entity.GuaranteePending,
	})
	if err != nil {
		if strings.Contains(err.Error(), "guarantee_claims_user_id_program_id_key") {
			return model.GuaranteeClaimResponse{}, exception.BadRequestError{Message: "Klaim garansi sudah diajukan."}
		}
		return model.GuaranteeClaimResponse{}, err
	}
	return toClaimResponse(claim, false), nil
}

func toClaimResponse(claim entity.GuaranteeClaim, includeUser bool) model.GuaranteeClaimResponse {
	response := model.GuaranteeClaimResponse{
		ClaimID:         claim.ClaimID,
		ProgramID:       claim.ProgramID,
		PackageID:       claim.PackageID,
		FirstScore:      claim.FirstScore,
		LastScore:       claim.LastScore,
		Status:          claim.Status,
		TargetProgramID: claim.TargetProgramID,
		AdminNote:       claim.AdminNote,
		CreatedAt:       claim.CreatedAt,
	}
	if includeUser {
		response.User = &model.OrderUserSummary{
			UserID:      claim.User.UserID,
			Name:        claim.User.Name,
			Email:       claim.User.Email,
			PhoneNumber: claim.User.PhoneNumber,
		}
	}
	return response
}

func (service *GrowthService) ListClaims(ctx context.Context, status string) ([]model.GuaranteeClaimResponse, error) {
	claims, err := service.GrowthRepository.ListClaims(ctx, strings.ToUpper(status))
	if err != nil {
		return nil, err
	}
	responses := make([]model.GuaranteeClaimResponse, 0, len(claims))
	for _, claim := range claims {
		responses = append(responses, toClaimResponse(claim, true))
	}
	return responses, nil
}

// ReviewClaim approves (granting the same package in the target program for
// free) or rejects a guarantee claim.
func (service *GrowthService) ReviewClaim(ctx context.Context, claimID string, request model.ReviewGuaranteeRequest) (model.GuaranteeClaimResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.GuaranteeClaimResponse{}, err
	}
	id, err := parseID(claimID, "claim_id")
	if err != nil {
		return model.GuaranteeClaimResponse{}, err
	}
	claim, err := service.GrowthRepository.FindClaimByID(ctx, id)
	if err != nil {
		return model.GuaranteeClaimResponse{}, exception.NotFoundError{Message: "klaim tidak ditemukan"}
	}
	if claim.Status != entity.GuaranteePending {
		return model.GuaranteeClaimResponse{}, exception.BadRequestError{Message: "Klaim ini sudah diproses."}
	}

	if !request.Approve {
		if err := service.GrowthRepository.UpdateClaim(ctx, service.GrowthRepository.DB, id, map[string]interface{}{
			"status": entity.GuaranteeRejected, "admin_note": request.AdminNote,
		}); err != nil {
			return model.GuaranteeClaimResponse{}, err
		}
	} else {
		if request.TargetProgramID == nil {
			return model.GuaranteeClaimResponse{}, exception.BadRequestError{Message: "Pilih gelombang tujuan untuk mengulang kelas."}
		}
		original, err := service.PackageRepository.FindByID(ctx, claim.PackageID)
		if err != nil {
			return model.GuaranteeClaimResponse{}, err
		}
		targetPackages, err := service.PackageRepository.FindByProgram(ctx, *request.TargetProgramID, false)
		if err != nil {
			return model.GuaranteeClaimResponse{}, err
		}
		var target *entity.Package
		for i := range targetPackages {
			if targetPackages[i].Code == original.Code {
				target = &targetPackages[i]
			}
		}
		if target == nil {
			return model.GuaranteeClaimResponse{}, exception.BadRequestError{Message: "Gelombang tujuan belum punya paket " + original.Name + "."}
		}
		user, err := service.UserRepository.FindById(ctx, claim.UserID.String())
		if err != nil {
			return model.GuaranteeClaimResponse{}, err
		}
		now := service.Now()
		err = service.OrderRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
			order := entity.Order{
				OrderID:         uuid.New(),
				OrderNumber:     newOrderNumber(now),
				UserID:          claim.UserID,
				PackageID:       target.PackageID,
				ProgramID:       target.ProgramID,
				Amount:          0,
				ListPrice:       target.CurrentPrice(now),
				Status:          entity.OrderPaid,
				PhoneNumber:     user.PhoneNumber,
				PaymentProvider: entity.PaymentProviderManual,
				PaymentMethod:   "garansi naik kelas",
				PaidAt:          &now,
				CreatedAt:       now,
				UpdatedAt:       now,
			}
			if err := tx.WithContext(ctx).Create(&order).Error; err != nil {
				return err
			}
			if err := service.TransactionProgramRepository.GrantPackage(ctx, tx, claim.UserID, target.ProgramID, target.PackageID, "GARANSI-"+strings.ToUpper(claim.ClaimID.String()[:8])); err != nil {
				return err
			}
			return service.GrowthRepository.UpdateClaim(ctx, tx, id, map[string]interface{}{
				"status": entity.GuaranteeApproved, "target_program_id": *request.TargetProgramID, "admin_note": request.AdminNote,
			})
		})
		if err != nil {
			return model.GuaranteeClaimResponse{}, err
		}
	}

	updated, err := service.GrowthRepository.FindClaimByID(ctx, id)
	if err != nil {
		return model.GuaranteeClaimResponse{}, err
	}
	return toClaimResponse(updated, false), nil
}

// IssueCertificate creates (or returns) the participant's certificate once
// every TO of the package is completed.
func (service *GrowthService) IssueCertificate(ctx context.Context, userID string, programID string) (model.CertificateResponse, error) {
	state, err := service.loadState(ctx, userID, programID)
	if err != nil {
		return model.CertificateResponse{}, err
	}
	parsedUserID := uuid.MustParse(userID)
	status := service.certificateStatus(ctx, parsedUserID, state)
	if !status.Included || !status.Eligible {
		return model.CertificateResponse{}, exception.BadRequestError{Message: status.Reason}
	}

	certificate, ok := service.GrowthRepository.FindCertificate(ctx, parsedUserID, state.program.ProgramID)
	if !ok {
		best := 0
		for _, item := range state.progress {
			if item.Completed && item.TotalScore > best {
				best = item.TotalScore
			}
		}
		for attempt := 0; attempt < 5; attempt++ {
			suffix, err := randomCode(6)
			if err != nil {
				return model.CertificateResponse{}, err
			}
			certificate, err = service.GrowthRepository.CreateCertificate(ctx, entity.Certificate{
				CertificateNumber: fmt.Sprintf("TLS-%s-%s", service.Now().In(wib).Format("2006"), suffix),
				UserID:            parsedUserID,
				ProgramID:         state.program.ProgramID,
				PackageID:         state.membership.Package.PackageID,
				BestScore:         best,
				TryoutsCompleted:  completedCount(state.progress),
				IssuedAt:          service.Now(),
			})
			if err == nil {
				break
			}
			if strings.Contains(err.Error(), "certificates_user_id_program_id_key") {
				certificate, _ = service.GrowthRepository.FindCertificate(ctx, parsedUserID, state.program.ProgramID)
				break
			}
			if !strings.Contains(err.Error(), "certificates_certificate_number_key") {
				return model.CertificateResponse{}, err
			}
		}
	}
	return service.certificateResponse(ctx, certificate)
}

func (service *GrowthService) certificateResponse(ctx context.Context, certificate entity.Certificate) (model.CertificateResponse, error) {
	if certificate.CertificateNumber == "" {
		return model.CertificateResponse{}, errors.New("sertifikat gagal dibuat, silakan coba lagi")
	}
	user, err := service.UserRepository.FindById(ctx, certificate.UserID.String())
	if err != nil {
		return model.CertificateResponse{}, err
	}
	program, err := service.ProgramRepository.FindByID(ctx, certificate.ProgramID)
	if err != nil {
		return model.CertificateResponse{}, err
	}
	pkg, err := service.PackageRepository.FindByID(ctx, certificate.PackageID)
	if err != nil {
		return model.CertificateResponse{}, err
	}
	return model.CertificateResponse{
		CertificateNumber: certificate.CertificateNumber,
		ParticipantName:   user.Name,
		ProgramName:       program.Name,
		PackageName:       pkg.Name,
		BestScore:         certificate.BestScore,
		TryoutsCompleted:  certificate.TryoutsCompleted,
		IssuedAt:          certificate.IssuedAt,
	}, nil
}

// VerifyCertificate is the public check of a certificate number.
func (service *GrowthService) VerifyCertificate(ctx context.Context, number string) (model.CertificateResponse, error) {
	certificate, err := service.GrowthRepository.FindCertificateByNumber(ctx, strings.ToUpper(strings.TrimSpace(number)))
	if err != nil {
		return model.CertificateResponse{}, exception.NotFoundError{Message: "Sertifikat tidak ditemukan."}
	}
	return service.certificateResponse(ctx, certificate)
}

// MyPrograms lists the programs the participant belongs to.
func (service *GrowthService) MyPrograms(ctx context.Context, userID string) ([]model.MyProgramResponse, error) {
	memberships, err := service.AccessService.Memberships(ctx, userID)
	if err != nil {
		return nil, err
	}
	responses := []model.MyProgramResponse{}
	for programID, membership := range memberships {
		program, err := service.ProgramRepository.FindByID(ctx, programID)
		if err != nil {
			continue
		}
		item := model.MyProgramResponse{
			ProgramID:   program.ProgramID,
			ProgramName: program.Name,
			StartTime:   program.StartTime,
			EndTime:     program.EndTime,
			TryoutLimit: membership.TryoutLimit(),
		}
		if pkg := membership.Package; pkg != nil {
			item.PackageName = pkg.Name
			item.PackageCode = pkg.Code
			item.ClassCount = pkg.ClassCount
			item.MentoringSessions = pkg.MentoringSessions
			item.HasGuarantee = pkg.HasGuarantee
			item.HasCertificate = pkg.HasCertificate
		}
		responses = append(responses, item)
	}
	sort.Slice(responses, func(i, j int) bool { return responses[i].StartTime.After(responses[j].StartTime) })
	return responses, nil
}
