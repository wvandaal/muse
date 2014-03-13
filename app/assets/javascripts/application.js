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
    var link      = e.currentTarget,
        url       = link.pathname,
        $player   = $(link).parents('.player'),
        linkClass = link.classList[0],
        $metric   = $player.find("."+linkClass+"s"),    // a.like => span.likes
        i = parseInt($metric.html());


    $.post(url, function () {
      // Toggle selection status of rating
      ['selected', 'unselected'].forEach(function(c) {
        link.parentNode.classList.toggle(c);
      });




      // De/Increment rating
      if (link.parentNode.classList.contains("selected")) {
        $metric.html(++i);

        // If like/dislike is clicked and the opposite is selected, unselect it and
        // decrement the appropriate stat
        if (linkClass !== "favorite") {
          var oppClass = linkClass === "like" ? ".dislike" : ".like",
              j        = parseInt($player.find(oppClass+"s").first().html());

          $player.find(oppClass).first().parent().removeClass("selected");
          $player.find(oppClass).first().parent().addClass("unselected");

          $player.find(oppClass+"s").html(--j);
        } 
      } else {
        $metric.html(--i);
      }
    });
    
    return false;
  })

  // Submit new blog
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

  //Tooltips and popovers
  //Home popover
  $('#home1').clickover({title: "The Musefeed", placement: "right", content: "This is your home base, the newest posts from the blogs you follow will appear here. "});
  $('#home2').clickover({title: "The Musefeed", placement: "bottom", content: "This is your home base, the newest posts from the blogs you follow will appear here. "});

  //Favorites popover
  $('#favorites').clickover({title: "Your Favorites", placement: "bottom", content: "A place to save your favorite tracks so you can play them anytime, anywhere. "});

  //Recommendations popover
  $('#recommendations').clickover({title: "Recommendations", placement: "bottom", content: "Here you will find track suggestions based on what you like. The more you listen and rate tracks, the better your recommendations will be. "});

  //Filters popover
  $('#filters').clickover({title: "Your Filters", placement: "bottom", content: "Click here to create, view, and toggle your content filters. Content filters allow you to further control the flow of your musefeed so you get exactly what you want, no additives or artificial flavors."});

  //Blogroll popover  
  $('#static_blogroll').clickover({title: "The Blogroll", placement: "bottom", content: "All of our registered music blogs are listed here. If you can't find the blog you want, simply enter its url and we will add it to our database."});

  //Signout popover
  $('#signout').clickover({title: "Leaving So Soon?", placement: "left", content: "Sign out of your account at any time. We don't love to say goodbye, but like a faithful pet, we're always here when you need us."});

  //Sidebar tooltipes
  $('#name').tooltip({placement: "right", title: "Your profile name"});
  $('#photo').tooltip({placement: "right", title: "Your profile picture. This photo will change whenever you update your Facebook profile picture."});
  $('#following').tooltip({placement: "right", title: "Lists the blogs you are following"});
  $('#follow_blog').tooltip({placement: "right", title: "Link to individual blog's feed"});
  $('#static_addBlogs').tooltip({placement: "right", title: "Follow more blogs by checking out the Blogroll. If your favorite blog isn't listed, you can simply add it."});

  //Player tooltips
  $('#play').tooltip({placement: "right", title: "Track album art. Click to play the track."});
  $('#static_genre').tooltip({placement: "bottom", title: "Track Genre"});
  $('#static_title').tooltip({placement: "bottom", title: "Track Title"});
  $('#static_artist').tooltip({placement: "left", title: "Track Artist"})
  $('#static_excerpt').tooltip({placement: "top", title: "The post excerpt. Click here to view the entire post."});
  $('#static_badge').tooltip({placement: "bottom", title: "The name of the blog where the song was posted. Click here to visit their feed."});
  $('#static_like').tooltip({placement: "left", title: "Like button. The more tracks you like, the better your recommendations will be."});
  $('#static_dislike').tooltip({placement: "left", title: "Dislike button. Disliking tracks will keep similar ones out of your recommedations feed."})
  $('#static_favorite').tooltip({placement: "left", title: "Add to Favorites. Note that adding to favorites does not influence your recommendations, you must like the track as well in order to update your feed."})
  $('#static_stats').tooltip({placement: "top", title: "Track popularity statistics. Since tracks may be posted my multiple blogs, these numbers represent the global values for each song."})

});
