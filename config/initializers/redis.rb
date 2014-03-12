if ENV["redis://rediscloud:RqIbIo1xhQCdXxgX@pub-redis-17727.us-east-1-2.2.ec2.garantiadata.com:17727"]
    uri = URI.parse(ENV["redis://rediscloud:RqIbIo1xhQCdXxgX@pub-redis-17727.us-east-1-2.2.ec2.garantiadata.com:17727"])
    $redis = Redis.new(:host => uri.host, :port => uri.port, :password => uri.password)
end