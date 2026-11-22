package service

import (
	"context"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
)

type TransactionTryoutService struct {
	TransactionTryoutRepository *repository.TransactionTryoutRepository
}

func NewTransactionTryoutService(transactionTryoutRepository *repository.TransactionTryoutRepository) TransactionTryoutService {
	return TransactionTryoutService{
		TransactionTryoutRepository: transactionTryoutRepository,
	}
}

func (service *TransactionTryoutService) Create(ctx context.Context, request model.CreateTransactionTryoutRequest) (model.TransactionTryoutResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.TransactionTryoutResponse{}, exception.ValidationError{Message: err.Error()}
	}
	transactionTryout := entity.TransactionTryout{
		TryoutID: request.TryoutID,
		UserID:   request.UserID,
		Status:   "UNPAID",
	}

	transactionTryout = service.TransactionTryoutRepository.Create(ctx, transactionTryout)

	return model.TransactionTryoutResponse{
		TransactionTryoutID: transactionTryout.TransactionTryoutID,
		TryoutID:            transactionTryout.TryoutID,
		UserID:              transactionTryout.UserID,
		Status:              transactionTryout.Status,
		StartTime:           transactionTryout.StartTime,
		EndTime:             transactionTryout.EndTime,
	}, nil
}

func (service *TransactionTryoutService) Update(ctx context.Context, request model.UpdateTransactionTryoutRequest, transactionTryoutID string) (model.TransactionTryoutResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.TransactionTryoutResponse{}, exception.ValidationError{Message: err.Error()}
	}

	transactionTryout, err := service.TransactionTryoutRepository.FindById(ctx, transactionTryoutID)
	if err != nil {
		return model.TransactionTryoutResponse{}, exception.NotFoundError{Message: err.Error()}
	}

	transactionTryout.TryoutID = request.TryoutID
	transactionTryout.UserID = request.UserID
	transactionTryout.Status = request.Status
	transactionTryout.StartTime = request.StartTime
	transactionTryout.EndTime = request.EndTime

	transactionTryout = service.TransactionTryoutRepository.Update(ctx, transactionTryout)

	return model.TransactionTryoutResponse{
		TransactionTryoutID: transactionTryout.TransactionTryoutID,
		TryoutID:            transactionTryout.TryoutID,
		UserID:              transactionTryout.UserID,
		Status:              transactionTryout.Status,
		StartTime:           transactionTryout.StartTime,
		EndTime:             transactionTryout.EndTime,
	}, nil
}

func (service *TransactionTryoutService) Delete(ctx context.Context, transactionTryoutID string) error {
	transactionTryout, err := service.TransactionTryoutRepository.FindById(ctx, transactionTryoutID)
	if err != nil {
		return exception.NotFoundError{Message: err.Error()}
	}

	service.TransactionTryoutRepository.Delete(ctx, transactionTryout)

	return nil
}

func (service *TransactionTryoutService) FindByID(ctx context.Context, transactionTryoutID string) (model.TransactionTryoutResponse, error) {
	transactionTryout, err := service.TransactionTryoutRepository.FindById(ctx, transactionTryoutID)
	if err != nil {
		return model.TransactionTryoutResponse{}, exception.NotFoundError{Message: err.Error()}
	}

	return model.TransactionTryoutResponse{
		TransactionTryoutID: transactionTryout.TransactionTryoutID,
		TryoutID:            transactionTryout.TryoutID,
		UserID:              transactionTryout.UserID,
		Status:              transactionTryout.Status,
		StartTime:           transactionTryout.StartTime,
		EndTime:             transactionTryout.EndTime,
	}, nil
}

func (service *TransactionTryoutService) FindByTryoutIDAndUserID(ctx context.Context, tryoutId string, userId string) (model.TransactionTryoutResponse, error) {
	transactionTryout, err := service.TransactionTryoutRepository.FindByTryoutIdAndUserId(ctx, tryoutId, userId)
	isDone := false
	if err != nil {
		return model.TransactionTryoutResponse{}, exception.NotFoundError{Message: err.Error()}
	}

	endTime := transactionTryout.StartTime.Add(time.Duration(transactionTryout.Tryout.Duration) * time.Minute)

	if !transactionTryout.StartTime.IsZero() {
		if endTime.Before(time.Now()) || !transactionTryout.EndTime.IsZero() {
			isDone = true
		}
	}

	tryoutRes := model.TryoutResponse{
		TryoutID:    transactionTryout.Tryout.TryoutID,
		Title:       transactionTryout.Tryout.Title,
		Duration:    transactionTryout.Tryout.Duration,
		StartTime:   transactionTryout.Tryout.StartTime,
		EndTime:     transactionTryout.Tryout.EndTime,
		IsPublished: transactionTryout.Tryout.IsPublished,
		ShowScore:   transactionTryout.Tryout.ShowScore,
		Sequence:    transactionTryout.Tryout.Sequence,
		ScoringMode: transactionTryout.Tryout.ScoringMode,
		CreatedAt:   transactionTryout.Tryout.CreatedAt,
		UpdatedAt:   transactionTryout.Tryout.UpdatedAt,
	}

	return model.TransactionTryoutResponse{
		TransactionTryoutID: transactionTryout.TransactionTryoutID,
		TryoutID:            transactionTryout.TryoutID,
		UserID:              transactionTryout.UserID,
		Status:              transactionTryout.Status,
		StartTime:           transactionTryout.StartTime,
		EndTime:             transactionTryout.EndTime,
		IsDone:              isDone,
		Tryout:              tryoutRes,
		CreatedAt:           transactionTryout.CreatedAt,
		UpdatedAt:           transactionTryout.UpdatedAt,
	}, nil
}

func (service *TransactionTryoutService) FindAll(ctx context.Context) []model.TransactionTryoutResponse {
	transactionTryouts := service.TransactionTryoutRepository.FindAll(ctx)

	transactionTryoutResponse := []model.TransactionTryoutResponse{}
	for _, transactionTryout := range transactionTryouts {
		transactionTryoutResponse = append(transactionTryoutResponse,
			model.TransactionTryoutResponse{
				TransactionTryoutID: transactionTryout.TransactionTryoutID,
				TryoutID:            transactionTryout.TryoutID,
				UserID:              transactionTryout.UserID,
				Status:              transactionTryout.Status,
				StartTime:           transactionTryout.StartTime,
				EndTime:             transactionTryout.EndTime,
			},
		)
	}
	if len(transactionTryouts) == 0 {
		return []model.TransactionTryoutResponse{}
	}

	return transactionTryoutResponse
}

// Transaction statuses: a participant creates the transaction (UNPAID),
// redeems the token to start (PAID) and finishes (COMPLETED).
const (
	TransactionTryoutUnpaid    = "UNPAID"
	TransactionTryoutPaid      = "PAID"
	TransactionTryoutCompleted = "COMPLETED"
)

// HasStarted reports whether the user redeemed the token for the tryout,
// i.e. is working on it or already finished it.
func (service *TransactionTryoutService) HasStarted(ctx context.Context, tryoutID string, userID string) bool {
	transaction, err := service.FindByTryoutIDAndUserID(ctx, tryoutID, userID)
	if err != nil {
		return false
	}
	return transaction.Status == TransactionTryoutPaid || transaction.Status == TransactionTryoutCompleted
}

// answerGracePeriod lets the last answer that was sent right when the timer
// ran out still be stored.
const answerGracePeriod = 2 * time.Minute

// IsInProgress reports whether the user may still submit answers: the token
// was redeemed, the tryout is not finished and the time is not over.
func (service *TransactionTryoutService) IsInProgress(ctx context.Context, tryoutID string, userID string) bool {
	transaction, err := service.TransactionTryoutRepository.FindByTryoutIdAndUserId(ctx, tryoutID, userID)
	if err != nil || transaction.Status != TransactionTryoutPaid || !transaction.EndTime.IsZero() {
		return false
	}
	if transaction.StartTime.IsZero() {
		return true
	}
	deadline := transaction.StartTime.
		Add(time.Duration(transaction.Tryout.Duration) * time.Minute).
		Add(answerGracePeriod)
	return time.Now().Before(deadline)
}

// FindByUserID returns all transactions of one user.
func (service *TransactionTryoutService) FindByUserID(ctx context.Context, userID string) []model.TransactionTryoutResponse {
	results := []model.TransactionTryoutResponse{}
	for _, transaction := range service.TransactionTryoutRepository.FindByUserId(ctx, userID) {
		results = append(results, model.TransactionTryoutResponse{
			TransactionTryoutID: transaction.TransactionTryoutID,
			TryoutID:            transaction.TryoutID,
			UserID:              transaction.UserID,
			Status:              transaction.Status,
			StartTime:           transaction.StartTime,
			EndTime:             transaction.EndTime,
			CreatedAt:           transaction.CreatedAt,
			UpdatedAt:           transaction.UpdatedAt,
		})
	}
	return results
}
