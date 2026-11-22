package repository

import (
	"context"
	"errors"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrPackageNotFound = errors.New("package Not Found")

type PackageRepository struct {
	*gorm.DB
}

func NewPackageRepository(DB *gorm.DB) PackageRepository {
	return PackageRepository{DB: DB}
}

func (repository *PackageRepository) Create(ctx context.Context, pkg entity.Package) (entity.Package, error) {
	if pkg.PackageID == uuid.Nil {
		pkg.PackageID = uuid.New()
	}
	err := repository.DB.WithContext(ctx).Create(&pkg).Error
	return pkg, err
}

func (repository *PackageRepository) UpdateFields(ctx context.Context, packageID uuid.UUID, fields map[string]interface{}) error {
	if len(fields) == 0 {
		return nil
	}
	fields["updated_at"] = time.Now()
	return repository.DB.WithContext(ctx).Model(&entity.Package{}).Where("package_id = ?", packageID).Updates(fields).Error
}

func (repository *PackageRepository) Delete(ctx context.Context, packageID uuid.UUID) error {
	return repository.DB.WithContext(ctx).Where("package_id = ?", packageID).Delete(&entity.Package{}).Error
}

func (repository *PackageRepository) FindByID(ctx context.Context, packageID uuid.UUID) (entity.Package, error) {
	var pkg entity.Package
	result := repository.DB.WithContext(ctx).Where("package_id = ?", packageID).Limit(1).Find(&pkg)
	if result.Error != nil {
		return entity.Package{}, result.Error
	}
	if result.RowsAffected == 0 {
		return entity.Package{}, ErrPackageNotFound
	}
	return pkg, nil
}

// FindByProgram lists the packages of a program, cheapest tier first.
func (repository *PackageRepository) FindByProgram(ctx context.Context, programID uuid.UUID, onlyActive bool) ([]entity.Package, error) {
	var packages []entity.Package
	query := repository.DB.WithContext(ctx).Where("program_id = ?", programID)
	if onlyActive {
		query = query.Where("is_active = ?", true)
	}
	err := query.Order("sort_order ASC, price ASC").Find(&packages).Error
	return packages, err
}

func (repository *PackageRepository) FindByIDs(ctx context.Context, packageIDs []uuid.UUID) ([]entity.Package, error) {
	if len(packageIDs) == 0 {
		return []entity.Package{}, nil
	}
	var packages []entity.Package
	err := repository.DB.WithContext(ctx).Where("package_id IN ?", packageIDs).Find(&packages).Error
	return packages, err
}
