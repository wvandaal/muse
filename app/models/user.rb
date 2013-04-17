class User < ActiveRecord::Base

  has_many :followings, foreign_key: "user_id", dependent: :destroy
  has_many :blogs, through: :followings
  has_many :filters, foreign_key: "user_id", dependent: :destroy

  recommends :blogs, :songs

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

  def unfiltered_songs
    songs = []
    ids = self.liked_blogs.pluck(:id)
    posts = Post.where(blog_id: ids).order("post_date DESC")
    posts.each do |post|
      post.songs.each do |song|
        songs.push(song)
      end
    end
    return songs
  end

  def filtered_songs
    @songs ||= apply_filters
  end

  private

  def apply_filters
    songs = unfiltered_songs
    self.filters.order(:inclusive).reverse.each do |filter|
      if filter.inclusive
        songs = (songs + filter.songs).uniq
      else
        songs = songs - filter.songs
      end
    end
    songs.sort_by(&:last_posting).reverse
  end

end
