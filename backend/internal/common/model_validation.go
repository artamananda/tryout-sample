package common

import (
	"encoding/json"

	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/go-playground/validator/v10"
)

func Validate(modelValidate interface{}) error {
	validate := validator.New()
	err := validate.Struct(modelValidate)
	if err != nil {
		var messages []map[string]interface{}
		for _, err := range err.(validator.ValidationErrors) {
			messages = append(messages, map[string]interface{}{
				"field":   err.Field(),
				"message": "this field is " + err.Tag(),
			})
		}

		jsonMessage, errJson := json.Marshal(messages)
		exception.PanicLogging(errJson)

		return exception.ValidationError{
			Message: string(jsonMessage),
		}
	}

	return nil
}
