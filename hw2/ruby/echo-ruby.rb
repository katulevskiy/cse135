#!/usr/bin/ruby

require 'cgi'

cgi = CGI.new
print "Content-type: text/html\n\n"
puts "<h1>Ruby Echo</h1>"
puts "<p><strong>Method:</strong> #{ENV['REQUEST_METHOD']}</p>"
puts "<p><strong>Protocol:</strong> #{ENV['SERVER_PROTOCOL']}</p>"
puts "<p><strong>Body/Params:</strong></p>"

cgi.params.each do |key, value|
  puts "#{key} = #{value.join(', ')}<br>"
end
