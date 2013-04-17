jQuery ->
  if $('.pagination').hide().length
    $('#append_and_paginate').prepend('<a class="btn btn-large disabled" id="append_more_results" href="javascript:void(0);"><i class="icon-refresh icon-spin icon-2x" id="loading"></i><span id="btnlabel">Grab More Tunes</span></a>');
    $('#append_more_results').click ->
      url = $('.pagination .next_page').attr('href')
      if url
        $('#loading').css("display", "block")
        $('#btnlabel').css("display", "none")
        $.getScript(url)