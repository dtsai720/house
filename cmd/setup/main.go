package main

import (
	"log"

	validator "github.com/go-playground/validator/v10"
	playwright "github.com/playwright-community/playwright-go"
)

type Request struct {
	Name string `json:"name" validate:"omitempty,oneof=en us am io zh-s"`
}

func main() {
	// if err := playwright.Install(); err != nil {
	// 	log.Fatalln(err)
	// }

	pw, err := playwright.Run()
	if err != nil {
		log.Fatalln(err)
	}

	wk, err := pw.WebKit.Launch()
	if err != nil {
		log.Fatalln(err)
	}
	defer wk.Close()

	validate := validator.New()

	// create an instance of MyStruct to validate
	myStruct := Request{Name: "zh-s"}

	// perform the validation
	if err := validate.Struct(myStruct); err != nil {
		log.Fatalln(err)
	}
	log.Println("done")
}
