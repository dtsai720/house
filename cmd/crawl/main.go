package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hourse/parser"
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
	pw, err := playwright.Run()
	if err != nil {
		log.Fatalf("could not start playwright: %v", err)
	}

	defer pw.Stop()

	log.Printf("initial done...")

	ctx, cancel := context.WithCancel(context.Background())

	go FirefoxEvent(ctx, pw)
	go ChromiumEvent(ctx, pw)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	cancel()

	time.Sleep(time.Second * 3)
	log.Println("server done")
}
