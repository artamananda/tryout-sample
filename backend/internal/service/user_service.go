package service

import (
	"context"
	"errors"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"golang.org/x/crypto/bcrypt"
)

const (
	otpLifetime       = 15 * time.Minute
	otpResendCooldown = 60 * time.Second
	birthDateLayout   = "2006-01-02"
)

// Genders and EducationLevels are the accepted values of those profile fields.
var (
	Genders         = map[string]bool{"male": true, "female": true}
	EducationLevels = map[string]bool{"SMA/SMK": true, "D3": true, "D4": true, "S1": true, "S2": true, "S3": true}
)

// ErrInvalidCredentials is returned for any failed login, so the response does
// not reveal whether the email exists.
var ErrInvalidCredentials = exception.UnauthorizedError{Message: "email atau password salah"}

type UserService struct {
	UserRepository *repository.UserRepository
	Uploader       *manager.Uploader
}

func NewUserService(userRepository *repository.UserRepository, uploader *manager.Uploader) UserService {
	return UserService{
		UserRepository: userRepository,
		Uploader:       uploader,
	}
}

// ToUserResponse maps a user entity to its public representation.
func ToUserResponse(user entity.User) model.GetUserResponse {
	birthDate := ""
	if user.BirthDate != nil && !user.BirthDate.IsZero() {
		birthDate = user.BirthDate.Format(birthDateLayout)
	}
	return model.GetUserResponse{
		UserID:         user.UserID,
		Username:       user.Username,
		Name:           user.Name,
		Email:          user.Email,
		Role:           user.Role,
		PhoneNumber:    user.PhoneNumber,
		Gender:         user.Gender,
		BirthDate:      birthDate,
		LastEducation:  user.LastEducation,
		Major:          user.Major,
		TargetAgency:   user.TargetAgency,
		TargetPosition: user.TargetPosition,
		NISN:           user.NISN,
		Grade:          user.Grade,
		School:         user.School,
		Regency:        user.Regency,
		Province:       user.Province,
		PictureURL:     user.PictureURL,
		LastLogin:      user.LastLogin,
		CreatedAt:      user.CreatedAt,
		UpdatedAt:      user.UpdatedAt,
	}
}

func hashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", exception.BadRequestError{Message: "password tidak valid"}
	}
	return string(hashed), nil
}

func (service *UserService) createUser(ctx context.Context, user entity.User) (model.RegisterResponse, error) {
	created, err := service.UserRepository.Create(ctx, user)
	if errors.Is(err, repository.ErrAccountAlreadyExists) {
		return model.RegisterResponse{}, exception.BadRequestError{Message: "email atau username sudah digunakan"}
	}
	if err != nil {
		return model.RegisterResponse{}, err
	}
	return ToUserResponse(created), nil
}

func (service *UserService) Create(ctx context.Context, request model.RegisterRequest) (model.RegisterResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.RegisterResponse{}, err
	}

	hashedPassword, err := hashPassword(request.Password)
	if err != nil {
		return model.RegisterResponse{}, err
	}

	return service.createUser(ctx, entity.User{
		Username:   strings.TrimSpace(request.Username),
		Name:       strings.TrimSpace(request.Name),
		Email:      strings.ToLower(strings.TrimSpace(request.Email)),
		Password:   hashedPassword,
		Role:       request.Role,
		NISN:       request.NISN,
		Grade:      request.Grade,
		School:     request.School,
		Regency:    request.Regency,
		Province:   request.Province,
		PictureURL: request.PictureURL,
	})
}

func (service *UserService) CreateBulk(ctx context.Context, requests []model.RegisterRequest) ([]model.RegisterResponse, error) {
	responses := []model.RegisterResponse{}

	for _, request := range requests {
		if err := common.Validate(request); err != nil {
			return responses, err
		}
	}

	for _, request := range requests {
		response, err := service.Create(ctx, request)
		if err != nil {
			responses = append(responses, model.RegisterResponse{})
			continue
		}
		responses = append(responses, response)
	}

	return responses, nil
}

// buildProfileChanges validates the profile patch and returns the columns to update.
func (service *UserService) buildProfileChanges(ctx context.Context, user entity.User, fields model.ProfileFields) (map[string]interface{}, error) {
	changes := map[string]interface{}{}

	trimmed := func(value *string) string { return strings.TrimSpace(*value) }

	if fields.Username != nil {
		username := trimmed(fields.Username)
		if username == "" {
			return nil, exception.BadRequestError{Message: "username tidak boleh kosong"}
		}
		if len(username) < 3 {
			return nil, exception.BadRequestError{Message: "username minimal 3 karakter"}
		}
		if !isValidUsername(username) {
			return nil, exception.BadRequestError{Message: "username hanya boleh berisi huruf, angka, titik, dan garis bawah"}
		}
		if !strings.EqualFold(username, user.Username) && service.UserRepository.IsUsernameTaken(ctx, username, user.UserID) {
			return nil, exception.BadRequestError{Message: "username sudah digunakan"}
		}
		changes["username"] = username
	}

	if fields.Name != nil {
		name := trimmed(fields.Name)
		if name == "" {
			return nil, exception.BadRequestError{Message: "nama tidak boleh kosong"}
		}
		changes["name"] = name
	}

	if fields.PhoneNumber != nil {
		phone, err := helper.NormalizePhoneNumber(*fields.PhoneNumber)
		if err != nil {
			return nil, exception.BadRequestError{Message: err.Error()}
		}
		if phone != "" && phone != user.PhoneNumber && service.UserRepository.IsPhoneNumberTaken(ctx, phone, user.UserID) {
			return nil, exception.BadRequestError{Message: "nomor WhatsApp sudah digunakan akun lain"}
		}
		if phone == "" {
			changes["phone_number"] = nil
		} else {
			changes["phone_number"] = phone
		}
	}

	if fields.BirthDate != nil {
		value := trimmed(fields.BirthDate)
		if value == "" {
			changes["birth_date"] = nil
		} else {
			birthDate, err := time.Parse(birthDateLayout, value)
			if err != nil {
				return nil, exception.BadRequestError{Message: "format tanggal lahir harus YYYY-MM-DD"}
			}
			if birthDate.After(time.Now()) {
				return nil, exception.BadRequestError{Message: "tanggal lahir tidak boleh di masa depan"}
			}
			changes["birth_date"] = birthDate
		}
	}

	if fields.Gender != nil {
		gender := trimmed(fields.Gender)
		if gender != "" && !Genders[gender] {
			return nil, exception.BadRequestError{Message: "jenis kelamin harus male atau female"}
		}
		changes["gender"] = gender
	}

	if fields.LastEducation != nil {
		education := trimmed(fields.LastEducation)
		if education != "" && !EducationLevels[education] {
			return nil, exception.BadRequestError{Message: "pendidikan terakhir harus salah satu dari SMA/SMK, D3, D4, S1, S2, S3"}
		}
		changes["last_education"] = education
	}

	plainFields := map[string]*string{
		"major":           fields.Major,
		"target_agency":   fields.TargetAgency,
		"target_position": fields.TargetPosition,
		"nisn":            fields.NISN,
		"grade":           fields.Grade,
		"school":          fields.School,
		"regency":         fields.Regency,
		"province":        fields.Province,
	}
	for column, value := range plainFields {
		if value != nil {
			changes[column] = trimmed(value)
		}
	}

	return changes, nil
}

func isValidUsername(username string) bool {
	for _, r := range username {
		isLetter := (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z')
		isDigit := r >= '0' && r <= '9'
		if !isLetter && !isDigit && r != '_' && r != '.' {
			return false
		}
	}
	return true
}

func (service *UserService) applyChanges(ctx context.Context, user entity.User, changes map[string]interface{}) (model.GetUserResponse, error) {
	if len(changes) > 0 {
		changes["updated_at"] = time.Now()
		if err := service.UserRepository.UpdateFields(ctx, user.UserID, changes); err != nil {
			if strings.Contains(err.Error(), "users_phone_number_unique") {
				return model.GetUserResponse{}, exception.BadRequestError{Message: "nomor WhatsApp sudah digunakan akun lain"}
			}
			return model.GetUserResponse{}, err
		}
	}

	updated, err := service.UserRepository.FindById(ctx, user.UserID.String())
	if err != nil {
		return model.GetUserResponse{}, exception.NotFoundError{Message: err.Error()}
	}
	return ToUserResponse(updated), nil
}

// Update is used by admins. Only the fields present in the request change.
func (service *UserService) Update(ctx context.Context, request model.UpdateUserRequest, userId string) (model.UpdateUserResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.UpdateUserResponse{}, err
	}

	user, err := service.UserRepository.FindById(ctx, userId)
	if err != nil {
		return model.UpdateUserResponse{}, exception.NotFoundError{Message: err.Error()}
	}

	changes, err := service.buildProfileChanges(ctx, user, request.ProfileFields)
	if err != nil {
		return model.UpdateUserResponse{}, err
	}

	if request.Email != nil {
		email := strings.ToLower(strings.TrimSpace(*request.Email))
		if email == "" {
			return model.UpdateUserResponse{}, exception.BadRequestError{Message: "email tidak boleh kosong"}
		}
		if email != strings.ToLower(user.Email) && service.UserRepository.IsEmailTaken(ctx, email, user.UserID) {
			return model.UpdateUserResponse{}, exception.BadRequestError{Message: "email sudah digunakan"}
		}
		changes["email"] = email
	}

	if request.Role != nil {
		changes["role"] = *request.Role
	}

	return service.applyChanges(ctx, user, changes)
}

// GetProfile returns the profile of the logged-in user.
func (service *UserService) GetProfile(ctx context.Context, userID string) (model.GetUserResponse, error) {
	return service.FindById(ctx, userID)
}

// UpdateProfile lets a user change their own profile. Email and role are locked.
func (service *UserService) UpdateProfile(ctx context.Context, userID string, request model.UpdateMyProfileRequest) (model.GetUserResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.GetUserResponse{}, err
	}

	user, err := service.UserRepository.FindById(ctx, userID)
	if err != nil {
		return model.GetUserResponse{}, exception.NotFoundError{Message: err.Error()}
	}

	changes, err := service.buildProfileChanges(ctx, user, request.ProfileFields)
	if err != nil {
		return model.GetUserResponse{}, err
	}

	return service.applyChanges(ctx, user, changes)
}

// ChangePassword updates the password of the logged-in user after checking the old one.
func (service *UserService) ChangePassword(ctx context.Context, userID string, request model.ChangePasswordRequest) error {
	if err := common.Validate(request); err != nil {
		return err
	}

	user, err := service.UserRepository.FindById(ctx, userID)
	if err != nil {
		return exception.NotFoundError{Message: err.Error()}
	}

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(request.OldPassword)) != nil {
		return exception.BadRequestError{Message: "password lama tidak sesuai"}
	}
	if request.OldPassword == request.NewPassword {
		return exception.BadRequestError{Message: "password baru harus berbeda dari password lama"}
	}

	hashedPassword, err := hashPassword(request.NewPassword)
	if err != nil {
		return err
	}

	return service.UserRepository.UpdateFields(ctx, user.UserID, map[string]interface{}{
		"password":   hashedPassword,
		"updated_at": time.Now(),
	})
}

func (service *UserService) UpdateImage(ctx context.Context, request model.UploadFileRequest, userId string) (model.UpdateUserResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.UpdateUserResponse{}, exception.ValidationError{Message: err.Error()}
	}

	user, err := service.UserRepository.FindById(ctx, userId)
	if err != nil {
		return model.UpdateUserResponse{}, exception.NotFoundError{Message: err.Error()}
	}

	fileLink, err := helper.UploadFile(service.Uploader, request)
	if err != nil {
		return model.UpdateUserResponse{}, err
	}

	// The object key is stable per user, so add a version to bust browser caches.
	fileLink += "?v=" + strconv.FormatInt(time.Now().Unix(), 10)

	return service.applyChanges(ctx, user, map[string]interface{}{"picture_url": fileLink})
}

func (service *UserService) Delete(ctx context.Context, userId string) error {
	user, err := service.UserRepository.FindById(ctx, userId)
	if err != nil {
		return exception.NotFoundError{Message: err.Error()}
	}

	return service.UserRepository.Delete(ctx, user)
}

func (service *UserService) FindById(ctx context.Context, userId string) (model.GetUserResponse, error) {
	user, err := service.UserRepository.FindById(ctx, userId)
	if err != nil {
		return model.GetUserResponse{}, exception.NotFoundError{Message: err.Error()}
	}

	return ToUserResponse(user), nil
}

func (service *UserService) FindAll(ctx context.Context, params model.FindAllUserRequest) []model.GetUserResponse {
	users := service.UserRepository.FindAll(ctx, params)

	userResponses := make([]model.GetUserResponse, 0, len(users))
	for _, user := range users {
		userResponses = append(userResponses, ToUserResponse(user))
	}
	return userResponses
}

func (service *UserService) Authentication(ctx context.Context, request model.LoginRequest) (entity.User, error) {
	userResult, err := service.UserRepository.Authentication(ctx, request.Email)
	if err != nil {
		return entity.User{}, ErrInvalidCredentials
	}
	if bcrypt.CompareHashAndPassword([]byte(userResult.Password), []byte(request.Password)) != nil {
		return entity.User{}, ErrInvalidCredentials
	}

	if _, err := service.UserRepository.Update(ctx, entity.User{
		UserID:    userResult.UserID,
		LastLogin: time.Now(),
	}); err != nil {
		log.Printf("failed to update last login for %s: %v", userResult.UserID, err)
	}
	return userResult, nil
}

// issueOtp stores a fresh OTP for email, refusing when one was sent less than
// otpResendCooldown ago.
func (service *UserService) issueOtp(ctx context.Context, email string) (entity.UserOtp, error) {
	if existing, err := service.UserRepository.FindOtpByEmail(ctx, email); err == nil {
		if wait := otpResendCooldown - time.Since(existing.CreatedAt); wait > 0 {
			return entity.UserOtp{}, exception.BadRequestError{
				Message: "OTP baru saja dikirim, coba lagi dalam " + wait.Round(time.Second).String(),
			}
		}
	}

	userOtp := entity.UserOtp{
		Email:     email,
		Otp:       helper.GenerateOTP(6),
		ExpiredAt: time.Now().Add(otpLifetime),
		CreatedAt: time.Now(),
	}
	return service.UserRepository.CreateOtp(ctx, userOtp)
}

// verifyOtp checks the OTP for email and consumes it on success.
func (service *UserService) verifyOtp(ctx context.Context, email string, otp string) error {
	userOtp, err := service.UserRepository.FindOtpByEmail(ctx, email)
	if err != nil {
		return exception.BadRequestError{Message: "otp is not valid"}
	}
	if userOtp.Otp != strings.TrimSpace(otp) {
		return exception.BadRequestError{Message: "otp is not valid"}
	}
	if userOtp.ExpiredAt.Before(time.Now()) {
		return exception.BadRequestError{Message: "otp is expired"}
	}
	if err := service.UserRepository.DeleteOtp(ctx, email); err != nil {
		log.Printf("failed to delete used OTP for %s: %v", email, err)
	}
	return nil
}

func isOtpBypass() bool {
	return os.Getenv("IS_OTP_BYPASS") == "true"
}

func (service *UserService) SendOtp(ctx context.Context, otpConfig model.SendOtpConfig, request model.CreateUserOtpRequest) (model.UserOtpResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.UserOtpResponse{}, exception.ValidationError{Message: err.Error()}
	}

	email := strings.ToLower(strings.TrimSpace(request.Email))
	if email == "" {
		return model.UserOtpResponse{}, exception.BadRequestError{Message: "email wajib diisi"}
	}

	if service.UserRepository.FindAccountIsExist(ctx, email, request.Username) {
		return model.UserOtpResponse{}, exception.BadRequestError{Message: "account is already exist"}
	}

	userOtp, err := service.issueOtp(ctx, email)
	if err != nil {
		return model.UserOtpResponse{}, err
	}

	if isOtpBypass() {
		log.Printf("[OTP BYPASS] OTP for %s: %s", email, userOtp.Otp)
	} else if err := helper.SendMail(otpConfig, email, "Kode Verifikasi Pendaftaran Akun Telisik", helper.TemplateEmailOtp(request.Name, userOtp.Otp)); err != nil {
		log.Printf("failed to send registration OTP: %v", err)
		return model.UserOtpResponse{}, errors.New("gagal mengirim email OTP, silakan coba lagi")
	}

	return model.UserOtpResponse{
		Email:     userOtp.Email,
		ExpiredAt: userOtp.ExpiredAt,
		CreatedAt: userOtp.CreatedAt,
	}, nil
}

func (service *UserService) CheckOtp(ctx context.Context, email string, otpReq string) bool {
	userOtp, err := service.UserRepository.FindOtpByEmail(ctx, email)
	if err != nil {
		return false
	}
	return userOtp.Otp == otpReq && !userOtp.ExpiredAt.Before(time.Now())
}

func (service *UserService) SelfRegister(ctx context.Context, request model.SelfRegisterRequest) (model.RegisterResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.RegisterResponse{}, err
	}

	email := strings.ToLower(strings.TrimSpace(request.Email))
	username := strings.TrimSpace(request.Username)
	if !isValidUsername(username) {
		return model.RegisterResponse{}, exception.BadRequestError{Message: "username hanya boleh berisi huruf, angka, titik, dan garis bawah"}
	}

	if service.UserRepository.FindAccountIsExist(ctx, email, username) {
		return model.RegisterResponse{}, exception.BadRequestError{Message: "email atau username sudah digunakan"}
	}

	if !isOtpBypass() {
		if err := service.verifyOtp(ctx, email, request.Otp); err != nil {
			return model.RegisterResponse{}, err
		}
	}

	hashedPassword, err := hashPassword(request.Password)
	if err != nil {
		return model.RegisterResponse{}, err
	}

	return service.createUser(ctx, entity.User{
		Username:   username,
		Name:       strings.TrimSpace(request.Name),
		Email:      email,
		Password:   hashedPassword,
		Role:       "user",
		NISN:       request.NISN,
		Grade:      request.Grade,
		School:     request.School,
		Regency:    request.Regency,
		Province:   request.Province,
		PictureURL: request.PictureURL,
	})
}

func (service *UserService) CheckByEmail(ctx context.Context, request model.CheckByEmailRequest) (bool, error) {
	if err := common.Validate(request); err != nil {
		return false, err
	}

	return service.UserRepository.FindAccountIsExist(ctx, request.Email, ""), nil
}

func (service *UserService) FindByEmail(ctx context.Context, email string) (entity.User, error) {
	user, err := service.UserRepository.FindByEmail(ctx, email)
	if err != nil {
		return entity.User{}, exception.NotFoundError{Message: err.Error()}
	}

	return user, nil
}

func (service *UserService) SendPasswordResetOtp(ctx context.Context, otpConfig model.SendOtpConfig, request model.ForgotPasswordRequest) (model.UserOtpResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.UserOtpResponse{}, exception.ValidationError{Message: err.Error()}
	}

	user, err := service.UserRepository.FindByEmail(ctx, request.Email)
	if err != nil {
		return model.UserOtpResponse{}, exception.NotFoundError{Message: "email not found"}
	}

	// OTPs are keyed by the stored email so verification matches it exactly.
	userOtp, err := service.issueOtp(ctx, user.Email)
	if err != nil {
		return model.UserOtpResponse{}, err
	}

	if isOtpBypass() {
		log.Printf("[OTP BYPASS] password reset OTP for %s: %s", user.Email, userOtp.Otp)
	} else if err := helper.SendMail(otpConfig, user.Email, "Reset Password - Kode Verifikasi Telisik", helper.TemplateEmailOtp(user.Name, userOtp.Otp)); err != nil {
		log.Printf("failed to send password reset OTP: %v", err)
		return model.UserOtpResponse{}, errors.New("gagal mengirim email OTP, silakan coba lagi")
	}

	return model.UserOtpResponse{
		Email:     userOtp.Email,
		ExpiredAt: userOtp.ExpiredAt,
		CreatedAt: userOtp.CreatedAt,
	}, nil
}

func (service *UserService) ResetPassword(ctx context.Context, request model.ResetPasswordRequest) error {
	if err := common.Validate(request); err != nil {
		return exception.ValidationError{Message: err.Error()}
	}

	user, err := service.UserRepository.FindByEmail(ctx, request.Email)
	if err != nil {
		return exception.BadRequestError{Message: "otp is not valid"}
	}

	if err := service.verifyOtp(ctx, user.Email, request.Otp); err != nil {
		return err
	}

	hashedPassword, err := hashPassword(request.NewPassword)
	if err != nil {
		return err
	}

	return service.UserRepository.UpdateFields(ctx, user.UserID, map[string]interface{}{
		"password":   hashedPassword,
		"updated_at": time.Now(),
	})
}
