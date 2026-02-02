#!/usr/bin/ruby

require 'cgi'
require 'securerandom'

cgi = CGI.new
session_dir = "/var/www/katulevskiy.com/public_html/hw2/sessions"

session_id = cgi.cookies['ruby_sess'][0]
if session_id.nil? || session_id.empty?
  session_id = SecureRandom.hex(16)
  cookie = CGI::Cookie.new('name' => 'ruby_sess', 'value' => session_id)
  print "Set-Cookie: #{cookie}\n"
end

print "Content-type: text/html\n\n"

session_file = File.join(session_dir, session_id)
current_name = ""

if ENV['REQUEST_METHOD'] == 'POST'
  name_input = cgi['username']
  if name_input == 'CLEAR'
    File.delete(session_file) if File.exist?(session_file)
    current_name = ""
  else
    File.write(session_file, name_input)
    current_name = name_input
  end
elsif File.exist?(session_file)
  current_name = File.read(session_file)
end

puts "<h1>Ruby State Demo</h1>"
puts "<p>Current Session ID: #{session_id}</p>"
puts "<p>Saved Name: <strong>#{current_name}</strong></p>"
puts "<form method='POST'>"
puts "  Enter Name: <input type='text' name='username'>"
puts "  <input type='submit' value='Save'>"
puts "</form>"
puts "<form method='POST'>"
puts "  <input type='hidden' name='username' value='CLEAR'>"
puts "  <input type='submit' value='Clear Session'>"
puts "</form>"
