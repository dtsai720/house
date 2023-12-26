package requests

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/house"
)

type AJAXParser interface {
	Request() (*http.Request, error)
	ToCanical(body []byte) ([]house.UpserthouseRequest, error)
	UpdateCurrentPage()
	HasNext() bool
}

func ProcessParseByAJAX(ctx context.Context, ajax AJAXParser, client *http.Client) error {
	r, err := ajax.Request()
	if err != nil {
		return err
	}

	resp, err := client.Do(r)
	if err != nil {
		return err
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("status code is %d not %d", resp.StatusCode, http.StatusOK)
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	in, err := ajax.ToCanical(body)
	if err != nil {
		return err
	}

	for _, row := range in {
		Upsert(ctx, &row, client)
	}
	return nil

}

func Upsert(ctx context.Context, in *house.UpserthouseRequest, client *http.Client) error {
	body, err := json.Marshal(in)
	if err != nil {
		return err
	}

	const URL = "http://localhost:8000/house"

	r, err := http.NewRequest(http.MethodPut, URL, bytes.NewReader(body))
	if err != nil {
		return err
	}

	resp, err := client.Do(r)
	if err != nil {
		return err
	}

	if resp.StatusCode != http.StatusNoContent {
		return errors.New("")
	}
	return nil
}
