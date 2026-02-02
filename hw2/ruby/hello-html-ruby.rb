#!/usr/bin/ruby
print "Content-type: text/html\n\n"
puts "<html><body>"
puts "<h1>Hello from Ruby!</h1>"
puts "<p>Team: Daniil Katulevskiy</p>"
puts "<p>Date: #{Time.now}</p>"
puts "<p>Your IP: #{ENV['REMOTE_ADDR']}</p>"
puts "</body></html>"
