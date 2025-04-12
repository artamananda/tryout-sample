package helper

import "strconv"

func StrToBoolPtr(value string) (*bool, error) {
	if value == "" {
		return nil, nil
	}

	v, err := strconv.ParseBool(value)
	if err != nil {
		return nil, err
	}

	return &v, nil
}
