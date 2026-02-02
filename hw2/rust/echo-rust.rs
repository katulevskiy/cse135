use std::io::{self, Read};
use std::env;

fn main() {
    println!("Content-Type: text/html\n\n");
    println!("<h1>Rust Echo</h1>");

    match env::var("REQUEST_METHOD") {
        Ok(val) => println!("<p>Method: {}</p>", val),
        Err(_) => println!("<p>Method: Unknown</p>"),
    }

    let mut buffer = String::new();
    io::stdin().read_to_string(&mut buffer).unwrap();
    println!("<p>Body: {}</p>", buffer);

    if let Ok(qs) = env::var("QUERY_STRING") {
        println!("<p>Query String: {}</p>", qs);
    }
}
