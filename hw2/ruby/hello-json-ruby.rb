#!/usr/bin/ruby
require 'json'
print "Content-type: application/json\n\n"
data = {
  message: "Hello from Ruby",
  team: "Daniil Katulevskiy",
  date: Time.now,
  ip: ENV['REMOTE_ADDR']
}
puts JSON.generate(data)
