package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/hourse"
	hrhttp "github.com/hourse/http"
	"github.com/hourse/postgres"
	_ "github.com/lib/pq"
)

func main() {
	conn, err := sql.Open("postgres", fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		"localhost", 5432, "postgres", "postgres", "hourse"))

	if err != nil {
		log.Fatalln(err)
	} else if err = conn.Ping(); err != nil {
		log.Fatalln(err)
	}

	db := postgres.NewPostgres(conn)
	log.Printf("initial done...")

	srv := new(http.Server)
	srv.Addr = ":8080"
	srv.Handler = hrhttp.NewServer(chi.NewMux(), hourse.NewService(db))

	ctx, cancel := context.WithCancel(context.Background())

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalln(err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalln(err)
	}

	cancel()

	time.Sleep(time.Second * 3)
	log.Println("server done")
}
