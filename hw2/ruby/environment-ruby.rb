#!/usr/bin/ruby
print "Content-type: text/html\n\n"
puts "<h1>Environment Variables (Ruby)</h1>"
ENV.each do |key, value|
  puts "#{key}: #{value}<br>"
end
