package main

import (
	"bytes"
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/house"
)

const (
	UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
)

type HbHousing struct {
	City        string
	CurrentPage int
	TotalPage   int
	PageSize    int
	BaseURL     string
	Client      *http.Client
}

func NewHbHousing(city string) *HbHousing {
	return &HbHousing{
		City:        city,
		CurrentPage: 1,
		TotalPage:   -1,
		PageSize:    10,
		BaseURL:     "https://www.hbhousing.com.tw",
		Client:      new(http.Client),
	}
}

func (h *HbHousing) UpdatePage() {
	h.CurrentPage++
}

func (h *HbHousing) HasNext() bool {
	return h.TotalPage == -1 || h.CurrentPage <= h.TotalPage
}

func (h *HbHousing) GetCityCode(city string) int {
	switch city {
	case "台北市":
		return 3
	case "新北市":
		return 4
	}
	return 0
}

func (h *HbHousing) GetItems(ctx context.Context) ([]Item, error) {
	const URL = "https://www.hbhousing.com.tw/ajax/dataService.aspx?job=search&path=house"

	data := url.Values{}
	data.Set("q", fmt.Sprintf("2^1^%d^^800_3000^P^^^^^^^^^^^^^0^^%d^0", h.GetCityCode(h.City), h.CurrentPage))
	data.Set("rlg", "1")

	log.Printf("current is %d and total is %d\n", h.CurrentPage, h.TotalPage)
	r, err := http.NewRequestWithContext(ctx, http.MethodPost, URL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}

	r.Header.Set("content-type", "application/x-www-form-urlencoded; charset=UTF-8")
	r.Header.Set("origin", h.BaseURL)
	r.Header.Set("referer", fmt.Sprintf("%s/BuyHouse/%s/", h.BaseURL, h.City))
	r.Header.Set("user-agent", UserAgent)
	resp, err := h.Client.Do(r)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status code is %d", resp.StatusCode)
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	candidate := new(struct {
		Data []Item `json:"data"`
		All  int    `json:"all"`
	})

	if err := json.Unmarshal(body, candidate); err != nil {
		return nil, err
	}

	if h.TotalPage == -1 {
		h.TotalPage = candidate.All / h.PageSize
	}
	return candidate.Data, nil
}

type Item struct {
	Link        string `json:"s,omitempty"`
	FullAddress string `json:"x,omitempty"`
	Shape       string `json:"t,omitempty"`
	Price       string `json:"np,omitempty"`
}

func (h *HbHousing) FetchSection(address string) string {
	var sb strings.Builder
	for _, char := range address {
		sb.WriteRune(char)
		switch char {
		case '鄉', '鎮', '市', '區':
			return sb.String()
		}
	}
	return ""
}

func (h *HbHousing) FetchCity(address string) string {
	var sb strings.Builder
	for _, char := range address {
		sb.WriteRune(char)
		switch char {
		case '縣', '市':
			return sb.String()
		}
	}
	return ""
}

func (h *HbHousing) ToUpsertRequest(ctx context.Context, item Item) (*house.UpserthouseRequest, error) {
	link := fmt.Sprintf("%s/detail/?sn=%s", h.BaseURL, item.Link)
	r, err := http.NewRequestWithContext(ctx, http.MethodGet, link, nil)
	if err != nil {
		return nil, err
	}

	r.Header.Set("user-agent", UserAgent)
	resp, err := h.Client.Do(r)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, err
	}

	defer resp.Body.Close()

	document, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, err
	}

	body := new(house.UpserthouseRequest)

	body.Price, err = strconv.Atoi(item.Price)
	if err != nil {
		return nil, err
	}

	item.FullAddress = strings.TrimSpace(item.FullAddress)
	body.City = h.FetchCity(item.FullAddress)
	item.FullAddress = strings.ReplaceAll(item.FullAddress, body.City, "")
	body.Section = h.FetchSection(item.FullAddress)
	item.FullAddress = strings.ReplaceAll(item.FullAddress, body.Section, "")
	body.Address = item.FullAddress
	body.Link = link
	body.Shape = strings.TrimSpace(item.Shape)
	body.Layout = strings.TrimSpace(document.Find("li.icon_room").Text())
	body.Floor = strings.TrimSpace(strings.ReplaceAll(document.Find("li.icon_floor").Text(), " ", ""))
	body.Age = strings.TrimSpace(strings.Split(document.Find("li.icon_age").Text(), "年")[0] + "年")
	document.Find("div.basicinfo-box > table > tbody > tr").Each(func(i int, s *goquery.Selection) {
		if strings.HasPrefix(s.Text(), "登記面積") {
			text := strings.ReplaceAll(s.Text(), "登記面積", "")
			body.Area = strings.TrimSpace(strings.Split(text, " ")[0])
		}
		if strings.HasPrefix(s.Text(), "登記建坪") {
			text := strings.ReplaceAll(s.Text(), "登記建坪", "")
			body.Area = strings.TrimSpace(strings.Split(text, " ")[0])
		}
		if strings.HasPrefix(s.Text(), "主建物") {
			body.Mainarea = strings.TrimSpace(s.Text())
		}
	})

	log.Printf("updates URL: %s", body.Link)
	return body, nil
}

func (h *HbHousing) Upsert(ctx context.Context, in *house.UpserthouseRequest) error {
	body, err := json.Marshal(in)
	if err != nil {
		return err
	}

	const URL = "http://localhost:8000/house"

	r, err := http.NewRequestWithContext(ctx, http.MethodPut, URL, bytes.NewReader(body))
	if err != nil {
		return err
	}

	resp, err := h.Client.Do(r)
	if err != nil {
		return err
	}

	if resp.StatusCode != http.StatusNoContent {
		return errors.New("")
	}
	return nil
}

func (h *HbHousing) Process(ctx context.Context) error {
	if !h.HasNext() {
		return nil
	}

	items, err := h.GetItems(ctx)
	if err != nil {
		return err
	}

	for _, item := range items {
		time.Sleep(time.Second * 5)
		body, err := h.ToUpsertRequest(ctx, item)
		if err != nil {
			log.Println(err)
			continue
		}

		if err := h.Upsert(ctx, body); err != nil {
			log.Println(err)
		}
	}
	h.UpdatePage()
	return h.Process(ctx)
}

func main() {
	ctx := context.Background()
	citys := []string{"台北市", "新北市"}
	for _, city := range citys {
		in := NewHbHousing(city)
		if err := in.Process(ctx); err != nil {
			log.Println(err)
		}
	}
}
