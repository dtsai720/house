package parser

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/url"
	"strconv"
	"strings"

	"github.com/hourse"
	pw "github.com/playwright-community/playwright-go"
)

type ParseSale struct {
	Host      url.URL
	TotalRows int
	FirstRow  int
	PageSize  int
	RegionID  int
	MaxPrice  int
	MinPrice  int
	Selectors struct {
		ListItem QuerySelector
		Price    QuerySelector
		Link     QuerySelector
		Detail   QuerySelector
		Total    QuerySelector
		Section  QuerySelector
		Address  QuerySelector
	}
}

func NewParseSale(regionID int) hourse.Parser {
	var err error
	var host *url.URL

	if host, err = url.Parse("https://sale.591.com.tw/"); err != nil {
		log.Fatalln(err)
	}

	output := new(ParseSale)
	output.Host = *host
	output.PageSize = 30
	output.MaxPrice = 3000
	output.MinPrice = 500
	output.RegionID = regionID

	output.Selectors.ListItem = QuerySelector{ClassName: []string{"houseList-item"}, TagName: "div"}
	output.Selectors.Price = QuerySelector{ClassName: []string{"houseList-item-price"}, NextTagName: []string{"em"}, TagName: "div"}
	output.Selectors.Link = QuerySelector{ClassName: []string{"houseList-item-title"}, NextTagName: []string{"a"}, TagName: "div"}
	output.Selectors.Detail = QuerySelector{ClassName: []string{"houseList-item-attr-row"}, NextTagName: []string{"span"}, TagName: "div"}
	output.Selectors.Total = QuerySelector{ClassName: []string{"houseList-head-title", "pull-left"}, NextTagName: []string{"p", "em"}, TagName: "div"}
	output.Selectors.Section = QuerySelector{ClassName: []string{"houseList-item-section"}, TagName: "span"}
	output.Selectors.Address = QuerySelector{ClassName: []string{"houseList-item-address"}, TagName: "span"}
	return output
}

func (ps ParseSale) SetField(field *hourse.UpsertHourseRequest, attr string, text string) {
	switch attr {
	case "houseList-item-attrs-shape":
		field.Shape = text
	case "houseList-item-attrs-layout":
		field.Layout = text
	case "houseList-item-attrs-area":
		field.Area = text
	case "houseList-item-attrs-houseage":
		field.Age = text
	case "houseList-item-attrs-mainarea":
		field.Mainarea = text
	case "houseList-item-attrs-floor":
		field.Floor = text
	case "houseList-item-attrs-room":
		field.Room = text
	case "houseList-item-attrs-purpose":
		field.Purpose = append(field.Purpose, text)
	default:
		field.Others = append(field.Others, text)
	}
}

func (ps ParseSale) Price(handle pw.ElementHandle) (int, error) {
	return Price(handle, ps.Selectors.Price.Build())
}

func (ps ParseSale) Link(handle pw.ElementHandle) (string, error) {
	var path *url.URL

	if element, err := handle.QuerySelector(ps.Selectors.Link.Build()); err != nil {
		return "", err
	} else if element == nil {
		return "", nil
	} else if link, err := element.GetAttribute("href"); err != nil {
		return "", err
	} else if strings.HasPrefix(link, "https") {
		return "", errors.New("")
	} else if path, err = url.Parse(link); err != nil {
		return "", err
	}

	return ps.Host.ResolveReference(path).String(), nil
}

func (ps ParseSale) City() string {
	switch ps.RegionID {
	case 1:
		return "台北市"
	case 3:
		return "新北市"
	case 6:
		return "桃園市"
	case 5:
		return "新竹縣"
	case 4:
		return "新竹市"
	case 15:
		return "台南市"
	case 17:
		return "高雄市"
	case 19:
		return "屏東縣"
	default:
		return ""
	}
}

func (ps ParseSale) ItemQuerySelector() string {
	return ps.Selectors.ListItem.Build()
}

func (ps ParseSale) URL() string {
	params := url.Values{}
	params.Set("shType", "list")
	params.Set("price", fmt.Sprintf("%d$_%d$", ps.MinPrice, ps.MaxPrice))
	params.Set("regionid", strconv.Itoa(ps.RegionID))

	if ps.TotalRows != 0 {
		params.Set("firstRow", strconv.Itoa(ps.FirstRow))
		params.Set("totalRows", strconv.Itoa(ps.TotalRows))
	}

	host := ps.Host
	host.RawQuery = params.Encode()
	return host.String()
}

func (ps ParseSale) FetchItem(item pw.ElementHandle) (hourse.UpsertHourseRequest, error) {
	var result hourse.UpsertHourseRequest
	if item == nil {
		return result, nil
	}

	var details []pw.ElementHandle
	var err error

	if result.Price, err = ps.Price(item); err != nil {
		return result, err
	} else if result.Link, err = ps.Link(item); err != nil {
		return result, err
	} else if details, err = item.QuerySelectorAll(ps.Selectors.Detail.Build()); err != nil {
		return result, err
	}

	if element, err := item.QuerySelector(ps.Selectors.Address.Build()); err == nil && element != nil {
		result.Address, _ = element.TextContent()
	}

	if element, err := item.QuerySelector(ps.Selectors.Section.Build()); err == nil && element != nil {
		result.Section, _ = element.TextContent()
		result.Section = strings.ReplaceAll(result.Section, "-", "")
	}

	result.City = ps.City()

	for _, detail := range details {
		text, err := detail.TextContent()
		if err != nil {
			continue
		} else if text == "" {
			continue
		}

		attr, err := detail.GetAttribute("class")
		if err != nil {
			continue
		}

		ps.SetField(&result, attr, text)
	}

	return result, err
}

func (ps *ParseSale) SetTotalRow(ctx context.Context, f func(ctx context.Context, qs string) (int, error)) error {
	if ps.TotalRows != 0 {
		return nil
	}
	var err error
	ps.TotalRows, err = f(ctx, ps.Selectors.Total.Build())
	return err
}

func (ps *ParseSale) UpdateCurrentPage() {
	ps.FirstRow += ps.PageSize
}

func (ps *ParseSale) HasNext() bool {
	return ps.TotalRows == 0 || ps.FirstRow < ps.TotalRows
}
