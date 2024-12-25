package service

import (
	"context"
	"path/filepath"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

type CustomService struct {
	UserService               *UserService
	ProgramService            *ProgramService
	TransactionProgramService *TransactionProgramService
	Uploader                  *s3manager.Uploader
}

func NewCustomService(userService *UserService, programService *ProgramService, transactionProgramService *TransactionProgramService, uploader *s3manager.Uploader) CustomService {
	return CustomService{
		UserService:               userService,
		ProgramService:            programService,
		TransactionProgramService: transactionProgramService,
		Uploader:                  uploader,
	}
}

func (service *CustomService) RegisterBatch5(ctx context.Context, request model.Batch5Model) error {
	err := common.Validate(request)
	if err != nil {
		return exception.ValidationError{
			Message: err.Error(),
		}
	}
	var userId string
	emailRequest := model.CheckByEmailRequest{
		Email: request.Email,
	}
	generatePassword := helper.GenerateOTP(6)

	_, err = service.ProgramService.FindByID(ctx, request.ProgramID)
	if err != nil {
		return err
	}

	isEmailExist, _ := service.UserService.CheckByEmail(ctx, emailRequest)

	if !isEmailExist {
		resCreateUser, err := service.UserService.Create(ctx, model.RegisterRequest{
			Email:    request.Email,
			Password: generatePassword,
			Username: request.Name,
			Name:     request.Name,
			Role:     "user",
			Grade:    request.Grade,
			School:   request.School,
			Regency:  request.Regency,
			Province: request.Province,
		})

		userId = resCreateUser.UserID.String()

		if err != nil {
			return err
		}
	} else {
		user, err := service.UserService.FindByEmail(ctx, request.Email)
		if err != nil {
			return err
		}

		userId = user.UserID.String()

		service.UserService.Update(ctx, model.UpdateUserRequest{
			Grade:    request.Grade,
			School:   request.School,
			Regency:  request.Regency,
			Province: request.Province,
		}, userId)

	}

	requestFile := model.UploadFileRequest{
		FileHeader:  request.File,
		ContentType: request.File.Header.Get("Content-Type"),
		FolderName:  "users",
		FileName:    userId + filepath.Ext(request.File.Filename),
	}

	service.UserService.UpdateImage(ctx, requestFile, userId)

	transactionProgram := model.CreateTransactionProgramRequest{
		UserID:     userId,
		ProgramID:  request.ProgramID,
		Status:     "COMPLETED",
		Motivation: request.Motivation,
	}

	_, err = service.TransactionProgramService.Create(ctx, transactionProgram)
	if err != nil {
		return err
	}

	return nil
}
