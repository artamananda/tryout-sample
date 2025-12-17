package exception

import (
	"errors"
	"testing"
)

func TestPanicLogging(t *testing.T) {
	tests := []struct {
		name string
		err  interface{}
	}{
		{
			name: "nil error",
			err:  nil,
		},
		{
			name: "string error",
			err:  "test error",
		},
		{
			name: "error type",
			err:  errors.New("test error"),
		},
		{
			name: "integer error",
			err:  123,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Should not panic, just log
			PanicLogging(tt.err)
		})
	}
}
