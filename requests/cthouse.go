package requests

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
)

func HandleCthouse(city string) error {
	const URL = "https://buy.cthouse.com.tw/area-house.aspx"

	client := new(http.Client)
	data := url.Values{}
	data.Set("arg", "%E6%96%B0%E5%8C%97%E5%B8%82-city%2F800-3000-price")
	data.Set("page", "1")

	r, _ := http.NewRequest(http.MethodPost, URL, strings.NewReader(data.Encode()))
	r.Header.Set("authority", "buy.cthouse.com.tw")
	r.Header.Set("content-type", "application/x-www-form-urlencoded; charset=UTF-8")
	r.Header.Set("origin", "https://buy.cthouse.com.tw")
	r.Header.Set("referer", fmt.Sprintf("https://buy.cthouse.com.tw/area/%s-city/800-3000-price", city))
	r.Header.Set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36")

	resp, err := client.Do(r)
	if err != nil {
		log.Fatalln(err)
	}

	log.Printf("status code is %d\n", resp.StatusCode)

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}
	log.Printf("%s\n", body)
	return nil
}
