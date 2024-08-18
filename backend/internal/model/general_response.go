package model

type GeneralResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"payload"`
}

type FindAllRequest struct {
	Search string `json:"search"`
	Limit  string `json:"limit"`
	Offset string `json:"offset"`
}
