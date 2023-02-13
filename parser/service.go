package parser

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/hourse"
	pw "github.com/playwright-community/playwright-go"
)

type Service struct {
	page   pw.Page
	client *http.Client
}

func NewService(page pw.Page) Service {
	return Service{page: page, client: new(http.Client)}
}

func ToValue(in string) string {
	var sb strings.Builder
	for _, char := range in {
		if char == '.' || ('0' <= char && char <= '9') {
			sb.WriteRune(char)
		}
	}
	return sb.String()
}

func (hs Service) FetchOne(ctx context.Context, bp hourse.ParserService) ([]hourse.UpsertHourseRequest, error) {
	var err error
	var items []pw.ElementHandle
	qs := bp.ItemQuerySelector()

	log.Printf("Current URL: %s\n", bp.URL())

	if _, err = hs.page.Goto(bp.URL()); err != nil {
		return nil, err
	} else if err = bp.SetTotalRow(ctx, hs.page); err != nil {
		return nil, err
	} else if _, err = hs.page.WaitForSelector(qs); err != nil {
		return nil, err
	} else if items, err = hs.page.QuerySelectorAll(qs); err != nil {
		return nil, err
	}

	var output []hourse.UpsertHourseRequest
	for _, item := range items {
		var result hourse.UpsertHourseRequest
		var err error

		if result, err = bp.FetchItem(item); err != nil {
			continue
		}

		result.City = strings.TrimSpace(result.City)
		result.Section = strings.TrimSpace(result.Section)
		result.Link = strings.TrimSpace(result.Link)
		result.Floor = strings.TrimSpace(result.Floor)
		result.Age = strings.TrimSpace(result.Age)
		result.Mainarea = strings.TrimSpace(result.Mainarea)
		result.Area = strings.TrimSpace(result.Area)
		result.Layout = strings.TrimSpace(result.Layout)
		result.Shape = strings.TrimSpace(result.Shape)
		result.Room = strings.TrimSpace(result.Room)
		result.Address = strings.TrimSpace(result.Address)
		for i := 0; i < len(result.Purpose); i++ {
			result.Purpose[i] = strings.TrimSpace(result.Purpose[i])
		}
		for i := 0; i < len(result.Others); i++ {
			result.Others[i] = strings.TrimSpace(result.Others[i])
		}
		output = append(output, result)
	}

	return output, nil
}

func (hs Service) Upsert(ctx context.Context, in hourse.UpsertHourseRequest) error {
	body, err := json.Marshal(in)
	if err != nil {
		return err
	}

	const URL = "http://localhost:8000/hourse"

	r, err := http.NewRequest(http.MethodPut, URL, bytes.NewReader(body))
	if err != nil {
		return err
	}

	resp, err := hs.client.Do(r)
	if err != nil {
		return err
	} else if resp.StatusCode != http.StatusNoContent {
		return errors.New("")
	}
	return nil
}

func (hs Service) FetchAll(ctx context.Context, bp hourse.ParserService) error {
	if !bp.HasNext() {
		return nil
	}

	response, err := hs.FetchOne(ctx, bp)
	if err != nil {
		log.Printf("fetch one error: %v", err)
	}

	for _, body := range response {
		go hs.Upsert(ctx, body)
	}

	bp.UpdateCurrentPage()
	time.Sleep(time.Second * 5)

	select {
	case <-ctx.Done():
		log.Println("Start stopping...")
		return nil
	default:
		return hs.FetchAll(ctx, bp)
	}
}
