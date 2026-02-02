use std::env;
use std::process::Command;

fn main() {
    println!("Content-Type: text/html\n\n");
    println!("<html><body>");
    println!("<h1>Hello from Rust!</h1>");
    println!("<ul>");
    println!("<li><strong>Team:</strong> Daniil Katulevskiy</li>");
    println!("<li><strong>Language:</strong> Rust (Compiled)</li>");
    
    let output = Command::new("date").output().expect("failed to execute date");
    let date_str = String::from_utf8_lossy(&output.stdout);
    println!("<li><strong>Date:</strong> {}</li>", date_str.trim());

    let ip = env::var("REMOTE_ADDR").unwrap_or("Unknown".to_string());
    println!("<li><strong>IP Address:</strong> {}</li>", ip);
    
    println!("</ul>");
    println!("</body></html>");
}
