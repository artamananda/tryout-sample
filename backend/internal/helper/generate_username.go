package helper

import "strings"

func GenerateUsernameByEmail(email string) string {
	atIndex := strings.Index(email, "@")
	if atIndex == -1 {
		return ""
	}
	username := email[:atIndex]
	username = strings.ToLower(username)
	username = strings.ReplaceAll(username, " ", "")
	return username
}
