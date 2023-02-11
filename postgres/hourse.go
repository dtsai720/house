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
	InsertSection(ctx context.Context, arg sqlc.InsertSectionParams) (int64, error)
	InsertCity(ctx context.Context, name string) (int64, error)
	InsertShape(ctx context.Context, name string) (int64, error)
	GetHourses(ctx context.Context, arg sqlc.GetHoursesParams) ([]sqlc.GetHoursesRow, error)
	GetShape(ctx context.Context, name string) (sqlc.Shape, error)
	GetSection(ctx context.Context, name string) (sqlc.Section, error)
	GetCity(ctx context.Context, name string) (sqlc.City, error)
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
		output = append(output, hourse.GetHoursesResponse{
			UniversalID: body.UniversalID,
			Link:        body.Link,
			Layout:      body.Layout,
			Address:     body.Address,
			Price:       body.Price,
			Floor:       body.Floor,
			Shape:       body.Shape,
			Age:         body.Age,
			Area:        body.Area,
			MainArea:    body.MainArea,
			Location:    body.Location,
		})

		count = body.TotalCount
	}
	return count, output, nil
}

func (hr HourseRepository) GetCityID(ctx context.Context, name string) (int32, error) {
	if result, err := hr.queries.GetCity(ctx, name); err == nil {
		return int32(result.ID), nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return 0, err
	} else if cityID, err := hr.queries.InsertCity(ctx, name); err != nil {
		return 0, err
	} else {
		return int32(cityID), nil
	}
}

func (hr HourseRepository) GetSectionID(ctx context.Context, name string, cityID int32) (int32, error) {
	if result, err := hr.queries.GetSection(ctx, name); err == nil {
		return int32(result.ID), nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return 0, err
	} else if cityID, err := hr.queries.InsertSection(ctx, sqlc.InsertSectionParams{
		Name:   name,
		CityID: cityID,
	}); err != nil {
		return 0, err
	} else {
		return int32(cityID), nil
	}
}

func (hr HourseRepository) GetShapeID(ctx context.Context, name string) (int32, error) {
	if result, err := hr.queries.GetShape(ctx, name); err == nil {
		return int32(result.ID), nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return 0, err
	} else if cityID, err := hr.queries.InsertShape(ctx, name); err != nil {
		return 0, err
	} else {
		return int32(cityID), nil
	}
}

func (hr HourseRepository) Upsert(ctx context.Context, in hourse.UpsertHourseRequest) error {
	tx, err := hr.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	q := hr.NewQueries(tx)

	if raw, err := json.Marshal(in); err != nil {
		log.Printf("marshal data error: %v", err)
		return err
	} else if cityID, err := hr.GetCityID(ctx, in.City); err != nil {
		log.Printf("insert city error: %v", err)
		return err
	} else if sectionID, err := hr.GetSectionID(ctx, in.Section, cityID); err != nil {
		log.Printf("insert section error: %v", err)
		return err
	} else if shapeID, err := hr.GetShapeID(ctx, in.Shape); err != nil {
		log.Printf("insert shape error: %v", err)
		return err
	} else if err = q.UpsertHourse(ctx, sqlc.UpsertHourseParams{
		SectionID: sectionID,
		Link:      in.Link,
		Layout:    sql.NullString{String: in.Layout, Valid: in.Layout != ""},
		Address:   sql.NullString{String: in.Address, Valid: in.Address != ""},
		Price:     strconv.Itoa(in.Price),
		Floor:     in.Floor,
		ShapeID:   shapeID,
		Age:       in.Age,
		Area:      ToValue(in.Area),
		MainArea:  sql.NullString{String: ToValue(in.Mainarea), Valid: in.Mainarea != ""},
		Raw:       json.RawMessage(raw),
		Others:    in.Others,
	}); err != nil {
		log.Printf("upsert hourse error: %v\n, data is %s", err, raw)
		return err
	} else if err = tx.Commit(); err != nil {
		log.Printf("upsert commit error: %v", err)
		return err
	}

	return nil
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
