use std::env;
fn main() {
    println!("Content-Type: text/html\n\n");
    println!("<h1>Environment Variables (Rust)</h1>");
    for (key, value) in env::vars() {
        println!("<b>{}</b>: {}<br>", key, value);
    }
}
