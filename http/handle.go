package http

import (
	"net/http"
)

func (s *Server) HandleGetMulti() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}

func (s *Server) HandleGet() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}
