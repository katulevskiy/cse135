package main

import (
	"fmt"
	"io"
	"os"
)

func main() {
	fmt.Print("Content-Type: text/html\n\n")
	fmt.Print("<h1>Go Echo</h1>")
	fmt.Printf("<p>Method: %s</p>", os.Getenv("REQUEST_METHOD"))

	body, _ := io.ReadAll(os.Stdin)
	fmt.Printf("<p>Body Payload: %s</p>", string(body))

	fmt.Printf("<p>Query String: %s</p>", os.Getenv("QUERY_STRING"))
}
