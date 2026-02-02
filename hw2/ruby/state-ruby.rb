#!/usr/bin/ruby
require 'cgi'
require 'securerandom'
require 'fileutils'

cgi = CGI.new
session_dir = "/var/www/katulevskiy.com/public_html/hw2/sessions"
cookie_name = "ruby_sess_id"

session_id = cgi.cookies[cookie_name][0]
new_session = false

if session_id.nil? || session_id.empty?
  session_id = SecureRandom.hex(16)
  new_session = true
end

cookie = CGI::Cookie.new('name' => cookie_name, 'value' => session_id, 'path' => '/')

print cgi.header('type' => 'text/html', 'cookie' => [cookie])

begin
  session_file = File.join(session_dir, session_id)
  current_name = ""

  if ENV['REQUEST_METHOD'] == 'POST'
    name_input = cgi['username']
    if name_input == 'CLEAR'
      File.delete(session_file) if File.exist?(session_file)
      current_name = "DATA CLEARED"
    else
      File.open(session_file, 'w') { |file| file.write(name_input) }
      current_name = name_input
    end
  else
    if File.exist?(session_file)
      current_name = File.read(session_file)
    else
      current_name = "No saved data yet."
    end
  end

  puts "<html><body>"
  puts "<h1>Ruby State Demo</h1>"
  puts "<p><strong>Session ID:</strong> #{session_id}</p>"
  puts "<p><strong>Current Saved State:</strong> #{current_name}</p>"
  
  puts "<hr>"
  puts "<h3>Set New State</h3>"
  puts "<form method='POST'>"
  puts "  <label>Enter Name: <input type='text' name='username'></label>"
  puts "  <input type='submit' value='Save State'>"
  puts "</form>"

  puts "<form method='POST'>"
  puts "  <input type='hidden' name='username' value='CLEAR'>"
  puts "  <input type='submit' value='Clear Session Data'>"
  puts "</form>"
  
  puts "<p><a href='state-ruby.rb'>Reload Page</a> (Open in new tab to verify persistence)</p>"
  puts "</body></html>"

rescue => e
  puts "<h1>Error</h1>"
  puts "<p>#{e.message}</p>"
  puts "<p>#{e.backtrace.join('<br>')}</p>"
end
