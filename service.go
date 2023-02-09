package hourse

import (
	"context"
	"log"
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

func (hs HourseService) FetchAll(ctx context.Context, bp Parser) error {
	if !bp.HasNext() {
		return nil
	}

	response, err := bp.FetchOne(ctx, hs.page)
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
