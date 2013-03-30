class BlogsController < ApplicationController
  def index
  	@blogs = Blog.all.each_slice(3).to_a
  	@blog = Blog.new
  end

  def create
    @blog = Blog.new(params[:blog])
    if @blog.save
      redirect_to @blog
    else
      render 'index'
    end
  end

  def show
  	@blog = Blog.find(params[:id])
    @songs = Song.all
  end

  def follow
  	@blog = Blog.find(params[:id])
  	FollowWorker.perform_async(current_user.id, @blog.id)
  	redirect_to @blog
  end
end
