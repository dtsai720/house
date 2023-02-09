package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hourse"
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
	items := []hourse.Parser{
		parser.NewHoueseParser(1),
		parser.NewHoueseParser(3),
	}

	for _, item := range items {
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
	}

	if err := conn.Ping(); err != nil {
		log.Fatalln(err)
	}

	db := postgres.NewPostgres(conn)
	log.Printf("initial done...")

	ctx, cancel := context.WithCancel(context.Background())

	go FirefoxEvent(ctx, db, pw)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	cancel()

	time.Sleep(time.Second * 3)
	log.Println("done")
}
