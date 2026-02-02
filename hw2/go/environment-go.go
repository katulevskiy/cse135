package main

import (
	"fmt"
	"os"
	"strings"
)

func main() {
	fmt.Print("Content-Type: text/html\n\n")
	fmt.Print("<h1>Environment Variables (Go)</h1>")
	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		fmt.Printf("<b>%s</b>: %s<br>", pair[0], pair[1])
	}
}
