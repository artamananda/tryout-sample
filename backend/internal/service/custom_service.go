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

type CustomService struct {
	UserService               *UserService
	ProgramService            *ProgramService
	TransactionProgramService *TransactionProgramService
	Uploader                  *manager.Uploader
}

func NewCustomService(userService *UserService, programService *ProgramService, transactionProgramService *TransactionProgramService, uploader *manager.Uploader) CustomService {
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

	if !isEmailExist {
		resCreateUser, err := service.UserService.Create(ctx, model.RegisterRequest{
			Email:    request.Email,
			Password: string(generatePassword),
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

		resUpdateUser, err := service.UserService.Update(ctx, model.UpdateUserRequest{
			Password: string(generatePassword),
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
