package parser

import "strings"

func ToValue(in string) string {
	var sb strings.Builder

	for _, char := range in {

		if char == '.' || ('0' <= char && char <= '9') {
			sb.WriteRune(char)
		}
	}

	return sb.String()
}
