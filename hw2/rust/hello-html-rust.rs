fn main() {
    println!("Content-Type: text/html\n\n");
    println!("<html><body><h1>Hello from Rust</h1>");
    println!("<p>Team: Daniil Katulevskiy</p>");
    println!("<p>Timestamp: {:?}</p>", std::time::SystemTime::now());
    println!("</body></html>");
}
