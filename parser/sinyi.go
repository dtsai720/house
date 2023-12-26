package parser

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/url"
	"strconv"
	"strings"

	"github.com/house"
	pw "github.com/playwright-community/playwright-go"
)

type ParseSinYi struct {
	PageSize    int
	CurrentPage int
	TotalPage   int
	City        string
	MaxPrice    int
	MinPrice    int
	Selectors   struct {
		ListItem QuerySelector
		Price    QuerySelector
		Link     QuerySelector
		Detail   QuerySelector
		Total    QuerySelector
		Address  QuerySelector
	}
}

func NewParseSinYi(city string) house.ParserService {
	sy := new(ParseSinYi)
	sy.PageSize = 20
	sy.CurrentPage = 1
	sy.TotalPage = -1
	sy.City = city
	sy.MaxPrice = 3000
	sy.MinPrice = 1000

	sy.Selectors.Total = QuerySelector{ClassName: []string{"pageLinkClassName"}, TagName: "a"}
	sy.Selectors.ListItem = QuerySelector{ClassName: []string{"buy-list-item"}, TagName: "div"}
	sy.Selectors.Price = QuerySelector{ClassName: []string{"LongInfoCard_Type_Right"}, TagName: "div", NextTagName: []string{"div", "span"}}
	sy.Selectors.Address = QuerySelector{ClassName: []string{"LongInfoCard_Type_Address"}, TagName: "div", NextTagName: []string{"span"}}
	sy.Selectors.Detail = QuerySelector{ClassName: []string{"LongInfoCard_Type_HouseInfo"}, TagName: "div", NextTagName: []string{"span"}}
	sy.Selectors.Link = QuerySelector{TagName: "a"}
	return sy
}

func (sy ParseSinYi) Price(item pw.ElementHandle) (int, error) {
	var err error
	var elements []pw.ElementHandle

	if elements, err = item.QuerySelectorAll(sy.Selectors.Price.Build()); err != nil {
		return -1, err
	}

	var price int
	for _, element := range elements {
		if text, err := element.TextContent(); err != nil {
			continue
		} else if number, err := strconv.Atoi(ToValue(text)); err != nil {
			continue
		} else {
			price = number
		}
	}

	return price, nil
}

func (sy ParseSinYi) GetCity() string {
	switch sy.City {
	case "Taipei":
		return "台北市"
	case "NewTaipei":
		return "新北市"
	case "Hsinchu-city":
		return "新竹市"
	case "Hsinchu-county":
		return "新竹縣"
	case "Taoyuan-city":
		return "桃園市"
	case "Kaohsiung-city":
		return "高雄市"
	default:
		return ""
	}
}

func (sy ParseSinYi) Link(item pw.ElementHandle) (string, error) {
	if path, err := item.GetAttribute("href"); err != nil {
		return "", err
	} else if host, err := url.Parse("https://www.sinyi.com.tw"); err != nil {
		return "", err
	} else if uri, err := url.Parse(path); err != nil {
		return "", err
	} else {
		return host.ResolveReference(uri).String(), nil
	}
}

func (sy *ParseSinYi) FetchItem(item pw.ElementHandle) (house.UpserthouseRequest, error) {
	var result house.UpserthouseRequest
	var err error
	var elements []pw.ElementHandle
	if item == nil {
		return result, nil
	}

	if elements, err = item.QuerySelectorAll(sy.Selectors.Link.Build()); err != nil {
		return result, err
	} else if len(elements) == 0 {
		return result, errors.New("error qs when link")
	} else if result.Link, err = sy.Link(elements[0]); err != nil {
		return result, err
	}

	result.Price, err = sy.Price(item)
	if err != nil {
		log.Println("err price", err)
		return result, err
	}

	elements, err = item.QuerySelectorAll(sy.Selectors.Address.Build())
	if err != nil {
		return result, err
	} else if len(elements) != 4 {
		return result, errors.New("element error when address")
	}

	result.Address, err = elements[0].TextContent()
	if err != nil {
		return result, err
	}

	result.City = sy.GetCity()
	result.Address = strings.Replace(result.Address, result.City, "", 1)
	result.Section, result.Address = SeparateSectionAndAddress(result.Address)

	result.Age, err = elements[1].TextContent()
	if err != nil {
		return result, err
	}

	result.Shape, err = elements[2].TextContent()
	if err != nil {
		return result, err
	}

	elements, err = item.QuerySelectorAll(sy.Selectors.Detail.Build())
	if err != nil {
		return result, err
	} else if len(elements) != 7 {
		return result, errors.New("element error when detail")
	}

	result.Area, err = elements[0].TextContent()
	if err != nil {
		return result, err
	}
	result.Area = strings.ReplaceAll(result.Area, " ", "")

	result.Mainarea, err = elements[1].TextContent()
	if err != nil {
		return result, err
	}
	result.Mainarea = strings.ReplaceAll(result.Mainarea, " ", "")

	result.Layout, err = elements[2].TextContent()
	if err != nil {
		return result, err
	}

	result.Floor, err = elements[3].TextContent()
	if err != nil {
		return result, err
	}

	return result, err
}

func (sy *ParseSinYi) SetTotalRow(ctx context.Context, pg pw.Page) error {
	if sy.TotalPage != -1 {
		return nil
	}

	qs := sy.Selectors.Total.Build()
	if _, err := pg.WaitForSelector(qs); err != nil {
		return err
	} else if elements, err := pg.QuerySelectorAll(qs); err != nil {
		return err
	} else if len(elements) == 0 {
		return errors.New("")
	} else if text, err := elements[len(elements)-1].TextContent(); err != nil {
		return err
	} else if sy.TotalPage, err = strconv.Atoi(text); err != nil {
		return err
	}

	return nil
}

func (sy ParseSinYi) ItemQuerySelector() string {
	return sy.Selectors.ListItem.Build()
}

func (sy *ParseSinYi) UpdateCurrentPage() {
	sy.CurrentPage++
}

func (sy ParseSinYi) HasNext() bool {
	return sy.TotalPage == -1 || sy.CurrentPage <= sy.TotalPage
}

func (sy ParseSinYi) URL() string {
	return strings.Join([]string{
		"https://www.sinyi.com.tw/buy/list",
		fmt.Sprintf("%d-%d-price", sy.MinPrice, sy.MaxPrice),
		fmt.Sprintf("%s-city", sy.City),
		"Taipei-R-mrtline/03-mrt/default-desc",
		strconv.Itoa(sy.CurrentPage),
	}, "/")
}
