package model

import "mime/multipart"

type UploadFileRequest struct {
	FileHeader  *multipart.FileHeader
	ContentType string
	FolderName  string
	FileName    string
}
