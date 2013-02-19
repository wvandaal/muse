class SessionsController < ApplicationController
  def new
  	redirect_to '/auth/facebook'
  end

  def create
  	user = User.from_omniauth(env["omniauth.auth"])
  	session[:user_id] = user.id
  	redirect_to user
  end

  def destroy
  	session[:user_id] = nil
  	redirect_to root_url
  end

  def current_user=(user)
    @current_user = user
  end

end
