class SongsController < ApplicationController
  def like
  	session[:return_to] = request.referer
  	@song = Song.find(params[:id])
  	LikeWorker.perform_async(current_user.id, @song.id)
  	redirect_to session.delete(:return_to)
  end

  def dislike
  	session[:return_to] = request.referer
  	@song = Song.find(params[:id])
  	DislikeWorker.perform_async(current_user.id, @song.id)
  	redirect_to session.delete(:return_to)
  end

  def favorite
  	session[:return_to] = request.referer
  	@song = Song.find(params[:id])
    @song.times_favorited += current_user.bookmarks?(@song) ? -1 : 1
    @song.save
  	FavoriteWorker.perform_async(current_user.id, @song.id)
  	redirect_to session.delete(:return_to)
  end
end
