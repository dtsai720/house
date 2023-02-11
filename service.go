package hourse

import "context"

type HourseService struct {
	db Postgres
}

func NewService(db Postgres) Service {
	return HourseService{db: db}
}

func (hs HourseService) Upsert(ctx context.Context, in UpsertHourseRequest) error {
	return hs.db.Upsert(ctx, in)
}

func (hs HourseService) Get(ctx context.Context, in GetHoursesRequest) (int64, []GetHoursesResponse, error) {
	return hs.db.Get(ctx, in)
}
