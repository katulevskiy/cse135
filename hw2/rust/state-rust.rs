use std::env;
use std::fs;
use std::io::{self, Read};
use std::path::Path;

fn main() {
    let session_dir = "/var/www/katulevskiy.com/public_html/hw2/sessions/";
    let cookie_var = env::var("HTTP_COOKIE").unwrap_or_default();
    
    let mut sess_id = String::new();
    
    if cookie_var.contains("rust_sess=") {
        let parts: Vec<&str> = cookie_var.split("rust_sess=").collect();
        if parts.len() > 1 {
            sess_id = parts[1].split(';').next().unwrap_or("").to_string();
        }
    }

    if sess_id.is_empty() {
        let timestamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
        sess_id = format!("{}", timestamp);
        println!("Set-Cookie: rust_sess={}", sess_id);
    }

    println!("Content-Type: text/html\n\n");
    
    let file_path = format!("{}{}", session_dir, sess_id);
    let mut current_name = String::new();

    let method = env::var("REQUEST_METHOD").unwrap_or_default();
    if method == "POST" {
        let mut buffer = String::new();
        io::stdin().read_to_string(&mut buffer).unwrap();
        let val = if buffer.contains("username=") {
             buffer.split("username=").nth(1).unwrap().split('&').next().unwrap()
        } else { "" };
        
        let clean_val = val.replace("+", " ");

        if clean_val == "CLEAR" {
            let _ = fs::remove_file(&file_path);
        } else {
            let _ = fs::write(&file_path, clean_val.clone());
            current_name = clean_val;
        }
    } else {
        if Path::new(&file_path).exists() {
             current_name = fs::read_to_string(&file_path).unwrap_or_default();
        }
    }

    println!("<h1>Rust State Demo</h1>");
    println!("<p>Session: {}</p>", sess_id);
    println!("<p>Saved: {}</p>", current_name);
    println!("<form method='POST'><input name='username'><input type='submit' value='Save'></form>");
    println!("<form method='POST'><input type='hidden' name='username' value='CLEAR'><input type='submit' value='Clear'></form>");
}
