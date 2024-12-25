package service

import (
	"context"
	"log"
	"path/filepath"
	"strconv"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/gomail.v2"
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

func (service *CustomService) RegisterBatch5(ctx context.Context, request model.Batch5Model, otpConfig model.SendOtpConfig) error {
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

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(generatePassword), bcrypt.DefaultCost)

	if !isEmailExist {
		resCreateUser, err := service.UserService.Create(ctx, model.RegisterRequest{
			Email:    request.Email,
			Password: string(hashedPassword),
			Username: helper.GenerateUsernameByEmail(request.Email),
			Name:     request.Name,
			Role:     "user",
			NISN:     request.NISN,
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
			Password: string(hashedPassword),
			Grade:    request.Grade,
			NISN:     request.NISN,
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

	mailer := gomail.NewMessage()
	mailer.SetHeader("From", otpConfig.SenderName)
	mailer.SetHeader("To", request.Email)
	mailer.SetHeader("Subject", "Selamat Datang di Telisik!")
	mailer.SetBody("text/html", helper.TemplateEmailRegisterGenerate(request.Name, request.Email, generatePassword))

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
