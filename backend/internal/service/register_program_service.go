package service

import (
	"context"
	"log"
	"path/filepath"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
)

type RegisterProgramService struct {
	UserService               *UserService
	ProgramService            *ProgramService
	TransactionProgramService *TransactionProgramService
	PackageRepository         *repository.PackageRepository
	Uploader                  *manager.Uploader
}

func NewRegisterProgramService(userService *UserService, programService *ProgramService, transactionProgramService *TransactionProgramService, packageRepository *repository.PackageRepository, uploader *manager.Uploader) RegisterProgramService {
	return RegisterProgramService{
		UserService:               userService,
		ProgramService:            programService,
		TransactionProgramService: transactionProgramService,
		PackageRepository:         packageRepository,
		Uploader:                  uploader,
	}
}

func (service *RegisterProgramService) RegisterProgram(ctx context.Context, request model.RegisterProgramModel, otpConfig model.SendOtpConfig) error {
	if err := common.Validate(request); err != nil {
		return exception.ValidationError{Message: err.Error()}
	}

	userId := request.UserID

	// Programs sold through packages (TELISIK) cannot be joined for free here.
	programID, err := parseID(request.ProgramID, "program_id")
	if err != nil {
		return err
	}
	if service.PackageRepository != nil {
		packages, err := service.PackageRepository.FindByProgram(ctx, programID, false)
		if err != nil {
			return err
		}
		if len(packages) > 0 {
			return exception.BadRequestError{Message: "Program ini memakai paket. Silakan pilih paket di halaman Paket."}
		}
	}

	// The registration form doubles as a profile update.
	user, err := service.UserService.UpdateProfile(ctx, userId, model.UpdateMyProfileRequest{
		ProfileFields: model.ProfileFields{
			Name:     &request.Name,
			Grade:    &request.Grade,
			NISN:     &request.NISN,
			School:   &request.School,
			Regency:  &request.Regency,
			Province: &request.Province,
		},
	})
	if err != nil {
		return err
	}

	if _, err := service.UserService.UpdateImage(ctx, model.UploadFileRequest{
		FileHeader:  request.File,
		ContentType: request.File.Header.Get("Content-Type"),
		FolderName:  "users",
		FileName:    userId + filepath.Ext(request.File.Filename),
	}, userId); err != nil {
		return err
	}

	transactionProgramResult, err := service.TransactionProgramService.Create(ctx, model.CreateTransactionProgramRequest{
		UserID:     userId,
		ProgramID:  request.ProgramID,
		Status:     "COMPLETED",
		Motivation: request.Motivation,
	})
	if err != nil {
		return err
	}

	// The registration is already stored; a failed confirmation email must not
	// turn it into an error for the participant.
	err = helper.SendMail(
		otpConfig,
		user.Email,
		"Selamat! Pendaftaran Program Berhasil",
		helper.TemplateProgramRegistrationSuccess(user.Name, user.Email, transactionProgramResult.InvoiceNumber, transactionProgramResult.Program.Name),
	)
	if err != nil {
		log.Printf("failed to send program registration email: %v", err)
	}

	return nil
}
