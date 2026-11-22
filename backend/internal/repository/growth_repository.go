package repository

import (
	"context"
	"errors"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrClaimNotFound       = errors.New("guarantee claim Not Found")
	ErrCertificateNotFound = errors.New("certificate Not Found")
)

// GrowthRepository stores referral rewards, guarantee claims and certificates.
type GrowthRepository struct {
	*gorm.DB
}

func NewGrowthRepository(DB *gorm.DB) GrowthRepository {
	return GrowthRepository{DB: DB}
}

func (repository *GrowthRepository) SumReferralBonus(ctx context.Context, referrerID uuid.UUID) (int, error) {
	var total int
	err := repository.DB.WithContext(ctx).Model(&entity.ReferralReward{}).
		Select("COALESCE(SUM(bonus_tryouts), 0)").Where("referrer_user_id = ?", referrerID).Scan(&total).Error
	return total, err
}

func (repository *GrowthRepository) CreateClaim(ctx context.Context, claim entity.GuaranteeClaim) (entity.GuaranteeClaim, error) {
	if claim.ClaimID == uuid.Nil {
		claim.ClaimID = uuid.New()
	}
	err := repository.DB.WithContext(ctx).Create(&claim).Error
	return claim, err
}

func (repository *GrowthRepository) FindClaim(ctx context.Context, userID uuid.UUID, programID uuid.UUID) (entity.GuaranteeClaim, bool) {
	var claim entity.GuaranteeClaim
	result := repository.DB.WithContext(ctx).Where("user_id = ? AND program_id = ?", userID, programID).Limit(1).Find(&claim)
	return claim, result.Error == nil && result.RowsAffected > 0
}

func (repository *GrowthRepository) FindClaimByID(ctx context.Context, claimID uuid.UUID) (entity.GuaranteeClaim, error) {
	var claim entity.GuaranteeClaim
	result := repository.DB.WithContext(ctx).Where("claim_id = ?", claimID).Limit(1).Find(&claim)
	if result.Error != nil {
		return entity.GuaranteeClaim{}, result.Error
	}
	if result.RowsAffected == 0 {
		return entity.GuaranteeClaim{}, ErrClaimNotFound
	}
	return claim, nil
}

func (repository *GrowthRepository) ListClaims(ctx context.Context, status string) ([]entity.GuaranteeClaim, error) {
	var claims []entity.GuaranteeClaim
	query := repository.DB.WithContext(ctx).Preload("User").Order("created_at DESC")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Find(&claims).Error
	return claims, err
}

func (repository *GrowthRepository) UpdateClaim(ctx context.Context, tx *gorm.DB, claimID uuid.UUID, fields map[string]interface{}) error {
	fields["updated_at"] = time.Now()
	return tx.WithContext(ctx).Model(&entity.GuaranteeClaim{}).Where("claim_id = ?", claimID).Updates(fields).Error
}

func (repository *GrowthRepository) FindCertificate(ctx context.Context, userID uuid.UUID, programID uuid.UUID) (entity.Certificate, bool) {
	var certificate entity.Certificate
	result := repository.DB.WithContext(ctx).Where("user_id = ? AND program_id = ?", userID, programID).Limit(1).Find(&certificate)
	return certificate, result.Error == nil && result.RowsAffected > 0
}

func (repository *GrowthRepository) FindCertificateByNumber(ctx context.Context, number string) (entity.Certificate, error) {
	var certificate entity.Certificate
	result := repository.DB.WithContext(ctx).Where("certificate_number = ?", number).Limit(1).Find(&certificate)
	if result.Error != nil {
		return entity.Certificate{}, result.Error
	}
	if result.RowsAffected == 0 {
		return entity.Certificate{}, ErrCertificateNotFound
	}
	return certificate, nil
}

func (repository *GrowthRepository) CreateCertificate(ctx context.Context, certificate entity.Certificate) (entity.Certificate, error) {
	if certificate.CertificateID == uuid.Nil {
		certificate.CertificateID = uuid.New()
	}
	err := repository.DB.WithContext(ctx).Create(&certificate).Error
	return certificate, err
}
