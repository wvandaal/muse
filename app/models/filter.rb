class Filter < ActiveRecord::Base
  attr_accessible :artist, :dislikes_max, :dislikes_min, :favorites_max, :favorites_min, :genre, :inclusive, :likes_max, :likes_min, :name

  def songs
  	@songs ||= find_songs
  end

  private

  def find_songs
  	songs = Song.order("last_posting")
  	songs = songs.where("genre like ?", "%#{genre}%") if genre.present?
  	songs = songs.where("artist like ?", "%#{artist}%") if artist.present?
   	songs = songs.where("like_count > ?", likes_min) if likes_min.present?
  	songs = songs.where("like_count < ?", likes_max) if likes_max.present?
  	songs = songs.where("dislike_count >= ?", dislikes_min) if dislikes_min.present?
  	songs = songs.where("dislike_count <= ?", dislikes_max) if dislikes_max.present?
   	songs = songs.where("times_favorited >= ?", favorites_min) if favorites_min.present?
  	songs = songs.where("times_favorited <= ?", favorites_max) if favorites_max.present?
  	songs
  end
end
