package parser

import "strings"

type QuerySelector struct {
	ClassName   []string
	NextTagName []string
	TagName     string
}

func (qs QuerySelector) Build() string {
	var sb strings.Builder
	sb.WriteString(qs.TagName)
	for _, name := range qs.ClassName {
		sb.WriteByte('.')
		sb.WriteString(name)
	}

	for _, name := range qs.NextTagName {
		sb.WriteByte('>')
		sb.WriteString(name)
	}

	return sb.String()
}
