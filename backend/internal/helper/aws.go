package helper

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

func UploadFile(uploader *s3manager.Uploader, fileUpload model.UploadFileRequest) (string, error) {
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
	_, err = uploader.Upload(&s3manager.UploadInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(fileUpload.FileName),
		Body:        file,
		ContentType: &fileUpload.ContentType,
	})
	if err != nil {
		return "", err
	}

	url := bucketUrl + "/" + fileUpload.FileName

	return url, nil
}
