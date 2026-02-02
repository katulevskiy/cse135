use std::env;
use std::process::Command;

fn main() {
    println!("Content-Type: application/json\n\n");
    
    let ip = env::var("REMOTE_ADDR").unwrap_or("Unknown".to_string());
    
    let output = Command::new("date").output().expect("failed to execute date");
    let date_str = String::from_utf8_lossy(&output.stdout).trim().to_string();

    println!("{{");
    println!("  \"greeting\": \"Hello from Rust!\",");
    println!("  \"team\": \"Daniil Katulevskiy\",");
    println!("  \"language\": \"Rust\",");
    println!("  \"date\": \"{}\",", date_str);
    println!("  \"ip\": \"{}\"", ip);
    println!("}}");
}
