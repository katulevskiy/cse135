package main

import (
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/url"
	"os"
	"strings"
	"time"
)

func main() {
	sessionDir := "/var/www/katulevskiy.com/public_html/hw2/sessions/"
	cookieHeader := os.Getenv("HTTP_COOKIE")
	sessID := ""

	if strings.Contains(cookieHeader, "go_sess=") {
		parts := strings.Split(cookieHeader, "go_sess=")
		if len(parts) > 1 {
			sessID = strings.Split(parts[1], ";")[0]
		}
	}

	if sessID == "" {
		rand.Seed(time.Now().UnixNano())
		sessID = fmt.Sprintf("%d", rand.Int())
		fmt.Printf("Set-Cookie: go_sess=%s\n", sessID)
	}

	fmt.Print("Content-Type: text/html\n\n")

	method := os.Getenv("REQUEST_METHOD")
	sessFile := sessionDir + sessID
	currentName := ""

	if method == "POST" {
		input, _ := ioutil.ReadAll(os.Stdin)
		params, _ := url.ParseQuery(string(input))
		val := params.Get("username")
		if val == "CLEAR" {
			os.Remove(sessFile)
		} else {
			ioutil.WriteFile(sessFile, []byte(val), 0644)
			currentName = val
		}
	} else {
		content, err := ioutil.ReadFile(sessFile)
		if err == nil {
			currentName = string(content)
		}
	}

	fmt.Printf("<h1>Go State Demo</h1>")
	fmt.Printf("<p>Saved Name: %s</p>", currentName)
	fmt.Print("<form method='POST'><input name='username'><input type='submit' value='Save'></form>")
	fmt.Print("<form method='POST'><input type='hidden' name='username' value='CLEAR'><input type='submit' value='Clear'></form>")
}
