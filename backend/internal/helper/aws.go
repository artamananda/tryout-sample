package helper

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

func UploadFile(uploader *manager.Uploader, fileUpload model.UploadFileRequest) (string, error) {
	newConfig := config.New()
	bucketName := newConfig.Get("AWS_BUCKET_NAME")
	bucketUrl := newConfig.Get("AWS_BUCKET_PUBLIC_URL")
	file, err := fileUpload.FileHeader.Open()
	if err != nil {
		return "", err
	}
	defer file.Close()

	if fileUpload.FolderName != "" {
		fileUpload.FileName = fileUpload.FolderName + "/" + fileUpload.FileName
	}

	// Upload file to S3
	_, err = uploader.Upload(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(fileUpload.FileName),
		Body:        file,
		ContentType: &fileUpload.ContentType,
		Metadata: map[string]string{
			"Access-Control-Allow-Origin": "*",
		},
		ACL: types.ObjectCannedACLPublicRead,
	})
	if err != nil {
		return "", err
	}

	url := bucketUrl + "/" + fileUpload.FileName

	return url, nil
}
