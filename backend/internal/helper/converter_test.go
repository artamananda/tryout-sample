package helper

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStrToBoolPtr(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		want    *bool
		wantErr bool
	}{
		{
			name:    "empty string returns nil",
			value:   "",
			want:    nil,
			wantErr: false,
		},
		{
			name:    "true string",
			value:   "true",
			want:    func() *bool { b := true; return &b }(),
			wantErr: false,
		},
		{
			name:    "false string",
			value:   "false",
			want:    func() *bool { b := false; return &b }(),
			wantErr: false,
		},
		{
			name:    "1 string",
			value:   "1",
			want:    func() *bool { b := true; return &b }(),
			wantErr: false,
		},
		{
			name:    "0 string",
			value:   "0",
			want:    func() *bool { b := false; return &b }(),
			wantErr: false,
		},
		{
			name:    "invalid string",
			value:   "invalid",
			want:    nil,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := StrToBoolPtr(tt.value)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, got)
			} else {
				assert.NoError(t, err)
				if tt.want == nil {
					assert.Nil(t, got)
				} else {
					assert.NotNil(t, got)
					assert.Equal(t, *tt.want, *got)
				}
			}
		})
	}
}
