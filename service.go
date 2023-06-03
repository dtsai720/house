package hourse

import (
	"context"
	"log"
	"sort"
	"strings"

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
	for i := 0; i < len(in.Shape); i++ {
		in.Shape[i] = strings.Join([]string{"%", in.Shape[i], "%"}, "")
	}
	return hs.db.Get(ctx, in)
}

func (hs HourseService) ListCities(ctx context.Context) ([]string, error) {
	return hs.db.ListCities(ctx)
}

func (hs HourseService) ListSectionByCity(ctx context.Context, name string) ([]string, error) {
	return hs.db.ListSectionByCity(ctx, name)
}

func (hs HourseService) ListShape(ctx context.Context) ([]string, error) {
	shapes, err := hs.db.ListShape(ctx)
	if err != nil {
		return nil, err
	}
	uniform := make(map[string]struct{})

	for _, shape := range shapes {
		for _, name := range strings.Split(shape, "/") {
			uniform[name] = struct{}{}
		}
	}

	result := make(sort.StringSlice, 0, len(uniform))
	for name := range uniform {
		if name == "不限" {
			continue
		}
		result = append(result, name)
	}
	sort.Sort(result)
	return result, nil
}
