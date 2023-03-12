package http

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
)

func (s *Server) routes() {
	s.router.Get("/hourse", s.HandleGetMulti())
	s.router.Put("/hourse", s.HandleUpsert())
	s.router.Get("/city", s.HandleListCities())
	s.router.Get("/section", s.HandleListSection())
	s.router.Get("/shape", s.HandleListShape())

	pwd, _ := os.Getwd()
	dir := http.Dir(filepath.Join(pwd, "static"))

	s.router.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		prefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(prefix, http.FileServer(dir))
		fs.ServeHTTP(w, r)
	})
}
