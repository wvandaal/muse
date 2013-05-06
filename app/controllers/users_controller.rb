class UsersController < ApplicationController
  require 'will_paginate/array' 

  before_filter :authenticate_user!
  before_filter :correct_user?

  def show
  	@user = User.find(params[:id])
    @songs = @user.filtered_songs.paginate(:page => params[:page], :per_page => 20)
  	ids = @user.liked_blogs.pluck(:id)
  	@posts = Post.where(blog_id: ids).order("post_date DESC").paginate(:page => params[:page], :per_page => 10)
  end

  def favorites
    @user = User.find(params[:id])
    @songs = @user.bookmarked_songs.reverse.paginate(:page => params[:page], :per_page => 20)
  end

  def recommendations
    @user = User.find(params[:id])
    @songs = @user.recommended_songs.order("created_at DESC").paginate(:page => params[:page], :per_page => 20)
  end

  def toggle_filter
    @user = User.find(params[:id])
    if @user.filters_enabled
      @user.update_attribute(:filters_enabled, false)
    else
      @user.update_attribute(:filters_enabled, true)
    end
    redirect_to filters_path
  end
end
