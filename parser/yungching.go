package parser

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/house"
	pw "github.com/playwright-community/playwright-go"
)

type ParseYungChing struct {
	PageSize    int
	CurrentPage int
	TotalPage   int
	City        string
	MaxPrice    int
	MinPrice    int
	Selectors   struct {
		ListItem QuerySelector
		Link     QuerySelector
		Detail   QuerySelector
		Total    QuerySelector
		Address  QuerySelector
		Price    QuerySelector
	}
}

func NewParseYungChing(city string) house.ParserService {
	yc := new(ParseYungChing)
	yc.PageSize = 30
	yc.CurrentPage = 1
	yc.TotalPage = -1
	yc.City = city
	yc.MaxPrice = 3000
	yc.MinPrice = 1000

	yc.Selectors.ListItem = QuerySelector{ClassName: []string{"m-list-item"}, TagName: "li"}
	yc.Selectors.Link = QuerySelector{ClassName: []string{"item-img", "ga_click_trace"}, TagName: "a"}
	yc.Selectors.Total = QuerySelector{ClassName: []string{"list-filter", "is-first", "active", "ng-isolate-scope"}, NextTagName: []string{"span"}, TagName: "a"}
	yc.Selectors.Address = QuerySelector{ClassName: []string{"item-description"}, TagName: "div", NextTagName: []string{"span"}}
	yc.Selectors.Detail = QuerySelector{ClassName: []string{"item-info-detail"}, TagName: "ul"}
	yc.Selectors.Price = QuerySelector{ClassName: []string{"price-num"}, TagName: "span"}
	return yc
}

func (yc ParseYungChing) URL() string {
	return strings.Join([]string{
		"https://buy.yungching.com.tw/region",
		fmt.Sprintf("%s-_c", yc.City),
		fmt.Sprintf("%d-%d_price", yc.MinPrice, yc.MaxPrice),
		fmt.Sprintf("_rm/?pg=%d", yc.CurrentPage),
	}, "/")
}

func (yc ParseYungChing) HasNext() bool {
	return yc.TotalPage == -1 || yc.CurrentPage <= yc.TotalPage
}

func (yc ParseYungChing) ItemQuerySelector() string {
	return yc.Selectors.ListItem.Build()
}

func (yc *ParseYungChing) UpdateCurrentPage() {
	yc.CurrentPage++
}

func (yc *ParseYungChing) SetTotalRow(ctx context.Context, pg pw.Page) error {
	if yc.TotalPage != -1 {
		return nil
	}

	qs := yc.Selectors.Total.Build()

	var value int
	if _, err := pg.WaitForSelector(qs); err != nil {
		return err
	} else if element, err := pg.QuerySelector(qs); err != nil {
		return err
	} else if text, err := element.TextContent(); err != nil {
		return err
	} else if value, err = strconv.Atoi(ToValue(text)); err != nil {
		return err
	}

	yc.TotalPage = value / yc.PageSize
	return nil
}

func (yc ParseYungChing) Link(handle pw.ElementHandle) (string, error) {
	var path *url.URL
	var host *url.URL

	if element, err := handle.QuerySelector(yc.Selectors.Link.Build()); err != nil {
		return "", err
	} else if element == nil {
		return "", nil
	} else if link, err := element.GetAttribute("href"); err != nil {
		return "", err
	} else if strings.HasPrefix(link, "https") {
		return "", errors.New("")
	} else if path, err = url.Parse(link); err != nil {
		return "", err
	} else if host, err = url.Parse("https://buy.yungching.com.tw"); err != nil {
		return "", err
	}

	return host.ResolveReference(path).String(), nil
}

func (yc ParseYungChing) Price(handle pw.ElementHandle) (int, error) {
	return Price(handle, yc.Selectors.Price.Build())
}

func (yc ParseYungChing) Address(item pw.ElementHandle, in *house.UpserthouseRequest) error {
	var err error
	var element pw.ElementHandle

	if element, err = item.QuerySelector(yc.Selectors.Address.Build()); err != nil || element == nil {
		return errors.New("")
	}

	var address string
	address, err = element.TextContent()
	if err != nil {
		return err
	}

	address = strings.Replace(address, yc.City, "", 1)
	in.Section, in.Address = SeparateSectionAndAddress(address)
	return nil
}

func (yc ParseYungChing) FetchItem(item pw.ElementHandle) (house.UpserthouseRequest, error) {
	var result house.UpserthouseRequest
	if item == nil {
		return result, nil
	}
	var err error

	result.City = yc.City

	result.Link, err = yc.Link(item)
	if err != nil {
		return result, err
	}

	result.Price, err = yc.Price(item)
	if err != nil {
		return result, err
	}

	if err = yc.Address(item, &result); err != nil {
		return result, err
	}

	var detail []pw.ElementHandle
	if detailElement, err := item.QuerySelector(yc.Selectors.Detail.Build()); err != nil {
		return result, err
	} else if detail, err = detailElement.QuerySelectorAll("li"); err != nil {
		return result, err
	} else if len(detail) != 9 {
		return result, errors.New("")
	}

	UpdateField := func(idx int, field *string) error {
		text, err := detail[idx].TextContent()
		if err != nil {
			return err
		}
		text = strings.TrimSpace(text)
		*field = strings.ReplaceAll(text, " ", "")
		return nil
	}

	UpdateField(0, &result.Shape)
	UpdateField(1, &result.Age)
	UpdateField(2, &result.Floor)
	UpdateField(4, &result.Mainarea)
	UpdateField(5, &result.Area)
	UpdateField(6, &result.Layout)

	for _, num := range []int{3, 7, 8} {
		text, err := detail[num].TextContent()
		if err != nil || strings.TrimSpace(text) == "" {
			continue
		}

		result.Others = append(result.Others, strings.TrimSpace(text))
	}

	floor := strings.Split(result.Floor, "~")
	result.Floor = floor[len(floor)-1]
	return result, nil
}
