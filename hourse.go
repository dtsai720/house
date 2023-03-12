package hourse

import (
	"context"

	"github.com/google/uuid"
	pw "github.com/playwright-community/playwright-go"
)

type UpsertHourseRequest struct {
	City     string   `json:"city" validate:"required"`
	Section  string   `json:"section" validate:"required"`
	Price    int      `json:"price" validate:"required"`
	Link     string   `json:"link" validate:"required"`
	Floor    string   `json:"floor,omitempty"`
	Age      string   `json:"age,omitempty"`
	Mainarea string   `json:"mainarea,omitempty"`
	Area     string   `json:"area,omitempty"`
	Layout   string   `json:"layout,omitempty"`
	Shape    string   `json:"shape,omitempty"`
	Room     string   `json:"room,omitempty"`
	Purpose  []string `json:"purpose,omitempty"`
	Address  string   `json:"address" validate:"required"`
	Others   []string `json:"others,omitempty"`
}

type GetHoursesRequest struct {
	City        []string `json:"city,omitempty"`
	Shape       []string `json:"shape,omitempty"`
	Section     []string `json:"section,omitempty"`
	MaxPrice    string   `json:"max_price,omitempty"`
	MinPrice    string   `json:"min_price,omitempty"`
	Age         string   `json:"age,omitempty"`
	MaxMainArea string   `json:"max_main_area,omitempty"`
	MinMainArea string   `json:"min_main_area,omitempty"`
}

type GetHoursesResponse struct {
	UniversalID uuid.UUID `json:"universal_id"`
	Link        string    `json:"link"`
	Layout      string    `json:"layout,omitempty"`
	Address     string    `json:"address,omitempty"`
	Price       string    `json:"price"`
	Floor       string    `json:"floor"`
	Shape       string    `json:"shape"`
	Age         string    `json:"age"`
	Area        string    `json:"area"`
	MainArea    string    `json:"main_area,omitempty"`
	Location    string    `json:"location"`
}

type ParserService interface {
	URL() string
	HasNext() bool
	UpdateCurrentPage()
	ItemQuerySelector() string
	SetTotalRow(context.Context, pw.Page) error
	FetchItem(item pw.ElementHandle) (UpsertHourseRequest, error)
}

type Postgres interface {
	Upsert(ctx context.Context, in UpsertHourseRequest) error
	Get(ctx context.Context, in GetHoursesRequest) (int64, []GetHoursesResponse, error)
	ListCities(ctx context.Context) ([]string, error)
	ListSectionByCity(ctx context.Context, name string) ([]string, error)
	ListShape(ctx context.Context) ([]string, error)
}

type Service interface {
	Upsert(ctx context.Context, in UpsertHourseRequest) error
	Get(ctx context.Context, in GetHoursesRequest) (int64, []GetHoursesResponse, error)
	ListCities(ctx context.Context) ([]string, error)
	ListSectionByCity(ctx context.Context, name string) ([]string, error)
	ListShape(ctx context.Context) ([]string, error)
}
