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
		"message": "Hello from Go",
		"date":    time.Now().String(),
		"ip":      os.Getenv("REMOTE_ADDR"),
	}
	json.NewEncoder(os.Stdout).Encode(data)
}
