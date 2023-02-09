package parser

import (
	"context"
	"errors"
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
	Selectors struct {
		ListItem QuerySelector
		Next     QuerySelector
		Price    QuerySelector
		Link     QuerySelector
		Detail   QuerySelector
		Total    QuerySelector
		Section  QuerySelector
		Address  QuerySelector
	}
}

func NewHoueseParser(regionID int) hourse.Parser {
	var err error
	var host *url.URL

	if host, err = url.Parse("https://sale.591.com.tw/"); err != nil {
		log.Fatalln(err)
	}

	output := new(ParseSale)
	output.Host = *host
	output.PageSize = 30
	output.RegionID = regionID

	output.Selectors.ListItem = QuerySelector{ClassName: []string{"houseList-item"}, TagName: "div"}
	output.Selectors.Next = QuerySelector{ClassName: []string{"pageNext"}, TagName: "a"}
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
		field.Area = ToValue(text)
	case "houseList-item-attrs-houseage":
		field.Age = text
	case "houseList-item-attrs-mainarea":
		field.Mainarea = ToValue(text)
	case "houseList-item-attrs-floor":
		field.Floor = text
	case "houseList-item-attrs-room":
		field.Room = text
	case "houseList-item-attrs-purpose":
		field.Purpose = append(field.Purpose, text)
	default:
		log.Printf("Attr: %s and Text: %s\n", attr, text)
	}
}

// 2023/02/09 23:07:33 Attr: houseList-item-attrs-kind and Text: 車位
// 2023/02/09 23:07:33 Attr: houseList-item-attrs-cartmodel and Text: 平面式
// 2023/02/09 23:07:33 Attr: houseList-item-attrs-carttype and Text: 室內地下

func (ps ParseSale) URL() string {
	params := url.Values{}
	params.Set("shType", "list")
	params.Set("price", "$_3000")
	params.Set("regionid", strconv.Itoa(ps.RegionID))

	if ps.TotalRows != 0 {
		params.Set("firstRow", strconv.Itoa(ps.FirstRow))
		params.Set("totalRows", strconv.Itoa(ps.TotalRows))
	}

	host := ps.Host
	host.RawQuery = params.Encode()

	log.Printf("current URL: %s\n\n", host.String())
	return host.String()
}

func (ps ParseSale) Price(handle pw.ElementHandle) (int, error) {
	var price string

	if element, err := handle.QuerySelector(ps.Selectors.Price.Build()); err != nil {
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
	default:
		return ""
	}
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

func (ps *ParseSale) SetTotalRow(ctx context.Context, pg pw.Page) error {
	var num int
	qs := ps.Selectors.Total.Build()

	if ps.TotalRows != 0 {
		return nil
	} else if _, err := pg.WaitForSelector(qs); err != nil {
		return err
	} else if element, err := pg.QuerySelector(qs); err != nil {
		return err
	} else if value, err := element.TextContent(); err != nil {
		return err
	} else if num, err = strconv.Atoi(value); err != nil {
		return err
	}

	ps.TotalRows = num
	return nil
}

func (ps *ParseSale) FetchOne(ctx context.Context, pg pw.Page) ([]hourse.UpsertHourseRequest, error) {
	var err error
	var items []pw.ElementHandle
	qs := ps.Selectors.ListItem.Build()

	if _, err = pg.Goto(ps.URL()); err != nil {
		return nil, err
	} else if err = ps.SetTotalRow(ctx, pg); err != nil {
		return nil, err
	} else if _, err = pg.WaitForSelector(qs); err != nil {
		return nil, err
	} else if items, err = pg.QuerySelectorAll(qs); err != nil {
		return nil, err
	}

	var output []hourse.UpsertHourseRequest
	for _, item := range items {
		var result hourse.UpsertHourseRequest
		var err error

		if result, err = ps.FetchItem(item); err != nil {
			continue
		}

		output = append(output, result)
	}

	return output, nil
}

func (ps *ParseSale) UpdateCurrentPage() {
	ps.FirstRow += ps.PageSize
}

func (ps *ParseSale) HasNext() bool {
	return ps.TotalRows == 0 || ps.FirstRow < ps.TotalRows
}
