cd go
for f in *.go; do
  echo "Compiling $f..."
  go build -o "${f%.go}.cgi" "$f"
done
chmod 755 *.cgi
cd ..

cd rust
for f in *.rs; do
  echo "Compiling $f..."
  rustc "$f" -o "${f%.rs}.cgi"
done
chmod 755 *.cgi
cd ..

cd ruby
chmod 755 *.rb
cd ..
