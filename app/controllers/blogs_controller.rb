class BlogsController < ApplicationController
  respond_to :html, :json

  def index
  	@blogs = Blog.order("name").each_slice(3).to_a
  	@blog = Blog.new
  end

  def create
    @blog = Blog.new(params[:blog])
    @blog.save
    respond_with @blog
  end

  def show
  	@blog = Blog.find(params[:id])
    ids = @blog.posts.pluck(:id).uniq
    @posts = Post.where(id: ids).order("post_date DESC").paginate(:page => params[:page], :per_page => 20)
    if @posts.blank?
      @blog.update
    end
  end

  def follow
  	@blog = Blog.find(params[:id])
  	FollowWorker.perform_async(current_user.id, @blog.id)
  	redirect_to @blog
  end
end
