package config

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
)

func NewAWSConfig(conf Config) (aws.Config, error) {
	AWS_ACCESS_KEY_ID := conf.Get("AWS_ACCESS_KEY_ID")
	AWS_SECRET_ACCESS_KEY := conf.Get("AWS_SECRET_ACCESS_KEY")
	AWS_REGION := conf.Get("AWS_REGION")
	AWS_ENDPOINT := conf.Get("AWS_ENDPOINT")

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(AWS_REGION),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			AWS_ACCESS_KEY_ID,
			AWS_SECRET_ACCESS_KEY,
			"",
		)),
	)

	if err != nil {
		return aws.Config{}, err
	}

	// Set custom endpoint if provided
	if AWS_ENDPOINT != "" {
		cfg.BaseEndpoint = &AWS_ENDPOINT
	}

	return cfg, nil
}
