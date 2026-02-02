package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Print("Content-Type: text/html\n\n")

	fmt.Print("<html><body>")
	fmt.Print("<h1>Hello from Go!</h1>")
	fmt.Printf("<p>Date: %s</p>", time.Now().Format(time.RFC1123))
	fmt.Print("</body></html>")
}
