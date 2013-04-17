class FiltersController < ApplicationController
  def index
    @user = current_user
    @filters = current_user.filters
  end

  def new
    @filter = Filter.new
  end

  def create
    @filter = current_user.filters.build(params[:filters])
    if @filter.save
      flash[:success] = "Nice! You've got yourself a new filter."
      redirect_to filters_path
    else
      render 'new'
    end
  end

  def edit
    @filter = Filter.find(params[:id])
  end

  def update
    @filter = Filter.find(params[:id])
    if @filter.update_attributes(params[:filter])
      flash[:success] = "Filter updated"
      redirect_to filters_path
    else
      render 'edit'
    end
  end

  def destroy
    @filter = Filter.find(params[:id])
    @filter.destroy
    redirect_to filters_path
  end
end
