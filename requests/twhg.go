package requests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/house"
)

type Twhg struct {
	City        string
	CurrentPage int
	TotalPage   int
}

func (t *Twhg) Request() (*http.Request, error) {
	const URL = "https://www.twhg.com.tw/api/SearchList.php"

	data := url.Values{}
	data.Set("city", t.City)
	data.Set("totalPrice[]", "800")
	data.Add("totalPrice[]", "3000")
	data.Set("nowpag", strconv.Itoa(t.CurrentPage))
	data.Set("paydumeyes", "1")

	r, err := http.NewRequest(http.MethodPost, URL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}

	r.Header.Set("authority", "www.twhg.com.tw")
	r.Header.Set("content-type", "application/x-www-form-urlencoded; charset=UTF-8")
	r.Header.Set("origin", "https://www.twhg.com.tw")
	r.Header.Set("referer", fmt.Sprintf("https://www.twhg.com.tw/object_list-A.php?city=%s", t.City))
	r.Header.Set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36")
	return r, nil
}

func (t *Twhg) ToCanical(in []byte) ([]house.UpserthouseRequest, error) {
	type Body struct {
		NowPag string `json:"nowPag"`
		ToPag  int    `json:"toPag"`
		Obj    []struct {
			Price    string `json:"pay"`
			City     string `json:"city"`
			Section  string `json:"area"`
			Adderess string `json:"add"`
			Number   string `json:"no"`
		} `json:"obj"`
	}
	var err error
	body := new(Body)
	if err = json.Unmarshal(in, body); err != nil {
		return nil, err
	}

	if t.TotalPage == -1 {
		t.TotalPage = body.ToPag
	}

	output := make([]house.UpserthouseRequest, 0, len(body.Obj))
	for _, object := range body.Obj {
		var price int
		price, err = strconv.Atoi(object.Price)
		if err != nil {
			continue
		}

		output = append(output, house.UpserthouseRequest{
			City:     t.City,
			Section:  object.Section,
			Price:    price,
			Link:     "",
			Floor:    "",
			Age:      "",
			Mainarea: "",
			Area:     "",
			Layout:   "",
			Shape:    "",
			Room:     "",
			Purpose:  nil,
			Address:  object.Adderess,
			Others:   nil,
		})
	}

	return nil, nil
}

func (t *Twhg) UpdateCurrentPage() {
	t.CurrentPage++
}

func (t *Twhg) HasNext() bool {
	return t.TotalPage == -1 || t.CurrentPage < t.TotalPage
}

func NewTwhg(city string) AJAXParser {
	return &Twhg{
		City:        city,
		CurrentPage: 1,
		TotalPage:   -1,
	}
}
