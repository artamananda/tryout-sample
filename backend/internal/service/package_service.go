package service

import (
	"context"
	"errors"
	"math"
	"strings"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
	pq "github.com/lib/pq"
)

type PackageService struct {
	PackageRepository *repository.PackageRepository
	ProgramRepository *repository.ProgramRepository
	OrderRepository   *repository.OrderRepository
	AccessService     *AccessService
	Now               func() time.Time
}

func NewPackageService(
	packageRepository *repository.PackageRepository,
	programRepository *repository.ProgramRepository,
	orderRepository *repository.OrderRepository,
	accessService *AccessService,
) PackageService {
	return PackageService{
		PackageRepository: packageRepository,
		ProgramRepository: programRepository,
		OrderRepository:   orderRepository,
		AccessService:     accessService,
		Now:               time.Now,
	}
}

func toProgramResponse(program entity.Program) model.ProgramResponse {
	return model.ProgramResponse{
		ProgramID:         program.ProgramID,
		Name:              program.Name,
		Description:       program.Description,
		MaxParticipants:   program.MaxParticipants,
		IsPublished:       program.IsPublished,
		PictureURL:        program.PictureURL,
		StartTime:         program.StartTime,
		EndTime:           program.EndTime,
		OpenRegistration:  program.OpenRegistration,
		CloseRegistration: program.CloseRegistration,
		CreatedAt:         program.CreatedAt,
		UpdatedAt:         program.UpdatedAt,
	}
}

// IsRegistrationOpen reports whether the program accepts new participants now.
// Unset dates do not restrict registration.
func IsRegistrationOpen(program entity.Program, now time.Time) bool {
	if !program.OpenRegistration.IsZero() && now.Before(program.OpenRegistration) {
		return false
	}
	if !program.CloseRegistration.IsZero() && now.After(program.CloseRegistration) {
		return false
	}
	return true
}

func (service *PackageService) toResponse(ctx context.Context, pkg entity.Package) model.PackageResponse {
	now := service.Now()
	current := pkg.CurrentPrice(now)

	response := model.PackageResponse{
		PackageID:         pkg.PackageID,
		ProgramID:         pkg.ProgramID,
		Code:              pkg.Code,
		Name:              pkg.Name,
		Description:       pkg.Description,
		Price:             pkg.Price,
		LaunchPrice:       pkg.LaunchPrice,
		LaunchPriceUntil:  pkg.LaunchPriceUntil,
		CurrentPrice:      current,
		IsLaunchPrice:     current != pkg.Price,
		IsFree:            current == 0,
		NormalValue:       pkg.NormalValue,
		TryoutCount:       pkg.TryoutCount,
		ClassCount:        pkg.ClassCount,
		RecordingDays:     pkg.RecordingDays,
		MentoringSessions: pkg.MentoringSessions,
		HasExplanation:    pkg.HasExplanation,
		HasWeeklyReport:   pkg.HasWeeklyReport,
		HasStudyGroup:     pkg.HasStudyGroup,
		HasCertificate:    pkg.HasCertificate,
		Features:          []string(pkg.Features),
		Quota:             pkg.Quota,
		Badge:             pkg.Badge,
		SortOrder:         pkg.SortOrder,
		IsActive:          pkg.IsActive,
	}
	if response.Features == nil {
		response.Features = []string{}
	}

	// Price per session: per tryout, which in class packages comes with its class.
	if pkg.TryoutCount > 0 {
		response.PricePerSession = current / pkg.TryoutCount
	}
	if pkg.NormalValue > 0 && current < pkg.NormalValue {
		response.SavingsPercent = int(math.Round(float64(pkg.NormalValue-current) / float64(pkg.NormalValue) * 100))
	}

	if pkg.Quota != nil {
		reserved, err := service.OrderRepository.CountReserved(ctx, service.OrderRepository.DB, pkg.PackageID, now)
		if err == nil {
			remaining := *pkg.Quota - int(reserved)
			if remaining < 0 {
				remaining = 0
			}
			response.RemainingQuota = &remaining
			response.IsSoldOut = remaining == 0
		}
	}
	return response
}

// ListForProgram returns the active packages of a program. When userID is set,
// it marks which package the user owns and which ones they can buy.
func (service *PackageService) ListForProgram(ctx context.Context, programID string, userID string) (model.ProgramPackagesResponse, error) {
	id, err := parseID(programID, "program_id")
	if err != nil {
		return model.ProgramPackagesResponse{}, err
	}
	program, err := service.ProgramRepository.FindByID(ctx, id)
	if err != nil {
		return model.ProgramPackagesResponse{}, exception.NotFoundError{Message: "program Not Found"}
	}

	packages, err := service.PackageRepository.FindByProgram(ctx, id, true)
	if err != nil {
		return model.ProgramPackagesResponse{}, err
	}

	var owned *entity.Package
	isMember := false
	if userID != "" {
		memberships, err := service.AccessService.Memberships(ctx, userID)
		if err != nil {
			return model.ProgramPackagesResponse{}, err
		}
		if membership, ok := memberships[id]; ok {
			isMember = true
			owned = membership.Package
		}
	}

	open := IsRegistrationOpen(program, service.Now())
	response := model.ProgramPackagesResponse{
		Program:            toProgramResponse(program),
		IsRegistrationOpen: open,
		Packages:           make([]model.PackageResponse, 0, len(packages)),
	}
	if owned != nil {
		response.OwnedPackageID = &owned.PackageID
	}

	for _, pkg := range packages {
		item := service.toResponse(ctx, pkg)
		if userID != "" {
			item.IsOwned = owned != nil && owned.PackageID == pkg.PackageID
			item.IsUpgrade = owned != nil && pkg.SortOrder > owned.SortOrder
			// Legacy members (no package) already have full access.
			canBuy := open && !item.IsSoldOut && (!isMember || item.IsUpgrade)
			if owned != nil && item.IsFree {
				canBuy = false
			}
			item.CanPurchase = canBuy
		}
		response.Packages = append(response.Packages, item)
	}
	return response, nil
}

// ListAllForProgram returns every package of a program, for admins.
func (service *PackageService) ListAllForProgram(ctx context.Context, programID string) ([]model.PackageResponse, error) {
	id, err := parseID(programID, "program_id")
	if err != nil {
		return nil, err
	}
	packages, err := service.PackageRepository.FindByProgram(ctx, id, false)
	if err != nil {
		return nil, err
	}
	responses := make([]model.PackageResponse, 0, len(packages))
	for _, pkg := range packages {
		responses = append(responses, service.toResponse(ctx, pkg))
	}
	return responses, nil
}

func (service *PackageService) FindByID(ctx context.Context, packageID string) (model.PackageResponse, error) {
	pkg, err := service.find(ctx, packageID)
	if err != nil {
		return model.PackageResponse{}, err
	}
	return service.toResponse(ctx, pkg), nil
}

func (service *PackageService) find(ctx context.Context, packageID string) (entity.Package, error) {
	id, err := parseID(packageID, "package_id")
	if err != nil {
		return entity.Package{}, err
	}
	pkg, err := service.PackageRepository.FindByID(ctx, id)
	if errors.Is(err, repository.ErrPackageNotFound) {
		return entity.Package{}, exception.NotFoundError{Message: "paket tidak ditemukan"}
	}
	return pkg, err
}

func validateLaunchPrice(price int, launchPrice *int, launchUntil *time.Time) error {
	if launchPrice == nil {
		return nil
	}
	if launchUntil == nil {
		return exception.BadRequestError{Message: "launch_price_until wajib diisi bila ada harga peluncuran"}
	}
	if *launchPrice > price {
		return exception.BadRequestError{Message: "harga peluncuran tidak boleh lebih mahal dari harga normal"}
	}
	return nil
}

func cleanFeatures(features []string) pq.StringArray {
	cleaned := pq.StringArray{}
	for _, feature := range features {
		if feature = strings.TrimSpace(feature); feature != "" {
			cleaned = append(cleaned, feature)
		}
	}
	return cleaned
}

func (service *PackageService) Create(ctx context.Context, request model.CreatePackageRequest) (model.PackageResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.PackageResponse{}, err
	}
	if _, err := service.ProgramRepository.FindByID(ctx, request.ProgramID); err != nil {
		return model.PackageResponse{}, exception.NotFoundError{Message: "program Not Found"}
	}
	if err := validateLaunchPrice(request.Price, request.LaunchPrice, request.LaunchPriceUntil); err != nil {
		return model.PackageResponse{}, err
	}

	pkg, err := service.PackageRepository.Create(ctx, entity.Package{
		ProgramID:         request.ProgramID,
		Code:              strings.ToLower(strings.TrimSpace(request.Code)),
		Name:              strings.TrimSpace(request.Name),
		Description:       request.Description,
		Price:             request.Price,
		LaunchPrice:       request.LaunchPrice,
		LaunchPriceUntil:  request.LaunchPriceUntil,
		NormalValue:       request.NormalValue,
		TryoutCount:       request.TryoutCount,
		ClassCount:        request.ClassCount,
		RecordingDays:     request.RecordingDays,
		MentoringSessions: request.MentoringSessions,
		HasExplanation:    request.HasExplanation,
		HasWeeklyReport:   request.HasWeeklyReport,
		HasStudyGroup:     request.HasStudyGroup,
		HasCertificate:    request.HasCertificate,
		Features:          cleanFeatures(request.Features),
		Quota:             request.Quota,
		Badge:             request.Badge,
		SortOrder:         request.SortOrder,
		IsActive:          request.IsActive,
	})
	if err != nil {
		if strings.Contains(err.Error(), "packages_program_id_code_key") {
			return model.PackageResponse{}, exception.BadRequestError{Message: "kode paket sudah dipakai di program ini"}
		}
		return model.PackageResponse{}, err
	}
	return service.toResponse(ctx, pkg), nil
}

func (service *PackageService) Update(ctx context.Context, packageID string, request model.UpdatePackageRequest) (model.PackageResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.PackageResponse{}, err
	}
	pkg, err := service.find(ctx, packageID)
	if err != nil {
		return model.PackageResponse{}, err
	}

	changes := map[string]interface{}{}
	setString := func(column string, value *string) {
		if value != nil {
			changes[column] = strings.TrimSpace(*value)
		}
	}
	setInt := func(column string, value *int) {
		if value != nil {
			changes[column] = *value
		}
	}
	setBool := func(column string, value *bool) {
		if value != nil {
			changes[column] = *value
		}
	}

	if request.Code != nil {
		changes["code"] = strings.ToLower(strings.TrimSpace(*request.Code))
	}
	setString("name", request.Name)
	setString("description", request.Description)
	setString("badge", request.Badge)
	setInt("price", request.Price)
	setInt("normal_value", request.NormalValue)
	setInt("tryout_count", request.TryoutCount)
	setInt("class_count", request.ClassCount)
	setInt("recording_days", request.RecordingDays)
	setInt("mentoring_sessions", request.MentoringSessions)
	setInt("sort_order", request.SortOrder)
	setBool("has_explanation", request.HasExplanation)
	setBool("has_weekly_report", request.HasWeeklyReport)
	setBool("has_study_group", request.HasStudyGroup)
	setBool("has_certificate", request.HasCertificate)
	setBool("is_active", request.IsActive)
	if request.Features != nil {
		changes["features"] = cleanFeatures(*request.Features)
	}

	if request.ClearQuota {
		changes["quota"] = nil
	} else if request.Quota != nil {
		changes["quota"] = *request.Quota
	}

	price := pkg.Price
	if request.Price != nil {
		price = *request.Price
	}
	if request.ClearLaunchPrice {
		changes["launch_price"] = nil
		changes["launch_price_until"] = nil
	} else if request.LaunchPrice != nil || request.LaunchPriceUntil != nil {
		launchPrice := pkg.LaunchPrice
		if request.LaunchPrice != nil {
			launchPrice = request.LaunchPrice
		}
		launchUntil := pkg.LaunchPriceUntil
		if request.LaunchPriceUntil != nil {
			launchUntil = request.LaunchPriceUntil
		}
		if err := validateLaunchPrice(price, launchPrice, launchUntil); err != nil {
			return model.PackageResponse{}, err
		}
		changes["launch_price"] = launchPrice
		changes["launch_price_until"] = launchUntil
	}

	if err := service.PackageRepository.UpdateFields(ctx, pkg.PackageID, changes); err != nil {
		if strings.Contains(err.Error(), "packages_program_id_code_key") {
			return model.PackageResponse{}, exception.BadRequestError{Message: "kode paket sudah dipakai di program ini"}
		}
		return model.PackageResponse{}, err
	}
	return service.FindByID(ctx, packageID)
}

// Delete removes a package that nobody has ordered yet; otherwise deactivate it.
func (service *PackageService) Delete(ctx context.Context, packageID string) error {
	pkg, err := service.find(ctx, packageID)
	if err != nil {
		return err
	}
	_, total, err := service.OrderRepository.FindAll(ctx, repository.FindOrdersParams{PackageID: pkg.PackageID.String(), Limit: 1})
	if err != nil {
		return err
	}
	if total > 0 {
		return exception.BadRequestError{Message: "paket sudah pernah dipesan; nonaktifkan saja (is_active = false)"}
	}
	return service.PackageRepository.Delete(ctx, pkg.PackageID)
}

// ProgramHasPackages reports whether a program is sold through packages.
func (service *PackageService) ProgramHasPackages(ctx context.Context, programID uuid.UUID) bool {
	packages, err := service.PackageRepository.FindByProgram(ctx, programID, false)
	return err == nil && len(packages) > 0
}
