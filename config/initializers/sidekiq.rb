require 'sidekiq'

Sidekiq.configure_client do |config|
  config.redis = { :size => 1, url: "redis://redistogo:cdad24f17dfea1c0fe8b4d7b9a95b1cf@albacore.redistogo.com:9562/" }
end

Sidekiq.configure_server do |config|
  config.redis = { :size => 2, url: "redis://redistogo:cdad24f17dfea1c0fe8b4d7b9a95b1cf@albacore.redistogo.com:9562/"}
end