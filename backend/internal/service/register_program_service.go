package service

import (
	"context"
	"fmt"
	"log"
	"path/filepath"
	"strconv"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"gopkg.in/gomail.v2"
)

type RegisterProgramService struct {
	UserService               *UserService
	ProgramService            *ProgramService
	TransactionProgramService *TransactionProgramService
	Uploader                  *manager.Uploader
}

func NewRegisterProgramService(userService *UserService, programService *ProgramService, transactionProgramService *TransactionProgramService, uploader *manager.Uploader) RegisterProgramService {
	return RegisterProgramService{
		UserService:               userService,
		ProgramService:            programService,
		TransactionProgramService: transactionProgramService,
		Uploader:                  uploader,
	}
}

func (service *RegisterProgramService) RegisterProgram(ctx context.Context, request model.RegisterProgramModel, otpConfig model.SendOtpConfig) error {
	err := common.Validate(request)
	if err != nil {
		return exception.ValidationError{
			Message: err.Error(),
		}
	}

	var userId = request.UserID

	_, err = service.UserService.FindById(ctx, userId)
	if err != nil {
		return err
	}

	resUpdateUser, err := service.UserService.Update(ctx, model.UpdateUserRequest{
		Name:     request.Name,
		Grade:    request.Grade,
		NISN:     request.NISN,
		School:   request.School,
		Regency:  request.Regency,
		Province: request.Province,
	}, userId)

	if err != nil {
		return err
	}

	fmt.Println(resUpdateUser)

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

	transactionProgramResult, err := service.TransactionProgramService.Create(ctx, transactionProgram)
	if err != nil {
		return err
	}

	mailer := gomail.NewMessage()
	mailer.SetHeader("From", otpConfig.SenderName)
	mailer.SetHeader("To", request.Email)
	mailer.SetHeader("Subject", "Selamat! Pendaftaran Program Berhasil")
	mailer.SetBody("text/html", helper.TemplateProgramRegistrationSuccess(request.Name, request.Email, transactionProgramResult.InvoiceNumber, transactionProgramResult.Program.Name))

	smptPort, _ := strconv.Atoi(otpConfig.SmtpPort)

	dialer := gomail.NewDialer(
		otpConfig.SmtpHost,
		smptPort,
		otpConfig.AuthEmail,
		otpConfig.AuthPassword,
	)

	err = dialer.DialAndSend(mailer)
	if err != nil {
		log.Fatal(err.Error())
	}

	log.Println("Mail sent!")

	return nil
}
