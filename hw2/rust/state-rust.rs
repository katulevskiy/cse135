use std::env;
use std::fs;
use std::io::{self, Read};
use std::path::Path;
use std::process::Command;

fn main() {
    let session_dir = "/var/www/katulevskiy.com/public_html/hw2/sessions/";
    let cookie_name = "rust_sess_id";
    
    let cookie_var = env::var("HTTP_COOKIE").unwrap_or_default();
    let mut sess_id = String::new();

    for pair in cookie_var.split(';') {
        let clean_pair = pair.trim();
        if clean_pair.starts_with(&format!("{}=", cookie_name)) {
            sess_id = clean_pair.replace(&format!("{}=", cookie_name), "");
            break;
        }
    }

    if sess_id.is_empty() {
        let output = Command::new("date").arg("+%s%N").output().unwrap();
        sess_id = String::from_utf8_lossy(&output.stdout).trim().to_string();
        println!("Set-Cookie: {}={}; Path=/", cookie_name, sess_id);
    }

    println!("Content-Type: text/html\n\n");
    
    let file_path = format!("{}{}", session_dir, sess_id);
    let mut current_name = "No saved data yet.".to_string();

    let method = env::var("REQUEST_METHOD").unwrap_or_default();
    
    if method == "POST" {
        let mut buffer = String::new();
        io::stdin().read_to_string(&mut buffer).unwrap();
        
        let mut val = String::new();
        for pair in buffer.split('&') {
            if pair.starts_with("username=") {
                val = pair.replace("username=", "");
                break;
            }
        }
        
        val = val.replace("+", " ");

        if val == "CLEAR" {
            let _ = fs::remove_file(&file_path);
            current_name = "DATA CLEARED".to_string();
        } else {
            let _ = fs::write(&file_path, &val);
            current_name = val;
        }
    } else {
        if Path::new(&file_path).exists() {
             current_name = fs::read_to_string(&file_path).unwrap_or_default();
        }
    }

    println!("<html><body>");
    println!("<h1>Rust State Demo</h1>");
    println!("<p><strong>Session ID:</strong> {}</p>", sess_id);
    println!("<p><strong>Saved State:</strong> {}</p>", current_name);
    
    println!("<hr>");
    println!("<form method='POST'>");
    println!("  <label>Enter Name: <input name='username'></label>");
    println!("  <input type='submit' value='Save State'>");
    println!("</form>");
    
    println!("<form method='POST'>");
    println!("  <input type='hidden' name='username' value='CLEAR'>");
    println!("  <input type='submit' value='Clear Data'>");
    println!("</form>");
    println!("<p><a href='state-rust.cgi'>Reload Page</a></p>");
    println!("</body></html>");
}
