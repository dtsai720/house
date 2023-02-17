package parser

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/hourse"
	pw "github.com/playwright-community/playwright-go"
)

type Service struct {
	client     *http.Client
	count      int
	resetCount int
	browser    struct {
		browserType pw.BrowserType
		browser     pw.Browser
		page        pw.Page
	}
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

func NewService(bt pw.BrowserType) Service {
	var output Service
	var err error
	output.client = new(http.Client)
	output.count = 0
	output.browser.browserType = bt
	output.resetCount = 100

	if output.browser.browser, err = bt.Launch(); err != nil {
		log.Fatalln(err)
	} else if output.browser.page, err = output.browser.browser.NewPage(); err != nil {
		log.Fatalln(err)
	}

	return output
}

func (hs *Service) Close() error {
	if err := hs.browser.page.Close(); err != nil {
		log.Println("page close error")
		return err
	} else if err = hs.browser.browser.Close(); err != nil {
		log.Println("browser close error")
		return err
	}
	return nil
}

func (hs *Service) Reset() error {
	if err := hs.Close(); err != nil {
		return err
	} else if hs.browser.browser, err = hs.browser.browserType.Launch(); err != nil {
		log.Println("browser launch error")
		return err
	} else if hs.browser.page, err = hs.browser.browser.NewPage(); err != nil {
		log.Println("browser new page error")
		return err
	}
	hs.count = 0
	return nil
}

func (hs Service) FetchOne(ctx context.Context, bp hourse.ParserService) ([]hourse.UpsertHourseRequest, error) {
	var err error
	var items []pw.ElementHandle
	qs := bp.ItemQuerySelector()

	log.Printf("Current URL: %s\n", bp.URL())

	if _, err = hs.browser.page.Goto(bp.URL()); err != nil {
		return nil, err
	} else if err = bp.SetTotalRow(ctx, hs.browser.page); err != nil {
		return nil, err
	} else if _, err = hs.browser.page.WaitForSelector(qs); err != nil {
		return nil, err
	} else if items, err = hs.browser.page.QuerySelectorAll(qs); err != nil {
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

func (hs *Service) FetchAll(ctx context.Context, bp hourse.ParserService) error {
	if !bp.HasNext() {
		return nil
	}

	if hs.count == hs.resetCount {
		hs.Reset()
	}
	hs.count++

	response, err := hs.FetchOne(ctx, bp)
	if err != nil {
		log.Printf("fetch one error: %v", err)
	}

	for _, body := range response {
		go hs.Upsert(ctx, body)
	}

	bp.UpdateCurrentPage()
	rand.Seed(time.Now().UnixNano())
	time.Sleep(time.Second * time.Duration(rand.Intn(5)+5))

	select {
	case <-ctx.Done():
		log.Println("Start stopping...")
		return nil
	default:
		return hs.FetchAll(ctx, bp)
	}
}
