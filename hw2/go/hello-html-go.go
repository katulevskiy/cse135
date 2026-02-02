package main

import (
	"fmt"
	"os"
	"time"
)

func main() {
	fmt.Print("Content-Type: text/html\n\n")
	fmt.Print("<html><body>")
	fmt.Print("<h1>Hello from Go!</h1>")
	fmt.Print("<ul>")
	fmt.Print("<li><strong>Team:</strong> Daniil Katulevskiy</li>")
	fmt.Print("<li><strong>Language:</strong> Go (Compiled)</li>")
	fmt.Printf("<li><strong>Date:</strong> %s</li>", time.Now().Format(time.RFC1123))
	fmt.Printf("<li><strong>IP Address:</strong> %s</li>", os.Getenv("REMOTE_ADDR"))
	fmt.Print("</ul>")
	fmt.Print("</body></html>")
}
