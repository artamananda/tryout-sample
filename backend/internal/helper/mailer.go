package helper

import (
	"fmt"
	"strconv"

	"github.com/artamananda/tryout-sample/internal/model"
	"gopkg.in/gomail.v2"
)

// SendMail sends an HTML email. It returns an error instead of terminating the
// process, so a failing SMTP server cannot take the whole API down.
func SendMail(cfg model.SendOtpConfig, to string, subject string, htmlBody string) error {
	port, err := strconv.Atoi(cfg.SmtpPort)
	if err != nil {
		return fmt.Errorf("invalid SMTP port %q: %w", cfg.SmtpPort, err)
	}

	mailer := gomail.NewMessage()
	mailer.SetHeader("From", cfg.SenderName)
	mailer.SetHeader("To", to)
	mailer.SetHeader("Subject", subject)
	mailer.SetBody("text/html", htmlBody)

	dialer := gomail.NewDialer(cfg.SmtpHost, port, cfg.AuthEmail, cfg.AuthPassword)
	if err := dialer.DialAndSend(mailer); err != nil {
		return fmt.Errorf("send mail to %s: %w", to, err)
	}
	return nil
}
