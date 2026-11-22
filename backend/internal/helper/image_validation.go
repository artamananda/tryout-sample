package helper

import (
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
)

const MaxProfilePictureBytes = 2 * 1024 * 1024

var allowedImageTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

// ValidateImageUpload checks size and the real content type of an uploaded
// image (sniffed from its bytes, not trusted from the client header). It
// returns the detected content type and a matching file extension.
func ValidateImageUpload(fileHeader *multipart.FileHeader, maxBytes int64) (string, string, error) {
	if fileHeader == nil {
		return "", "", errors.New("file wajib diunggah")
	}
	if fileHeader.Size > maxBytes {
		return "", "", fmt.Errorf("ukuran file maksimal %d MB", maxBytes/(1024*1024))
	}

	file, err := fileHeader.Open()
	if err != nil {
		return "", "", errors.New("file tidak dapat dibaca")
	}
	defer file.Close()

	head := make([]byte, 512)
	n, _ := file.Read(head)
	contentType := http.DetectContentType(head[:n])

	ext, ok := allowedImageTypes[contentType]
	if !ok {
		return "", "", errors.New("format foto harus JPG, PNG, atau WEBP")
	}
	if original := strings.ToLower(filepath.Ext(fileHeader.Filename)); original == ".jpeg" && ext == ".jpg" {
		ext = original
	}
	return contentType, ext, nil
}
