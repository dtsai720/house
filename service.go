package hourse

import (
	"context"
	"log"
	"strconv"
	"strings"
	"time"

	pw "github.com/playwright-community/playwright-go"
)

type HourseService struct {
	page pw.Page
	pg   Postgres
}

func NewService(page pw.Page, pg Postgres) Service {
	return HourseService{page: page, pg: pg}
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

func (hs HourseService) GetTotalRow(ctx context.Context, qs string) (int, error) {
	var value string
	if _, err := hs.page.WaitForSelector(qs); err != nil {
		return -1, err
	} else if element, err := hs.page.QuerySelector(qs); err != nil {
		return -1, err
	} else if value, err = element.TextContent(); err != nil {
		return -1, err
	}
	return strconv.Atoi(ToValue(value))
}

func (hs HourseService) FetchOne(ctx context.Context, bp Parser) ([]UpsertHourseRequest, error) {
	var err error
	var items []pw.ElementHandle
	qs := bp.ItemQuerySelector()

	log.Printf("Current URL: %s\n", bp.URL())

	if _, err = hs.page.Goto(bp.URL()); err != nil {
		return nil, err
	} else if err = bp.SetTotalRow(ctx, hs.GetTotalRow); err != nil {
		return nil, err
	} else if _, err = hs.page.WaitForSelector(qs); err != nil {
		return nil, err
	} else if items, err = hs.page.QuerySelectorAll(qs); err != nil {
		return nil, err
	}

	var output []UpsertHourseRequest
	for _, item := range items {
		var result UpsertHourseRequest
		var err error

		if result, err = bp.FetchItem(item); err != nil {
			continue
		}

		output = append(output, result)
	}

	return output, nil
}

func (hs HourseService) FetchAll(ctx context.Context, bp Parser) error {
	if !bp.HasNext() {
		return nil
	}

	response, err := hs.FetchOne(ctx, bp)
	if err != nil {
		log.Printf("fetch one error: %v", err)
	}

	for _, body := range response {
		if err := hs.Upsert(ctx, body); err != nil {
			log.Printf("upsert error: %v", err)
		}
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

func (hs HourseService) Upsert(ctx context.Context, in UpsertHourseRequest) error {
	return hs.pg.Upsert(ctx, in)
}

func (hs HourseService) Get(ctx context.Context, in GetHoursesRequest) (int64, []GetHoursesResponse, error) {
	return hs.pg.Get(ctx, in)
}
