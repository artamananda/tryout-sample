package service

import (
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/repository"
)

// UpgradeWindow is how long after the last payment a participant may move to
// a higher package by paying only the difference ("Paket Tambah").
const UpgradeWindow = 7 * 24 * time.Hour

// UpgradePrice returns what moving to target costs now. Inside the upgrade
// window the participant pays the target price minus what they already paid
// in the program; afterwards (or without any paid order) the full price.
func UpgradePrice(target entity.Package, paid repository.PaidSummary, now time.Time) int {
	price := target.CurrentPrice(now)
	if paid.Total <= 0 || paid.LastPaidAt == nil || now.Sub(*paid.LastPaidAt) > UpgradeWindow {
		return price
	}
	if difference := price - paid.Total; difference > 0 {
		return difference
	}
	return 0
}
