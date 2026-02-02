package main

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

func main() {
	fmt.Print("Content-Type: application/json\n\n")

	data := map[string]string{
		"greeting": "Hello from Go!",
		"team":     "Daniil Katulevskiy",
		"language": "Go",
		"date":     time.Now().Format(time.RFC1123),
		"ip":       os.Getenv("REMOTE_ADDR"),
	}

	json.NewEncoder(os.Stdout).Encode(data)
}
