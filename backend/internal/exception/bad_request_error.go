package exception

// BadRequestError is returned when the client sends input that is well-formed
// but not acceptable (wrong OTP, duplicate username, unparsable body, ...).
type BadRequestError struct {
	Message string
}

func (badRequestError BadRequestError) Error() string {
	return badRequestError.Message
}
