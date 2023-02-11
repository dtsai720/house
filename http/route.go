package http

func (s *Server) routes() {
	s.router.Get("/hourse", s.HandleGetMulti())
	s.router.Put("/hourse", s.HandleUpsert())
	s.router.Get("/hourse/{id}", s.HandleGet())
}
