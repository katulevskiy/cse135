package main

import (
	"fmt"
	"os"
	"time"
)

func main() {
	fmt.Print("Content-Type: text/html\n\n")
	fmt.Print("<html><body><h1>Hello from Go!</h1>")
	fmt.Printf("<p>Team: Daniil Katulevskiy</p>")
	fmt.Printf("<p>Date: %s</p>", time.Now().String())
	fmt.Printf("<p>IP: %s</p>", os.Getenv("REMOTE_ADDR"))
	fmt.Print("</body></html>")
}
