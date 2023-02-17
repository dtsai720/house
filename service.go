package hourse

import (
	"context"
	"log"

	validator "github.com/go-playground/validator/v10"
)

type HourseService struct {
	db        Postgres
	validator *validator.Validate
}

func NewService(db Postgres) Service {
	return HourseService{db: db, validator: validator.New()}
}

func (hs HourseService) Upsert(ctx context.Context, in UpsertHourseRequest) error {
	if err := hs.validator.Struct(in); err != nil {
		log.Println(err)
		return err
	}

	return hs.db.Upsert(ctx, in)
}

func (hs HourseService) Get(ctx context.Context, in GetHoursesRequest) (int64, []GetHoursesResponse, error) {
	return hs.db.Get(ctx, in)
}
