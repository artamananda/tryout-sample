package service

import (
	"context"
	"fmt"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

// AccessService decides what a participant may open, based on the program
// registration and the package held in transaction_programs.
type AccessService struct {
	TransactionProgramRepository *repository.TransactionProgramRepository
	PackageRepository            *repository.PackageRepository
	Now                          func() time.Time
}

func NewAccessService(transactionProgramRepository *repository.TransactionProgramRepository, packageRepository *repository.PackageRepository) AccessService {
	return AccessService{
		TransactionProgramRepository: transactionProgramRepository,
		PackageRepository:            packageRepository,
		Now:                          time.Now,
	}
}

// Membership is what a user holds in one program. Package is nil for older
// registrations made before packages existed; those keep full access.
type Membership struct {
	ProgramID uuid.UUID
	Package   *entity.Package
}

// TryoutAccess explains whether a participant can open a tryout.
type TryoutAccess struct {
	HasAccess bool   `json:"has_access"`
	Reason    string `json:"locked_reason,omitempty"`
}

// Memberships loads every program the user is registered to, with packages.
func (service *AccessService) Memberships(ctx context.Context, userID string) (map[uuid.UUID]Membership, error) {
	rows, err := service.TransactionProgramRepository.FindAccessByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	packageIDs := []uuid.UUID{}
	for _, row := range rows {
		if row.PackageID != nil {
			packageIDs = append(packageIDs, *row.PackageID)
		}
	}
	packages, err := service.PackageRepository.FindByIDs(ctx, packageIDs)
	if err != nil {
		return nil, err
	}
	packageByID := map[uuid.UUID]entity.Package{}
	for _, pkg := range packages {
		packageByID[pkg.PackageID] = pkg
	}

	memberships := map[uuid.UUID]Membership{}
	for _, row := range rows {
		membership := Membership{ProgramID: row.ProgramID}
		if row.PackageID != nil {
			if pkg, ok := packageByID[*row.PackageID]; ok {
				pkgCopy := pkg
				membership.Package = &pkgCopy
			}
		}
		// Keep the best package if a user somehow has several rows.
		if existing, ok := memberships[row.ProgramID]; ok && !isBetterPackage(membership.Package, existing.Package) {
			continue
		}
		memberships[row.ProgramID] = membership
	}
	return memberships, nil
}

// isBetterPackage reports whether candidate gives more than current. A nil
// package (legacy full access) beats any package.
func isBetterPackage(candidate *entity.Package, current *entity.Package) bool {
	if current == nil {
		return false
	}
	if candidate == nil {
		return true
	}
	return candidate.SortOrder > current.SortOrder
}

// Evaluate checks one tryout against the user's memberships.
func (service *AccessService) Evaluate(tryout entity.Tryout, memberships map[uuid.UUID]Membership) TryoutAccess {
	if tryout.ProgramID == nil {
		return TryoutAccess{HasAccess: true}
	}
	membership, ok := memberships[*tryout.ProgramID]
	if !ok {
		return TryoutAccess{Reason: "Tryout ini khusus peserta program. Pilih paket untuk mengikutinya."}
	}
	if membership.Package == nil || tryout.Sequence <= 0 {
		return TryoutAccess{HasAccess: true}
	}
	if tryout.Sequence > membership.Package.TryoutCount {
		return TryoutAccess{Reason: fmt.Sprintf("Paket %s mencakup TO 1 sampai %d. Tingkatkan paket untuk membuka TO %d.",
			membership.Package.Name, membership.Package.TryoutCount, tryout.Sequence)}
	}
	return TryoutAccess{HasAccess: true}
}

// EnsureCanStart returns an error a participant should see when they may not
// start the tryout now. alreadyStarted lets a participant who began before the
// close time come back to finish.
func (service *AccessService) EnsureCanStart(ctx context.Context, userID string, tryout entity.Tryout, alreadyStarted bool) error {
	memberships, err := service.Memberships(ctx, userID)
	if err != nil {
		return err
	}
	if access := service.Evaluate(tryout, memberships); !access.HasAccess {
		return exception.BadRequestError{Message: access.Reason}
	}

	if tryout.ProgramID != nil && !alreadyStarted {
		now := service.Now()
		if !tryout.StartTime.IsZero() && now.Before(tryout.StartTime) {
			return exception.BadRequestError{Message: "Tryout belum dibuka. Dibuka pada " + formatWIB(tryout.StartTime) + "."}
		}
		if !tryout.EndTime.IsZero() && now.After(tryout.EndTime) {
			return exception.BadRequestError{Message: "Tryout sudah ditutup pada " + formatWIB(tryout.EndTime) + "."}
		}
	}
	return nil
}

// CanReviewExplanation reports whether the participant may see the answer key
// and written explanations: the tryout must be closed and the package must
// include explanations.
func (service *AccessService) CanReviewExplanation(ctx context.Context, userID string, tryout entity.Tryout) bool {
	if tryout.EndTime.IsZero() || service.Now().Before(tryout.EndTime) {
		return false
	}
	if tryout.ProgramID == nil {
		return true
	}
	memberships, err := service.Memberships(ctx, userID)
	if err != nil {
		return false
	}
	membership, ok := memberships[*tryout.ProgramID]
	if !ok {
		return false
	}
	return membership.Package == nil || membership.Package.HasExplanation
}

var wib = time.FixedZone("WIB", 7*60*60)

func formatWIB(t time.Time) string {
	return t.In(wib).Format("02 Jan 2006 15.04") + " WIB"
}
