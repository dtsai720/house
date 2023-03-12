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
	"github.com/hourse/parser"
	"github.com/hourse/postgres"
	_ "github.com/lib/pq"
	playwright "github.com/playwright-community/playwright-go"
)

func FirefoxEvent(ctx context.Context, pw *playwright.Playwright) {
	service := parser.NewService(pw.Firefox)
	defer service.Close()

	for _, city := range []string{"Taipei", "NewTaipei"} {
		item := parser.NewParseSinYi(city)
		service.FetchAll(ctx, item)
	}

	cities := []string{"台北市", "新北市", "桃園市", "高雄市", "新竹縣", "新竹市", "台南市", "屏東縣"}
	for _, city := range cities {
		item := parser.NewParseYungChing(city)
		service.FetchAll(ctx, item)
	}

	for _, city := range []string{"Hsinchu-city", "Hsinchu-county", "Taoyuan-city", "Kaohsiung-city"} {
		item := parser.NewParseSinYi(city)
		service.FetchAll(ctx, item)
	}
}

func ChromiumEvent(ctx context.Context, pw *playwright.Playwright) {
	service := parser.NewService(pw.Chromium)
	defer service.Close()

	regions := []int{1, 3}
	for _, num := range regions {
		item := parser.NewParseSale(num)
		service.FetchAll(ctx, item)
	}
}

func main() {
	// if err := playwright.Install(); err != nil {
	// 	log.Fatalln(err)
	// }
	pw, err := playwright.Run()
	if err != nil {
		log.Fatalf("could not start playwright: %v", err)
	}

	defer pw.Stop()

	ctx, cancel := context.WithCancel(context.Background())

	go FirefoxEvent(ctx, pw)
	go ChromiumEvent(ctx, pw)

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
	srv.Addr = ":8000"
	srv.Handler = hrhttp.NewServer(chi.NewMux(), hourse.NewService(db))

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
