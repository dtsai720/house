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

func FirefoxEvent(ctx context.Context, db hourse.Postgres, pw *playwright.Playwright) {
	browser, err := pw.Firefox.Launch()
	if err != nil {
		log.Fatalf("could not launch browser: %v", err)
	}

	defer browser.Close()

	page, err := browser.NewPage()
	if err != nil {
		log.Fatalf("could not create page: %v", err)
	}

	defer page.Close()

	service := hourse.NewService(page, db)
	// cities := []string{"台北市", "新北市", "桃園市", "新竹縣", "台南市", "高雄市", "屏東縣"}
	cities := []string{"台北市", "新北市"}
	for _, city := range cities {
		item := parser.NewParseYungChing(city)
		service.FetchAll(ctx, item)
	}
}

func ChromiumEvent(ctx context.Context, db hourse.Postgres, pw *playwright.Playwright) {
	browser, err := pw.Chromium.Launch()
	if err != nil {
		log.Fatalf("could not launch browser: %v", err)
	}

	defer browser.Close()

	page, err := browser.NewPage()
	if err != nil {
		log.Fatalf("could not create page: %v", err)
	}

	defer page.Close()

	service := hourse.NewService(page, db)
	// regions := []int{1, 3, 4, 5, 6, 15, 17, 19}
	regions := []int{1, 3}
	for _, num := range regions {
		item := parser.NewParseSale(num)
		service.FetchAll(ctx, item)
	}
}

func main() {
	pw, err := playwright.Run()
	if err != nil {
		log.Fatalf("could not start playwright: %v", err)
	}

	defer pw.Stop()

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
	srv.Handler = hrhttp.NewServer(chi.NewMux(), hourse.NewService(nil, db))

	ctx, cancel := context.WithCancel(context.Background())

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalln(err)
		}
	}()

	go FirefoxEvent(ctx, db, pw)
	go ChromiumEvent(ctx, db, pw)

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
