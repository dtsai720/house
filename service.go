package house

import (
	"context"
	"log"
	"sort"
	"strings"

	validator "github.com/go-playground/validator/v10"
)

type houseService struct {
	db        Postgres
	validator *validator.Validate
}

func NewService(db Postgres) Service {
	return houseService{db: db, validator: validator.New()}
}

func (hs houseService) Upsert(ctx context.Context, in UpserthouseRequest) error {
	if err := hs.validator.Struct(in); err != nil {
		log.Println(err)
		return err
	}

	return hs.db.Upsert(ctx, in)
}

func (hs houseService) Get(ctx context.Context, in GethousesRequest) (int64, []GethousesResponse, error) {
	for i := 0; i < len(in.Shape); i++ {
		in.Shape[i] = strings.Join([]string{"%", in.Shape[i], "%"}, "")
	}
	return hs.db.Get(ctx, in)
}

func (hs houseService) ListCities(ctx context.Context) ([]string, error) {
	return hs.db.ListCities(ctx)
}

func (hs houseService) ListSectionByCity(ctx context.Context, name string) ([]string, error) {
	return hs.db.ListSectionByCity(ctx, name)
}

func (hs houseService) ListShape(ctx context.Context) ([]string, error) {
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
