package parser

import (
	"strconv"
	"strings"

	pw "github.com/playwright-community/playwright-go"
)

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

func Price(handle pw.ElementHandle, qs string) (int, error) {
	var price string

	if element, err := handle.QuerySelector(qs); err != nil {
		return -1, err
	} else if element == nil {
		return 0, nil
	} else if price, err = element.TextContent(); err != nil {
		return -1, err
	}

	price = strings.ReplaceAll(price, ",", "")
	price = strings.ReplaceAll(price, " ", "")

	return strconv.Atoi(price)
}
