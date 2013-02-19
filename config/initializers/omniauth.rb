OmniAuth.config.logger = Rails.logger

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :facebook, "498519676864993", "981157814c524e617439d08f8ae0240a", display: "popup"
end