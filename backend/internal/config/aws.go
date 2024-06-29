package config

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
)

func NewSession(config Config) (*session.Session, error) {
	AWS_ACCESS_KEY_ID := config.Get("AWS_ACCESS_KEY_ID")
	AWS_SECRET_ACCESS_KEY := config.Get("AWS_SECRET_ACCESS_KEY")
	AWS_REGION := config.Get("AWS_REGION")
	AWS_ENDPOINT := config.Get("AWS_ENDPOINT")

	sess, err := session.NewSession(&aws.Config{
		Endpoint: &AWS_ENDPOINT,
		Region:   aws.String(AWS_REGION),
		Credentials: credentials.NewStaticCredentials(
			AWS_ACCESS_KEY_ID,
			AWS_SECRET_ACCESS_KEY,
			"",
		),
	})

	if err != nil {
		return nil, err
	}

	return sess, nil
}
