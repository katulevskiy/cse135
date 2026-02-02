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
	cookieName := "go_sess_id"

	cookieHeader := os.Getenv("HTTP_COOKIE")
	sessID := ""

	cookies := strings.Split(cookieHeader, ";")
	for _, c := range cookies {
		c = strings.TrimSpace(c)
		if strings.HasPrefix(c, cookieName+"=") {
			sessID = strings.TrimPrefix(c, cookieName+"=")
			break
		}
	}

	if sessID == "" {
		rand.Seed(time.Now().UnixNano())
		sessID = fmt.Sprintf("%d_%d", time.Now().Unix(), rand.Intn(100000))
		fmt.Printf("Set-Cookie: %s=%s; Path=/\n", cookieName, sessID)
	}

	fmt.Print("Content-Type: text/html\n\n")

	method := os.Getenv("REQUEST_METHOD")
	sessFile := sessionDir + sessID
	currentName := "No saved data yet."

	if method == "POST" {
		input, _ := ioutil.ReadAll(os.Stdin)
		params, _ := url.ParseQuery(string(input))

		val := params.Get("username")
		if val == "CLEAR" {
			os.Remove(sessFile)
			currentName = "DATA CLEARED"
		} else {
			ioutil.WriteFile(sessFile, []byte(val), 0666) // 0666 permissions
			currentName = val
		}
	} else {
		content, err := ioutil.ReadFile(sessFile)
		if err == nil && len(content) > 0 {
			currentName = string(content)
		}
	}

	fmt.Print("<html><body>")
	fmt.Print("<h1>Go State Demo</h1>")
	fmt.Printf("<p><strong>Session ID:</strong> %s</p>", sessID)
	fmt.Printf("<p><strong>Saved State:</strong> %s</p>", currentName)

	fmt.Print("<hr>")
	fmt.Print("<form method='POST'>")
	fmt.Print("  <label>Enter Name: <input name='username'></label>")
	fmt.Print("  <input type='submit' value='Save State'>")
	fmt.Print("</form>")

	fmt.Print("<form method='POST'>")
	fmt.Print("  <input type='hidden' name='username' value='CLEAR'>")
	fmt.Print("  <input type='submit' value='Clear Data'>")
	fmt.Print("</form>")

	fmt.Print("<p><a href='state-go.cgi'>Reload Page</a></p>")
	fmt.Print("</body></html>")
}
