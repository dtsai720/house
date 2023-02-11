package http

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/hourse"
)

func (s *Server) HandleUpsert() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body hourse.UpsertHourseRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			log.Printf("error when decode: %v\n", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if err := s.service.Upsert(r.Context(), body); err != nil {
			log.Printf("error when upsert: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

func (s *Server) HandleGetMulti() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var request hourse.GetHoursesRequest
		param := r.URL.Query()
		request.Age = param.Get("age")
		request.MaxMainArea = param.Get("max_main_area")
		request.MinMainArea = param.Get("min_main_area")
		request.MaxPrice = param.Get("max_price")
		request.MinPrice = param.Get("min_price")

		if param.Has("city") {
			request.City = param["city"]
		}

		if param.Has("shape") {
			request.Shape = param["shape"]
		}

		if param.Has("section") {
			request.Section = param["section"]
		}

		count, body, err := s.service.Get(r.Context(), request)
		if err != nil {
			log.Printf("error when get: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		resp, err := json.Marshal(body)
		if err != nil {
			log.Printf("error when marshal: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Write(resp)
		w.Header().Set("x-total-count", strconv.Itoa(int(count)))
	}
}

func (s *Server) HandleGet() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}
