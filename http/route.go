package http

func (s *Server) routes() {
	s.router.Get("/hourse", s.HandleGetMulti())
	s.router.Get("/hourse/{id}", s.HandleGet())
}
