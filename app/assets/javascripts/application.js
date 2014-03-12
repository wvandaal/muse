// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//
//= require jquery
//= require jquery_ujs
//= require bootstrap
//= require_tree .
//= require_tree ../../../vendor/assets/javascripts/.

$(document).ready(function() {

  // Delegates posting for likes, favorites, and dislikes
  $('#feed').on('click', 'a.favorite, a.like, a.dislike', function(e) {
    e.preventDefault();
    var link  = e.currentTarget,
        url   = link.pathname;

    $.post(url, function () {
      ['selected', 'unselected'].forEach(function(c) {
        link.parentNode.classList.toggle(c);
      });
    });
    
    return false;
  })


  $('#new_blog').submit(function(e) {
    e.preventDefault();

    var formData = $(this).serialize();
    console.log(formData);

    $.ajax({
      type: 'POST',
      url: '/blogs',
      dataType: 'json',
      data: formData,
      success: function(data) {
        console.log(data);
        var $blogs = $('.blogs').filter(function(){return $(this).children().length < 3}),
            $link  = $('<a>').attr('href', 'blogs/' + data['id']), 
            $img   = $('<img>');

        $img.attr('src', data['favicon_url']).attr('width', 22).attr('height', 22);
        $blogs.append($('<li>').html($link.html($img).append(" " + data['name'])));

      },
      error: function(xhr) {
        var errorMsgs = $.parseJSON(xhr.responseText).errors,
            $errors   = $('#errors'),
            keys      = Object.keys(errorMsgs);

        keys.forEach(function(k) {
          $errors.append($('<li>').html(errorMsgs[k][0]));
        });

        window.setTimeout(function() {
          $errors.children().fadeOut(500, function(){$errors.empty()});
        }, 7500);
      }
    });
  });
});
