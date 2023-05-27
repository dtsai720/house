package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"strconv"
	"strings"

	"github.com/hourse"
	"github.com/hourse/postgres/sqlc"
)

type Queries interface {
	UpsertHourse(ctx context.Context, arg sqlc.UpsertHourseParams) error
	InsertSection(ctx context.Context, arg sqlc.InsertSectionParams) (sqlc.Section, error)
	InsertCity(ctx context.Context, name string) (sqlc.City, error)
	InsertShape(ctx context.Context, name string) (sqlc.Shape, error)

	GetHourses(ctx context.Context, arg sqlc.GetHoursesParams) ([]sqlc.GetHoursesRow, error)
	GetShape(ctx context.Context, name string) (sqlc.Shape, error)
	GetSection(ctx context.Context, name string) (sqlc.Section, error)
	GetCity(ctx context.Context, name string) (sqlc.City, error)

	ListCities(ctx context.Context) ([]string, error)
	ListSectionByCity(ctx context.Context, name string) ([]string, error)
	ListShape(ctx context.Context) ([]string, error)
}

type HourseRepository struct {
	db      *sql.DB
	queries Queries
}

func NewPostgres(db *sql.DB) hourse.Postgres {
	return HourseRepository{
		db:      db,
		queries: sqlc.New(db),
	}
}

func (hr HourseRepository) NewQueries(db sqlc.DBTX) Queries {
	return sqlc.New(db)
}

func (hr HourseRepository) ListCities(ctx context.Context) ([]string, error) {
	return hr.queries.ListCities(ctx)
}

func (hr HourseRepository) ListSectionByCity(ctx context.Context, name string) ([]string, error) {
	return hr.queries.ListSectionByCity(ctx, name)
}

func (hr HourseRepository) ListShape(ctx context.Context) ([]string, error) {
	return hr.queries.ListShape(ctx)
}

func (hr HourseRepository) Get(ctx context.Context, in hourse.GetHoursesRequest) (int64, []hourse.GetHoursesResponse, error) {
	response, err := hr.queries.GetHourses(ctx, sqlc.GetHoursesParams{
		City:        strings.Join(in.City, ","),
		Shape:       strings.Join(in.Shape, ","),
		Section:     strings.Join(in.Section, ","),
		MaxPrice:    in.MaxPrice,
		MinPrice:    in.MinPrice,
		Age:         in.Age,
		MaxMainArea: in.MaxMainArea,
		MinMainArea: in.MinMainArea,
	})
	if err != nil {
		return 0, nil, err
	}

	var count int64
	output := make([]hourse.GetHoursesResponse, 0, len(response))
	for _, body := range response {
		result := hourse.GetHoursesResponse{
			UniversalID: body.UniversalID,
			Link:        body.Link,
			Price:       body.Price,
			Floor:       body.Floor,
			Shape:       body.Shape,
			Age:         body.Age,
			Area:        body.Area,
			Location:    body.Location,
		}

		if body.Layout.Valid {
			result.Layout = body.Layout.String
		}

		if body.Address.Valid {
			result.Address = body.Address.String
		}

		if body.MainArea.Valid {
			result.MainArea = body.MainArea.String
		}

		output = append(output, result)

		count = body.TotalCount
	}
	return count, output, nil
}

func GetCity(ctx context.Context, q Queries, name string) (sqlc.City, error) {
	if city, err := q.GetCity(ctx, name); err == nil {
		return city, nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return city, err
	}
	return q.InsertCity(ctx, name)
}

func GetSection(ctx context.Context, q Queries, name string, cityID int32) (sqlc.Section, error) {
	if section, err := q.GetSection(ctx, name); err == nil {
		return section, nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return section, err
	}
	return q.InsertSection(ctx, sqlc.InsertSectionParams{Name: name, CityID: cityID})
}

func GetShape(ctx context.Context, q Queries, name string) (sqlc.Shape, error) {
	if shape, err := q.GetShape(ctx, name); err == nil {
		return shape, nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return shape, err
	}
	return q.InsertShape(ctx, name)
}

func (hr HourseRepository) Upsert(ctx context.Context, in hourse.UpsertHourseRequest) error {
	tx, err := hr.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	q := hr.NewQueries(tx)

	if city, err := GetCity(ctx, q, in.City); err != nil {
		log.Printf("get city error: %v", err)
		return err
	} else if section, err := GetSection(ctx, q, in.Section, city.ID); err != nil {
		log.Printf("get section error: %v", err)
		return err
	} else if shape, err := GetShape(ctx, q, in.Shape); err != nil {
		log.Printf("get shape error: %v", err)
		return err
	} else if raw, err := json.Marshal(in); err != nil {
		log.Printf("marshal data error: %v", err)
		return err
	} else if err = q.UpsertHourse(ctx, sqlc.UpsertHourseParams{
		SectionID: section.ID,
		Link:      in.Link,
		Layout:    sql.NullString{String: in.Layout, Valid: in.Layout != ""},
		Address:   sql.NullString{String: in.Address, Valid: in.Address != ""},
		Price:     strconv.Itoa(in.Price),
		Floor:     in.Floor,
		ShapeID:   shape.ID,
		Age:       in.Age,
		Area:      ToValue(in.Area),
		MainArea:  sql.NullString{String: ToValue(in.Mainarea), Valid: in.Mainarea != ""},
		Raw:       json.RawMessage(raw),
		Others:    in.Others,
	}); err != nil {
		log.Printf("upsert hourse error: %v, data is %s\n", err, raw)
		return err
	}
	return tx.Commit()
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
