package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/house"
)

type Server struct {
	router  *chi.Mux
	service house.Service
}

func NewServer(r *chi.Mux, service house.Service) *Server {
	server := new(Server)
	server.router = r
	server.service = service
	server.routes()
	return server
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.router.ServeHTTP(w, r)
}
