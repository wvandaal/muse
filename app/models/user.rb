class User < ActiveRecord::Base

  has_many :followings, foreign_key: "user_id", dependent: :destroy
  has_many :blogs, through: :followings

  recommends :blogs

  def self.from_omniauth(auth)  
  	where(auth.slice(:uid)).first_or_create.tap do |user|
  		user.uid = auth.uid
  		user.name = auth.info.name
  		user.oauth_token = auth.credentials.token
  		user.oauth_expires_at = Time.at(auth.credentials.expires_at)
  		user.img_url = auth.info.image
  		user.save!
  	end
  end

end
