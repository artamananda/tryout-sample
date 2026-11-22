package service

import (
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/google/uuid"
)

// parseID parses a UUID coming from the request and reports a 400 instead of
// panicking when it is malformed.
func parseID(value string, field string) (uuid.UUID, error) {
	id, err := uuid.Parse(value)
	if err != nil {
		return uuid.Nil, exception.BadRequestError{Message: field + " tidak valid"}
	}
	return id, nil
}
