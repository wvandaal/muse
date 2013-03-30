/*
* Fullwidth Audio Player V1.4.21
* Author: Rafael Dery
* Copyright 2011
*
* Only for the sale at the envato marketplaces
*
*/

;(function($) {
	$.fullwidthAudioPlayer = {version: '1.4.2', author: 'Rafael Dery'};
	
	jQuery.fn.fullwidthAudioPlayer = function(arg) {
		var options = $.extend({},$.fn.fullwidthAudioPlayer.defaults,arg);
		var $elem, $wrapper, $main, $uiWrapper, $metaWrapper, $playlistWrapper = null, scroller,
		    player, currentTime, totalHeight = 0, 
			loadingIndex = -1, timeBarWidth = 180, volumeBarWidth = 50, currentIndex = -1, currentVolume = 100, 
			paused, playlistCreated, scIsReady = false, scIsPlaying = false, playlistIsOpened = false, playAddedTrack = false, popupMode = false, isPopupWin = false,
			soundcloudKey = 'd2be7a47322c293cdaffc039a26e05d1';			
		
		var tracks = new Array();
		
		//*********************************************
		//************** LOADING CORE *****************
		//*********************************************
			
		function _init(elem) {
		
			$elem = $(elem);
			$elem.hide();
						
			//check if script is executed in the popup window
			isPopupWin = elem.id == 'fap-popup';			
			
			if(_detectMobileBrowsers()) {
				if(options.hideOnMobile) { return false; }		
				//add player always on the top when its a mobile browser, fixed footer is not possible
				options.wrapperPosition = 'top';
				//volume and playlist will be also disabled on mobile devices
				options.autoPlay = options.volume = options.playlist = false;
			}
			
			//check if a popup window exists
			playlistCreated = Boolean(window.fapPopupWin);
			if(!options.autoPopup) { playlistCreated = true; }
			paused = !options.autoPlay;
			
			_documentTrackHandler();
			
			totalHeight = options.playlist ? options.height+options.playlistHeight+options.offset : options.height;
			
			if(options.wrapperPosition == "popup" && !isPopupWin) {
				
				popupMode = true;
				if(!options.playlist) { totalHeight = options.height; }
				if(options.autoPopup && !window.fapPopupWin) {
					_addTrackToPopup($elem.html(), options.autoPlay);
				}
				
				return false;
			}
			
			var fapDom = '<div id="fap-wrapper" class="'+(options.wrapperPosition == 'top' ? 'fap-wrapper-top' : 'fap-wrapper-bottom')+'" style="'+options.wrapperPosition+': 0; height: '+totalHeight+'px; background: '+options.wrapperColor+'; border-color: '+options.strokeColor+';"><div id="fap-main" style="color:'+options.mainColor+';"><div id="fap-wrapper-switcher" style="background: '+options.wrapperColor+'; border-color: '+options.strokeColor+'"></div><p id="fap-init-text">Creating Playlist...</p></div></div>';
						
			$('body').append(fapDom);
			
			$wrapper = $('body').children('#fap-wrapper');
			$main = $wrapper.children('#fap-main');
			
			if(isPopupWin) { 
				$wrapper.addClass('fap-popup-skin');
			}
			
			//change wrapper css for mobile
			if(_detectMobileBrowsers()) {
				$wrapper.css({position: 'absolute'})
			}			
			
			//position main wrapper
			if(isPopupWin) {
				$main.css({'marginLeft': 10, 'marginRight': 10});
			}
			else if(options.mainPosition == 'center') {
				$main.css({'marginLeft': 'auto', 'marginRight': 'auto'});
			}
			else if(options.mainPosition == 'right') {
				$main.css({'float': 'right', 'marginRight': 10});
			}
			else {
				$main.css({'marginLeft': 10});
			}
			
			options.wrapperPosition == 'top' ? $main.children('#fap-wrapper-switcher').addClass('fap-bordered-bottom').css({'bottom': -16, 'borderTop': 'none'}) : $main.children('#fap-wrapper-switcher').addClass('fap-bordered-top').css({'top': -16, 'borderBottom': 'none'});
			
			//set default wrapper position
			options.opened ? $.fullwidthAudioPlayer.setPlayerPosition('open', false) : $.fullwidthAudioPlayer.setPlayerPosition('close', false);
			
			//switcher handler
			$main.children('#fap-wrapper-switcher').click(function() {
				options.opened ? $.fullwidthAudioPlayer.setPlayerPosition('close', true) : $.fullwidthAudioPlayer.setPlayerPosition('open', true);
			});
									
			soundManager.onready(_onSoundManagerReady);
			
			soundManager.ontimeout(function(status){
			    alert('SM2 failed to start. Flash missing, blocked or security error? Status: '+ status.error.type);
			});
	
		};
		
		function _addTrackToPopup(html, playIt) {

			if( !window.fapPopupWin || window.fapPopupWin.closed ) {
			
				var windowWidth = 980;
				var centerWidth = (window.screen.width - windowWidth) / 2;
    			var centerHeight = (window.screen.height - totalHeight) / 2;
    			
				window.fapPopupWin = window.open(options.popupUrl, '', 'menubar=no,toolbar=no,location=no,width='+windowWidth+',height='+totalHeight+',left='+centerWidth+',top='+centerHeight+'');
				if(window.fapPopupWin == null) {
					alert("Pop-Up Music Player can not be opened. Your browser is blocking Pop-Ups. Please allow Pop-Ups for this site to use the Music Player.");
				}
				$(window.fapPopupWin).load(function() {
					$('.fap-enqueue-track').each(function(i, item) {
						var node = $(item);
						html += _createHtmlFromNode(node);
				    });
					options.autoPlay = playIt;
					window.fapPopupWin.initPlayer(options, html);
					playlistCreated = true;
				});
								
			} 
			else {
				var $node = $(html);
				$.fullwidthAudioPlayer.addTrack($node.attr('href'), $node.attr('title'), ($node.data('meta') ? $('body').find($node.data('meta')).html() : ''), $node.attr('rel'), $node.attr('target'), playIt);

			}
			
		}
		
		//get tracks
		function _onSoundManagerReady() {
					
			if(options.playlist) {
				var playlistDom = '<div class="clear"></div><div class="antiscroll-wrap"><div class="box"><div class="antiscroll-inner"><div id="fap-playlist-wrapper" class="box-inner"><ul id="fap-playlist"></ul></div><div class="clear"></div></div></div>';	
				$playlistWrapper = $(playlistDom);
			}
		    				
			if(options.xmlPath) {
				//get playlists from xml file
				$.ajax({ type: "GET", url: options.xmlPath, dataType: "xml", cache: false, success: function(xml) {
					
					var playlists = $(xml).find('playlists'),
					    playlistId = options.xmlPlaylist ? playlistId = options.xmlPlaylist : playlistId = playlists.children('playlist:first').attr('id');
					
					_getTracksFromNodes(playlists.children('playlist[id="'+playlistId+'"]').children('track'));
					
					//check if custom xml playlists are set in the HTML document
					$('.fap-xml-playlist').each(function(i, playlist) {
						var $playlist = $(playlist);
						$playlist.append('<h3>'+playlist.title+'</h3><ul class="fap-my-playlist"></ul>');
						//get the start playlist
						playlists.children('playlist[id="'+playlist.id+'"]').children('track').each(function(j, track) {
							var $track = $(track);
							var targetString = $track.attr('target') ? 'target="'+$track.attr('target')+'"' : '';
							var relString = $track.attr('rel') ? 'rel="'+$track.attr('rel')+'"' : '';
							var metaString = $track.find('meta') ? 'data-meta="#'+playlist.id+'-'+j+'"' : '';
							$playlist.children('ul').append('<li><a href="'+$track.attr('href')+'" title="'+$track.attr('title')+'" '+targetString+' '+relString+' '+metaString+'>'+$track.attr('title')+'</a></li>');
							$playlist.append('<span id="'+playlist.id+'-'+j+'">'+$track.find('meta').text()+'</span>');
						});
					});
					
				},
				error: function() {
					alert("XML file could not be loaded. Please check the XML path!");	
				}
			  });
			}
			else {
				_getTracksFromNodes($elem.children('a'));
			}
		};
		
		function _getTracksFromNodes(nodes) {
			
			$elem.bind('fap-tracks-stored', function() {
				++loadingIndex;
				if(loadingIndex < nodes.length) {
					var node = nodes.eq(loadingIndex);
					$.fullwidthAudioPlayer.addTrack(node.attr('href'), node.attr('title'), options.xmlPath ? node.children('meta').text() : $elem.find(node.data('meta')).html(), node.attr('rel'), node.attr('target'));
				}
				else {
					$elem.unbind('fap-tracks-stored');
					if(options.randomize) { _shufflePlaylist(); }
					_buildPlayer();
				}
				
			}).trigger('fap-tracks-stored');
			
		};
		

		
		//*********************************************
		//************** DOM INTERFACE ****************
		//*********************************************
			
		function _buildPlayer() {
			
			//remove init text
			$main.children('p').remove();
			
			//create meta wrapper
			$main.append('<div id="fap-meta-wrapper" class="clearfix"><img src="" id="fap-current-cover" style="width: '+options.coverSize[0]+'px; height:'+options.coverSize[1]+'px; border: 1px solid '+options.strokeColor+';" /><div id="fap-cover-replacement" style="width: '+options.coverSize[0]+'px; height:'+options.coverSize[1]+'px; border: 1px solid '+options.strokeColor+';"></div><p id="fap-current-title" style="color: '+options.mainColor+';"></p><p id="fap-current-meta" style="color: '+options.metaColor+';"></p></div>');
			
			$metaWrapper = $main.children('#fap-meta-wrapper').css('height', options.height-10);			
			
			//add a cover replacement
			_createCoverReplacement(document.getElementById('fap-cover-replacement'), options.coverSize[0], options.coverSize[1]);
			
			//append social links if requested
			if(options.socials) {
				$metaWrapper.append('<p id="fap-social-links"><a href="" target="_blank" style="color: '+options.metaColor+';">'+options.soundcloudText+'</a><a href="" target="_blank" style="color: '+options.metaColor+';">'+options.downloadText+'</a><a href="" target="_blank" style="color: '+options.metaColor+';">'+options.facebookText+'</a><a href="" target="_blank" style="color: '+options.metaColor+';">'+options.twitterText+'</a></p>');
			}
			
			//create ui wrapper
			$uiWrapper = $main.append('<div id="fap-ui-wrapper"></div>').children('#fap-ui-wrapper').css('height', options.height);			
			
			//append UI Wrapper
			var $uiNav = $uiWrapper.append('<div id="fap-ui-nav"></div>').children('#fap-ui-nav');
			
			$uiNav.css('margin-top', options.height * 0.5 - $uiNav.height() * 0.5);
			
			//append previous button
			$uiNav.append('<a href="#" id="fap-previous" style="background-color: '+options.fillColor+';"></a>').children('#fap-previous').click(function() {
				$.fullwidthAudioPlayer.previous();
				return false;
			});
			
			//append play/pause button
			$uiNav.append('<a href="#" id="fap-play-pause" style="background-color: '+options.fillColor+';"></a>').children('#fap-play-pause').click(function() {
				$.fullwidthAudioPlayer.toggle();
				return false;
			});
			
			//append next button
			$uiNav.append('<a href="#" id="fap-next" style="background-color: '+options.fillColor+';"></a>').children('#fap-next').click(function() {
				$.fullwidthAudioPlayer.next();
				return false;
			});
			
			//append time bar
			var rightPositionTimeBar = $uiWrapper.children('div:first').length ? $uiWrapper.width()-$uiWrapper.children('div:first').position().left+20 : 0;
			$uiWrapper.append('<div id="fap-time-bar" class="clearfix" style="width: '+timeBarWidth+'px; border: 1px solid '+options.fillColor+'; margin-top: '+(options.height*0.5-3)+'px; color: '+options.metaColor+';"><div id="fap-loading-bar" style="background: '+options.fillColor+';"></div><div id="fap-progress-bar" style="background: '+options.mainColor+';"></div><span id="fap-current-time">00:00:00</span><span id="fap-total-time">00:00:00</span></div>');
			
			$uiWrapper.find('#fap-loading-bar, #fap-progress-bar').click(function(evt) {
				var progress = (evt.pageX - $(this).parent().offset().left) / timeBarWidth;
				if(scIsPlaying) {
					player.setPosition(progress);
				}
				else {
					player.setPosition(progress * player.duration);
				}
				_setSliderPosition(progress);
			});
			
			//append volume bar if requested - hidden for mobile browsers
			if(options.volume) {
				var rightPositionVolume = options.playlist || options.shuffle  ? 60 : 20;
				if(isPopupWin) { rightPositionVolume = options.shuffle ? 60 : 20; }
				$uiWrapper.append('<div id="fap-volume-bar" style="width: '+volumeBarWidth+'px; background: '+options.fillColor+'; border: 1px solid '+options.fillColor+'; margin-top: '+(options.height*0.5-3)+'px;"><div id="fap-volume-progress" style="background: '+options.mainColor+';"></div></div><div id="fap-volume-sign"></div>');
				
				$uiWrapper.children('#fap-volume-sign').css('margin-top', options.height * 0.5 - $uiWrapper.children('#fap-volume-sign').height() * 0.5);
				                				
				$uiWrapper.find('#fap-volume-bar').click(function(evt) {
					var value = (evt.pageX - $(this).offset().left) / volumeBarWidth;
					$.fullwidthAudioPlayer.volume(value);
				});	
			}
			
			//create visual playlist if requested - hidden for mobile browsers
			if(options.playlist) {
			
				options.wrapperPosition == 'bottom' ? $main.append($playlistWrapper) : $main.prepend($playlistWrapper);
				
				//init scroll bar
				var $antiScroll = $main.children('.antiscroll-wrap');
				$antiScroll.find('.box, .box .antiscroll-inner').height(options.playlistHeight);
				scroller = $antiScroll.antiscroll().data('antiscroll');
				$main.find('.antiscroll-scrollbar').css('backgroundColor', options.mainColor);
				
				//add offset to the playlist
				options.wrapperPosition == 'top' ? $antiScroll.css({'marginBottom': options.offset}) : $antiScroll.css({'marginTop': options.offset});
				
				//make playlist sortable
				if(options.sortable) {
					var oldIndex;
					$playlistWrapper.find('#fap-playlist').sortable().bind('sortstart', function(evt, ui) {
						oldIndex = $playlistWrapper.find('#fap-playlist').children('li').index(ui.item);
					});
					
					$playlistWrapper.find('#fap-playlist').sortable().bind('sortupdate', function(evt, ui) {
						var targetIndex = $playlistWrapper.find('#fap-playlist').children('li').index(ui.item);
						var item = tracks[oldIndex];
						var currentTitle = tracks[currentIndex].title;
						tracks.splice(oldIndex, 1);
						tracks.splice(targetIndex, 0, item);
						_updateTrackIndex(currentTitle);
					});
				}				
				
				if(!isPopupWin) {
					//playlist switcher
					$uiWrapper.append('<a href="#" id="fap-playlist-toggle" style="background-color:'+options.fillColor+'; margin-top: '+(options.height * 0.5 - 12)+'px;"></a>');
					$uiWrapper.children('#fap-playlist-toggle').click(function() {
						playlistIsOpened ? $.fullwidthAudioPlayer.setPlayerPosition('closePlaylist', true) : $.fullwidthAudioPlayer.setPlayerPosition('openPlaylist', true);
						return false;
					});
				
				}
				else {
					//open playlist when player is in the pop-up window
					$.fullwidthAudioPlayer.setPlayerPosition('openPlaylist', false);
				}
				
			}
			
			//append shuffle buttin if requested
			if(options.shuffle) {
			
				$uiWrapper.append('<a href="#" id="fap-playlist-shuffle" style="background-color:'+options.fillColor+'; margin-top: '+(options.height * 0.5 - 12)+'px;"></a>');
				
				$uiWrapper.children('#fap-playlist-shuffle').click(function() {
					_shufflePlaylist();
					return false;
				});
								
			}

			//hover for rounded buttons in the ui wrapper
			$uiWrapper.find('a').hover(
				function() {
					$(this).css('backgroundColor', options.fillColorHover);
				},
				function() {
					$(this).css('backgroundColor', options.fillColor);
				}
			);		
			
			
			
			//register keyboard events
			if(options.keyboard) {
				$(document).keyup(function(evt) {
					switch (evt.which) {
						case 32:
						$.fullwidthAudioPlayer.toggle();
						break;
						case 39:
						$.fullwidthAudioPlayer.next();
						break;
						case 37:
						$.fullwidthAudioPlayer.previous();
						break;
						case 38:
						$.fullwidthAudioPlayer.volume((currentVolume / 100)+.05);
						break;
						case 40:
						$.fullwidthAudioPlayer.volume((currentVolume / 100)-.05);
						break;
					}
				});	
			}
			
			//add margin for p elements in meta wrapper
			$metaWrapper.children('p').css('marginLeft', options.coverSize[0] + 10);
			      
			//fire on ready handler
			$elem.trigger('onFapReady');
			playlistCreated = true;
			
			$('.fap-enqueue-track').each(function(i, item) {
				var node = $(item);
		      	jQuery.fullwidthAudioPlayer.addTrack(node.attr('href'), node.attr('title'), $('body').find(node.data('meta')).html(), node.attr('rel'), node.attr('target'), false);
		      		
		    });

			//start playing track when addTrack method is called
			$elem.bind('fap-tracks-stored', function(evt, trackIndex) {
				if(playAddedTrack) { _selectTrack(trackIndex, playAddedTrack); }
			});
			   
			//select first track when playlist has tracks		
		    _selectTrack(0, options.autoPlay);
			options.autoPlay ? $elem.trigger('onFapPlay') : $elem.trigger('onFapPause');
		};
		
		function _documentTrackHandler() {
			
			if($elem.jquery >= "1.7"){
				$('body').on('click', '.fap-my-playlist li a, .fap-single-track', _addTrackFromDocument);
				$('body').on('click', '.fap-add-playlist', _addTrackFromDocument);
			}
			else {
				$('body').delegate('.fap-my-playlist li a, .fap-single-track', 'click', _addTrackFromDocument);
				$('body').delegate('.fap-add-playlist', 'click', _addTrackFromDocument);
			}
			
			function _addTrackFromDocument() {
				if(!playlistCreated) { return false; }
				var node = $(this),
					playIt = true;
				
				if(node.data('enqueue')) {
					playIt = node.data('enqueue') == 'yes' ? false : true;
				}

				if(popupMode) {
					//adding whole plalist to the player
					if(node.hasClass('fap-add-playlist')) {
						var playlistId = node.data('playlist'),
							tracks = jQuery('ul[data-playlist="'+playlistId+'"]').first().children('li').find('.fap-single-track'),
							html = _createHtmlFromNode($(tracks.get(0)));
						
						if(tracks.size() == 0) { return false; }
						
						//add first track to pop-up to open it	
						_addTrackToPopup(html, playIt);
						tracks.splice(0, 1);
						
						window.fapReady = window.fapPopupWin.addTrack != undefined;
						//start interval for adding the playlist into the pop-up player
						var interval = setInterval(function() {
							if(window.fapReady) {
								clearInterval(interval);
								tracks.each(function(i, item) {
									_addTrackToPopup(item, false);
							    });
							}
						}, 50);
					}
					//adding a single track to the player
					else {
						var html = _createHtmlFromNode(node);
						_addTrackToPopup(html, playIt);
					}
					
				}
				else {
					//adding whole plalist to the player
					if(node.hasClass('fap-add-playlist')) {
						var playlistId = node.data('playlist'),
							tracks = jQuery('ul[data-playlist="'+playlistId+'"]').first().children('li').find('.fap-single-track');

						if(tracks.size() == 0) { return false; }
						
						tracks.each(function(i, track) {
							var $track = $(track);
							$.fullwidthAudioPlayer.addTrack($track.attr('href'), $track.attr('title'), $('body').find($track.data('meta')).html(), $track.attr('rel'), $track.attr('target'), (i == 0 && playIt));
						});
					}
					//adding a single track to the player
					else {
						$.fullwidthAudioPlayer.addTrack(node.attr('href'), node.attr('title'), $('body').find(node.data('meta')).html(), node.attr('rel'), node.attr('target'), playIt);
					}
					
				}
				
				return false;
			};
			
			setTimeout(_enqueueTracks, 201);
			function _enqueueTracks() {
				if(popupMode && window.fapPopupWin && !window.fapPopupWin.closed) {
					$('.fap-enqueue-track').each(function(i, item) {
						_addTrackToPopup(item, false);
				    });
				}
			}
			
		};
		
		
		//*********************************************
		//************** API METHODS ******************
		//*********************************************
		
		//global method for playing the current track
		$.fullwidthAudioPlayer.play = function() {
			if(tracks.length > 0) {
				if(player.playState) {
					player.resume();	
				}
				else {
				    player.play();
				}
				
				$uiWrapper.find('#fap-play-pause').removeClass('fap-play').addClass('fap-pause');
				paused = false;
				$elem.trigger('onFapPlay');
			}
		};
		
		//global method for pausing the current track
		$.fullwidthAudioPlayer.pause = function() {
			if(tracks.length > 0) {
				player.pause();
				$uiWrapper.find('#fap-play-pause').removeClass('fap-pause').addClass('fap-play');
				paused = true;
				$elem.trigger('onFapPause');
			}
		};
		
		//global method for pausing/playing the current track
		$.fullwidthAudioPlayer.toggle = function() {
			if(paused) {
				$.fullwidthAudioPlayer.play();
			}
			else {
				$.fullwidthAudioPlayer.pause();
			}	
		};
		
		//global method for playing the previous track
		$.fullwidthAudioPlayer.previous = function() {
			if(tracks.length > 0) {
				_selectTrack(currentIndex-1, true);
			}
		};
		
		//global method for playing the next track
		$.fullwidthAudioPlayer.next = function() {
			if(tracks.length > 0) {
				_selectTrack(currentIndex+1, true);
			}
		};
		
		$.fullwidthAudioPlayer.volume = function(value) {
			if(tracks.length > 0) {
				if(value < 0 ) value = 0;
				if(value > 1 ) value = 1;
				currentVolume = value * 100;
				if(player) { player.setVolume(currentVolume); }
				$uiWrapper.find('#fap-volume-progress').width(value * volumeBarWidth);
			}
		};
		
		//global method for adding a track to the playlist
		$.fullwidthAudioPlayer.addTrack = function(trackUrl, title, meta, cover, linkUrl, playIt) {
			if(trackUrl == null || trackUrl == '') { return false; }
			
			if ( title === undefined ) {
			   title = '';
			}
			if ( meta === undefined ) {
			   meta = '';
			}
			if ( cover === undefined ) {
			   cover = '';
			}
			if ( linkUrl === undefined ) {
			   linkUrl = '';
			}
			if ( playIt === undefined ) {
			   playIt = false;
			}
			
			if(popupMode && window.fapPopupWin && !window.fapPopupWin.closed) {
				window.fapPopupWin.addTrack(trackUrl,title,meta,cover,linkUrl, playIt);
				window.fapPopupWin.focus();
				return false;
			}
			
			if(options.base64) {
				trackUrl = _decodebase64(trackUrl);
			}
			
			playAddedTrack = playIt;
												
			if(RegExp('http://soundcloud').test(trackUrl)) {
				//check if soundcloud API key is set
				if(!soundcloudKey) { 
				  alert("Sorry. You need to set a soundcloud API key first. Please read the documentation how to get and set an API key!");
				  return false;
				}
				_getScTracks(trackUrl);		
			}
			else {
				var li = _storeTrackDatas({stream_url: trackUrl, title: title, meta: meta, artwork_url: cover, permalink_url:linkUrl});
				$elem.trigger('onFapTracksAdded', [tracks]);
				$elem.trigger('fap-tracks-stored', [li]);
			}
			
			if(!options.opened && playIt && !isPopupWin) {
				$.fullwidthAudioPlayer.setPlayerPosition('open', true);	
			}
		};
		
		//removes all tracks from the playlist and stops playing - states: open, close, openPlaylist, closePlaylist
		$.fullwidthAudioPlayer.setPlayerPosition = function(state, animated) {
			if($wrapper.is(':animated')) { return false; }
			if(state == "open") {
				$main.children('#fap-wrapper-switcher').html('&times;');
				if(options.wrapperPosition == 'top') {
					$wrapper.animate({'top': -(totalHeight-options.height)}, animated ? 300 : 0);
				}
				else {
					$wrapper.animate({'bottom': -(totalHeight-options.height)}, animated ? 300 : 0);
				}
				options.opened = true;
			}
			else if(state == "close") {
				$main.children('#fap-wrapper-switcher').html('+');
				if(options.wrapperPosition == 'top') {
					$wrapper.animate({'top': -totalHeight-1}, animated ? 300 : 0);
				}
				else {
					$wrapper.animate({'bottom': -totalHeight-1}, animated ? 300 : 0);
				}
				options.opened = playlistIsOpened = false;
			}
			else if(state == "openPlaylist") {
				if(options.wrapperPosition == 'top') {
					$wrapper.animate({'top': 0}, 300);
				}
				else {
					$wrapper.animate({'bottom': 0}, 300);
				}
				playlistIsOpened = true;
			}
			else if(state == "closePlaylist") {
				if(options.wrapperPosition == 'top') {
					$wrapper.animate({'top': -(totalHeight-options.height)}, 300);
				}
				else {
					$wrapper.animate({'bottom': -(totalHeight-options.height)}, 300);
				}
				playlistIsOpened = false;
			}
		};
		
		//removes all tracks from the playlist and stops playing
		$.fullwidthAudioPlayer.clear = function() {
						
			//reset everything
			$metaWrapper.children('#fap-current-cover').hide();
			$metaWrapper.children('#fap-cover-replacement').show();
			$metaWrapper.children('#fap-current-title, #fap-current-meta').html('');
			$metaWrapper.children('#fap-social-links').children('a').attr('href', '').hide();
			$uiWrapper.find('#fap-progress-bar, #fap-loading-bar').width(0);
			$uiWrapper.find('#fap-current-time, #fap-total-time').text('00:00:00');
			$uiWrapper.find('#fap-play-pause').removeClass('fap-pause').addClass('fap-play');
			
			paused = true;
			currentIndex = -1;
			
			if($playlistWrapper) { 
			    $playlistWrapper.find('#fap-playlist').empty();
			}
			tracks = [];
			if(player) { player.destruct(); }
			if(scroller) { 
				scroller.refresh();
				$main.find('.antiscroll-scrollbar').css('backgroundColor', options.mainColor);
			}
			
			$elem.trigger('onFapClear');
	
		};
		
		//pop up player
		$.fullwidthAudioPlayer.popUp = function() {
						
			if(popupMode) {
				if(!window.fapPopupWin || window.fapPopupWin.closed) {
					_addTrackToPopup('', false);
				}
				else {
					window.fapPopupWin.focus();
				}
			}
			
		};
		
		
		//*********************************************
		//************** PRIVATE METHODS ******************
		//*********************************************
		
		function _createHtmlFromNode(node) {
			var html = '<a href="'+node.attr('href')+'" title="'+(node.attr('title') ? node.attr('title') : '')+'" target="'+(node.attr('target') ? node.attr('target') : '')+'" rel="'+(node.attr('rel') ? node.attr('rel') : '')+'" data-meta="'+(node.data('meta') ? node.data('meta') : '')+'"></a>';
			if(node.data('meta')) {
				var metaText = $('body').find(node.data('meta')).html() ? $('body').find(node.data('meta')).html() : '';
				html += '<span id="'+node.data('meta').substring(1)+'">'+metaText+'</span>';
			}
			return html;
		};
		
		//get track(s) from soundclodu link
		function _getScTracks(linkUrl) {
			
			//load soundcloud data from tracks
			$.getJSON(_scApiUrl(linkUrl, soundcloudKey), function(data) {
                // log('data loaded', link.url, data);
				var loadIndex = 0, temp = 0;
                if(data.tracks) {
					for(var i=0; i < data.tracks.length; ++i) {
						temp = _storeTrackDatas(data.tracks[i]);
						loadIndex = temp < loadIndex ? temp : loadIndex;
						if(i == 0) { loadIndex = temp; }
				}
                }else if(data.duration) {
					// a secret link fix, till the SC API returns permalink with secret on secret response
					data.permalink_url = linkUrl;
					loadIndex = _storeTrackDatas(data);
					// if track, add to player
                }else if(data.username) {
					// if user, get his tracks or favorites
					if(/favorites/.test(linkUrl)) {
						_getScTracks(data.uri + '/favorites');
					}else{
						_getScTracks(data.uri + '/tracks');
					}
				  return false;
                }else if($.isArray(data)) {
					for(var i=0; i < data.length; ++i) {
						temp = _storeTrackDatas(data[i]);
						loadIndex = temp < loadIndex ? temp : loadIndex;
						if(i == 0) { loadIndex = temp; }
					}
                }
				$elem.trigger('onFapTracksAdded', [tracks]);
				$elem.trigger('fap-tracks-stored', [loadIndex]);
				
            });
		};
		
		function _scApiUrl(url, apiKey) {
			var useSandBox = false;
		    var domain = useSandBox ? 'sandbox-soundcloud.com' : 'soundcloud.com'
		    return (/api\./.test(url) ? url + '?' : 'http://api.' + domain +'/resolve?url=' + url + '&') + 'format=json&consumer_key=' + apiKey +'&callback=?';
		};
		
		//store track datas from soundcloud
		function _storeTrackDatas(data) {
			
			//search if a track with a same title already exists
			var trackIndex = tracks.length;
			for(var i= 0; i < tracks.length; ++i) {
				if(data.title == tracks[i].title) {
					trackIndex = i;
					return trackIndex;
					break;
				}
			}
			tracks.push(data);
			_createPlaylistTrack(data.artwork_url, data.title);
			
			return trackIndex;
		};
		
		//select a track by index
		function _selectTrack(index, playIt) {
			
			if(tracks.length <= 0) {
				$.fullwidthAudioPlayer.clear();
				return false;
			}
						
			if(scIsPlaying && !scIsReady) { return false; }

			if(index == currentIndex) { return false; }
			else if(index < 0) { currentIndex = tracks.length - 1; }
			else if(index == tracks.length) { currentIndex = 0; }	
			else { currentIndex = index; }
			
			paused = !playIt;
			
			var isSoundcloud = RegExp('http://soundcloud').test(tracks[currentIndex].permalink_url);
			
			
			if(isSoundcloud && !scIsReady) {
				$('body').fapScPlayer({ apiKey: soundcloudKey, autoPlay: playIt });
				$(document).bind('fapScPlayer:onAudioReady', function(event){
					scIsReady = true;
					player.setVolume(currentVolume);
				});
			}
			if($.fapScPlayer.html5()) { scIsReady = true; }
										
			//reset
			$uiWrapper.find('#fap-progress-bar').width(0);
			$uiWrapper.find('#fap-total-time, #fap-current-time').text('00:00:00');
	        
			$metaWrapper.children('#fap-current-cover').attr('src', tracks[currentIndex].artwork_url);
			$metaWrapper.children('#fap-current-title').html(tracks[currentIndex].title);
			$metaWrapper.children('#fap-current-meta').html(isSoundcloud ? tracks[currentIndex].genre : tracks[currentIndex].meta);
			
			if(!tracks[currentIndex].artwork_url) {
				$metaWrapper.children('#fap-current-cover').hide();
				$metaWrapper.children('#fap-cover-replacement').show();
			}
			else {
				$metaWrapper.children('#fap-current-cover').show();
				$metaWrapper.children('#fap-cover-replacement').hide();
			}
			
			if(tracks[currentIndex].permalink_url) {
				$metaWrapper.children('#fap-social-links').children('a').show();
				var facebookLink = 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(tracks[currentIndex].permalink_url)+'&t='+encodeURIComponent(tracks[currentIndex].title)+'';
				var twitterLink = 'http://twitter.com/share?url='+encodeURIComponent(tracks[currentIndex].permalink_url)+'&text='+encodeURIComponent(tracks[currentIndex].title)+'';
				$metaWrapper.find('#fap-social-links a:eq(0)').attr('href', tracks[currentIndex].permalink_url);
				$metaWrapper.find('#fap-social-links a:eq(1)').attr('href', tracks[currentIndex].permalink_url+'/download');
				$metaWrapper.find('#fap-social-links a:eq(2)').attr('href', facebookLink);
				$metaWrapper.find('#fap-social-links a:eq(3)').attr('href', twitterLink);
			}
			else {
				$metaWrapper.children('#fap-social-links').children('a').hide();	
			}
			
			if($playlistWrapper) {
				$playlistWrapper.find('#fap-playlist li').css('background', 'none');
				$playlistWrapper.find('#fap-playlist li').eq(currentIndex).css('background', options.activeTrackColor);
			}
			
			if(playIt) {
				$uiWrapper.find('#fap-play-pause').removeClass('fap-play').addClass('fap-pause');	
			}
			else {
				$uiWrapper.find('#fap-play-pause').removeClass('fap-pause').addClass('fap-play');	
			}
			
			if(player) {
				player.destruct();
			}
			
			if(isSoundcloud) {
				if(!scIsPlaying) { $uiWrapper.find('#fap-loading-bar').width('100%'); }
				$metaWrapper.children('#fap-social-links').children('a:eq(0)').show();
				if(tracks[currentIndex].downloadable) { $metaWrapper.children('#fap-social-links').children('a:eq(1)').show(); }
				else { $metaWrapper.children('#fap-social-links').children('a:eq(1)').hide(); }
				scIsPlaying = true;
				player = $.fapScPlayer;
				player.setVolume(currentVolume);
				player.load(tracks[currentIndex], playIt);
				player.defaults.whileloading = function(percent) {
					if(percent < 0) percent = 0;
					if(percent > 100) percent = 100;
					$uiWrapper.find('#fap-loading-bar').width(percent + '%');
				};
				player.defaults.whileplaying = function(position, duration) {
					_setTimes(position, tracks[currentIndex].duration);
				};
				player.defaults.onfinish = _onFinish;
			}
			else {
				$metaWrapper.children('#fap-social-links').children('a:eq(0), a:eq(1)').hide();
				scIsPlaying = false;
				player = soundManager.createSound({
					id: 'fap_sound',
					url: tracks[currentIndex].stream_url,
					autoPlay: playIt,
					autoLoad: options.autoLoad,
					volume: currentVolume,
					whileloading: _onLoading,
					whileplaying: _onPlaying,
					onfinish: _onFinish,
					onload: _onLoad
				});
			}
			$elem.trigger('onFapTrackSelect', [ tracks[currentIndex] ]);
							
		};
		
		//soundmanager loading
		function _onLoading() {
			$uiWrapper.find('#fap-loading-bar').width(( this.bytesLoaded / this.bytesTotal) * timeBarWidth);
		};
		
		//soundmaanger playing
		function _onPlaying() {
			_setTimes(this.position, this.duration);
		};
		
		//soundmanager finish	
		function _onFinish() {
			if(options.playNextWhenFinished) {
				$.fullwidthAudioPlayer.next();
			}
			else {
				$.fullwidthAudioPlayer.pause();
				player.setPosition(0);
				_setSliderPosition(0);
			}
		};
		
		//soundmanager file load
		function _onLoad(state) {
			if(!state) {
				if(window.console && window.console.log) {
					console.log("MP3 file could not be loaded! Please check the URL: "+this.url);
				}
			}
		};		
		
		//create a new playlist item in the playlist
		function _createPlaylistTrack(cover, title) {

			if(!options.playlist) { return false; }
            var coverDom = cover ? '<img src="'+cover+'" style="border: 1px solid '+options.strokeColor+';" />' : '<div class="fap-cover-replace-small" style="background: '+options.wrapperColor+'; border: 1px solid '+options.strokeColor+';"></div>';
			$playlistWrapper.find('#fap-playlist').append('<li class="clearfix">'+coverDom+'<span>'+title+'</span><div class="fap-remove-track">&times;</div></li>');
			var listItem = $playlistWrapper.find('#fap-playlist li').last().css({'marginBottom': 5, 'height': 22});
			
			if(navigator.appVersion.indexOf("MSIE 7.")==-1) {
				if(!cover) { _createCoverReplacement(listItem.children('.fap-cover-replace-small').get(0), 20, 20); }
				
				//remove track cross
			}
						
			//Playlist Item Event Handlers
			if($elem.jquery >= "1.7"){
				listItem.on('click', 'span', _selectTrackFromPlaylist);
				listItem.on('click', '.fap-remove-track', _removeTrackFromPlaylist);
			}
			else {
				listItem.delegate('span', 'click', _selectTrackFromPlaylist);
				listItem.delegate('.fap-remove-track', 'click', _removeTrackFromPlaylist);
			}
			
			function _selectTrackFromPlaylist() {
				var index = $playlistWrapper.find('#fap-playlist li').index($(this).parent());
				_selectTrack(index, true);
			};
			
			function _removeTrackFromPlaylist() {
				var $this = $(this),
					index = $this.parent().parent().children('li').index($this.parent());
				
				tracks.splice(index, 1);
				$this.parent().remove();
				
				if(index == currentIndex) {
					currentIndex--;
					index = index == tracks.length ? 0 : index;
				    _selectTrack(index, paused ? false : true); 
				}
				else if(index < currentIndex) {
					currentIndex--;
				}
				
				if(scroller) { 
					scroller.refresh();
					$main.find('.antiscroll-scrollbar').css('backgroundColor', options.mainColor);
				}
			};
			
			if(scroller) { 
				scroller.refresh();
				$main.find('.antiscroll-scrollbar').css('backgroundColor', options.mainColor);
			}
		};
		
		//creates a cover replacement when track has no artwork image
		function _createCoverReplacement(container, width, height) {
		
			$(container).append('<span style="line-height: '+height+'px; color: '+options.metaColor+';">&hellip;</span>');

		};
		
		//set the time slider position
		function _setSliderPosition(playProgress) {
		    $uiWrapper.find('#fap-progress-bar').width(playProgress * timeBarWidth);
		};
		
		//update the current and total time
		function _setTimes(position, duration) {
			var time = _convertTime(position/1000);
			if(currentTime != time) {
				$uiWrapper.find('#fap-current-time').text(time);
				$uiWrapper.find('#fap-total-time').text(_convertTime(duration / 1000));
				_setSliderPosition(position / duration);
			}
			currentTime = time;
		};
	
		//converts seconds into a well formatted time
		function _convertTime(second) {
			second = Math.abs(second);
			var val = new Array();
			val[0] = Math.floor(second/3600%24);//hours
			val[1] = Math.floor(second/60%60);//mins
			val[2] = Math.floor(second%60);//secs
			var stopage = true;
			var cutIndex  = -1;
			for(var i = 0; i < val.length; i++) {
				if(val[i] < 10) val[i] = "0" + val[i];		
				if( val[i] == "00" && i < (val.length - 2) && !stopage) cutIndex = i;
				else stopage = true;
			}
			val.splice(0, cutIndex + 1);
			return val.join(':');
		};
		
		function _shufflePlaylist() {
			if($playlistWrapper) {
				$playlistWrapper.find('#fap-playlist').empty();
			}
			//action for the shuffle button			
			if(currentIndex != -1) {
				var tempTitle = tracks[currentIndex].title;
				tracks.shuffle();
				_updateTrackIndex(tempTitle);
				for(var i=0; i < tracks.length; ++i) {
					_createPlaylistTrack(tracks[i].artwork_url, tracks[i].title);
				}
				$main.find('#fap-playlist-wrapper #fap-playlist').find('li').eq(currentIndex).css('backgroundColor', options.fillColor);
				$main.find('#fap-playlist-wrapper').scrollTop(0);
			}
			//action for randomize option
			else {
				tracks.shuffle();
				for(var i=0; i < tracks.length; ++i) {
					_createPlaylistTrack(tracks[i].artwork_url, tracks[i].title);
				}
				
			}
			
		};
		
		//array shuffle
		function _arrayShuffle(){
		  var tmp, rand;
		  for(var i =0; i < this.length; i++){
			rand = Math.floor(Math.random() * this.length);
			tmp = this[i]; 
			this[i] = this[rand]; 
			this[rand] = tmp;
		  }
		};
		Array.prototype.shuffle = _arrayShuffle;
		
		function _updateTrackIndex(title) {
			for(var i=0; i < tracks.length; ++i) {
				if(tracks[i].title == title) { currentIndex = i; }
			}
		};
		
		function _decodebase64(input) {
			var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		    var output = "";
		    var chr1, chr2, chr3;
		    var enc1, enc2, enc3, enc4;
		    var i = 0;
		
		    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		
		    while (i < input.length) {
		
		        enc1 = _keyStr.indexOf(input.charAt(i++));
		        enc2 = _keyStr.indexOf(input.charAt(i++));
		        enc3 = _keyStr.indexOf(input.charAt(i++));
		        enc4 = _keyStr.indexOf(input.charAt(i++));
		
		        chr1 = (enc1 << 2) | (enc2 >> 4);
		        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		        chr3 = ((enc3 & 3) << 6) | enc4;
		
		        output = output + String.fromCharCode(chr1);
		
		        if (enc3 != 64) {
		            output = output + String.fromCharCode(chr2);
		        }
		        if (enc4 != 64) {
		            output = output + String.fromCharCode(chr3);
		        }
		
		    }
		
		    output = _utf8_decode(output);
		
		    return output;
		}
		
		function _utf8_decode(utftext) {
		    var string = "";
		    var i = 0;
		    var c = c1 = c2 = 0;
		
		    while ( i < utftext.length ) {
		
		        c = utftext.charCodeAt(i);
		
		        if (c < 128) {
		            string += String.fromCharCode(c);
		            i++;
		        }
		        else if((c > 191) && (c < 224)) {
		            c2 = utftext.charCodeAt(i+1);
		            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
		            i += 2;
		        }
		        else {
		            c2 = utftext.charCodeAt(i+1);
		            c3 = utftext.charCodeAt(i+2);
		            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
		            i += 3;
		        }
		
		    }
		
		    return string;
		}
		
		function _detectMobileBrowsers() {
			return /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
		}

		return this.each(function() {_init(this)});
	};
	

	//OPTIONS
	$.fn.fullwidthAudioPlayer.defaults = {
		wrapperPosition: 'bottom', //top, bottom or popup
		mainPosition: 'center', //left, center or right
		wrapperColor: '#f0f0f0', //background color of the wrapper
		mainColor: '#3c3c3c',
		fillColor: '#e3e3e3',
		metaColor: '#666666',
		strokeColor: '#e0e0e0',
		fillColorHover: '#d1d1d1',
		activeTrackColor: '#E8E8E8',
		twitterText: 'Share on Twitter',
		facebookText: 'Share on Facebook',
		soundcloudText: 'Check on Souncloud',
		downloadText: 'Download',
		popupUrl: 'popup.html', //- since V1.3
		height: 70, // the height of the wrapper
		playlistHeight: 210, //set the playlist height for the scrolling
		coverSize: [50, 50], //size (x,y) of the cover
		offset: 20, //offset between playlist and upper content
		opened: true,
		volume: true, // show/hide volume control
		playlist: true, //show/hide playlist
		autoLoad: true, //loads the music file when soundmanager is ready
		autoPlay: false, //enable/disbale autoplay
		playNextWhenFinished: true, //plays the next track when current one has finished
		keyboard: true, //enable/disable the keyboard shortcuts
		socials: true, //hide/show social links
		autoPopup: false, //pop out player in a new window automatically - since V1.3
		randomize: false, //randomize default playlist - since V1.3
		shuffle: true, //show/hide shuffle button - since V1.3
		sortable: false, //sortable playlist
		base64: false, //set to true when you encode your mp3 urls with base64
		xmlPath: '', //the xml path
		xmlPlaylist: '', //the ID of the playlist which should be loaded into player from the XML file
		hideOnMobile: false //1.4.1 - Hide the player on mobile devices
	};

})(jQuery);


/*
*   JavaScript interface for the SoundCloud Player widget
*   Author: Matas Petrikas, matas@soundcloud.com
*   Copyright (c) 2009  SoundCloud Ltd.
*   Licensed under the MIT license:
*   http://www.opensource.org/licenses/mit-license.php
*/
(function(){
  var isIE = (/msie/i).test(navigator.userAgent) && !(/opera/i).test(navigator.userAgent);
  
  var soundcloud = window.soundcloud = {
    version: "0.1",
    debug: false,
    _listeners: [],
    // re-dispatches widget events in the DOM, using JS library support, the events also should bubble up the DOM
    _redispatch: function(eventType, flashId, data) {
      var playerNode,
          lsnrs  = this._listeners[eventType] || [],
          // construct the custom eventType  e.g. 'soundcloud:onPlayerReady'
          customEventType = 'soundcloud:' + eventType;

      try{
        // find the flash player, might throw an exception
        playerNode = this.getPlayer(flashId);
      }catch(e){
        if(this.debug && window.console){
          console.error('unable to dispatch widget event ' + eventType + ' for the widget id ' + flashId, data, e);
        }
        return;
      }
      // re-dispatch SoundCloud events up in the DOM
      if(window.jQuery){
        // if jQuery is available, trigger the custom event
        jQuery(playerNode).trigger(customEventType, [data]);
      }else if(window.Prototype){
        // if Prototype.js is available, fire the custom event
        $(playerNode).fire(customEventType, data);
      }else{
        // TODO add more JS libraries that support custom DOM events
      }
      // if there are any listeners registered to this event, trigger them all
      for(var i = 0, l = lsnrs.length; i < l; i += 1) {
        lsnrs[i].apply(playerNode, [playerNode, data]);
      }
      // log the events in debug mode
      if(this.debug && window.console){
        console.log(customEventType, eventType, flashId, data);
      }

    },
    // you can add multiple listeners to a certain event
    // e.g. soundcloud.addEventListener('onPlayerReady', myFunctionOne);
    //      soundcloud.addEventListener('onPlayerReady', myFunctionTwo);
    addEventListener: function(eventType, callback) {
      if(!this._listeners[eventType]){
        this._listeners[eventType] = [];
      }
      this._listeners[eventType].push(callback);
    },
    // you can also remove the function listener if e.g you want to trigger it only once
    // soundcloud.removeEventListener('onMediaPlay', myFunctionOne);
    removeEventListener: function(eventType, callback) {
      var lsnrs = this._listeners[eventType] || [];
      for(var i = 0, l = lsnrs.length; i < l; i += 1) {
        if(lsnrs[i] === callback){
          lsnrs.splice(i, 1);
        }
      }
    },
    // get widget node based on its id (if object tag) or name (if embed tag)
    // if you're using SWFObject or other dynamic Flash generators, please make sure that you set the id parameter
    //  only if the DOM has an id/name it's possible to call player's methods.
    // Important!: because of the bug in Opera browser, the Flash can't get its own id
    // so the generator should set it additionally through flashvars parameter 'object_id'
    getPlayer: function(id){
      var flash;
      try{
        if(!id){
          throw "The SoundCloud Widget DOM object needs an id atribute, please refer to SoundCloud Widget API documentation.";
        }
        flash = isIE ? window[id] : document[id];
        if(flash){
          if(flash.api_getFlashId){
            return flash;
          }else{
             throw "The SoundCloud Widget External Interface is not accessible. Check that allowscriptaccess is set to 'always' in embed code";
          }
        }else{
          throw "The SoundCloud Widget with an id " + id + " couldn't be found";
        }
      }catch(e){
        if (console && console.error) {
         console.error(e);
        }
        throw e;
      }
    },
    // fired when widget has loaded its data and is ready to accept calls from outside
    // the widget will call these functions only if in it's flashvars there's a parameter enable_api=true
    // @flashId: the widget id, basically the Flash node should be accessible to JS with soundcloud.getPlayer(flashId)
    // @data: an object containing .mediaUri (eg. 'http://api.soundcloud.com/tracks/49931') .mediaId (e.g. '4532')
    // in buffering events data contains also .percent = (e.g. '99')
    onPlayerReady: function(flashId, data) {
      this._redispatch('onPlayerReady', flashId, data);
    },
    // fired when widget starts playing current track (fired only once per track)
    onMediaStart : function(flashId, data) {
      this._redispatch('onMediaStart', flashId, data);
    },
    // fired when the track/playlist has finished playing
    onMediaEnd : function(flashId, data) {
      this._redispatch('onMediaEnd', flashId, data);
    },
    // fired when widget starts playing current track (fired on every play, seek)
    onMediaPlay : function(flashId, data) {
      this._redispatch('onMediaPlay', flashId, data);
    },
    // fired when track was paused
    onMediaPause : function(flashId, data) {
      this._redispatch('onMediaPause', flashId, data);
    },
    // fired when the widget is still buffering, means you can't seek in the track fully yet
    onMediaBuffering : function(flashId, data) {
      this._redispatch('onMediaBuffering', flashId, data);
    },
    // fired when the user seeks in the track
    onMediaSeek : function(flashId, data) {
      this._redispatch('onMediaSeek', flashId, data);
    },
    // fired when the widget is done buffering and the whole track length is seekable
    onMediaDoneBuffering : function(flashId, data) {
      this._redispatch('onMediaDoneBuffering', flashId, data);
    },
    // fired when the widget can't get the requested data from the server (the resource is removed, hidden, etc.)
    onPlayerError : function(flashId, data) {
      this._redispatch('onPlayerError', flashId, data);
    }
  };
  
})();




/*
*   SoundCloud Custom Player jQuery Plugin
*   Author: Matas Petrikas, matas@soundcloud.com
*   Copyright (c) 2009  SoundCloud Ltd.
*   Licensed under the MIT license:
*   http://www.opensource.org/licenses/mit-license.php
*
*   Usage:
*   <a href="http://soundcloud.com/matas/hobnotropic" class="sc-player">My new dub track</a>
*   The link will be automatically replaced by the HTML based player
*/
(function($) {

  var debug = true,
      useSandBox = false,
      $doc = $(document),
      log = function(args) {
        try {
          if(debug && window.console && window.console.log){
            window.console.log.apply(window.console, arguments);
          }
        } catch (e) {
          // no console available
        }
      },
      domain = useSandBox ? 'sandbox-soundcloud.com' : 'soundcloud.com';


  var audioEngine = function() {
    var html5AudioAvailable = function() {
        var state = false;
        try{
          var a = new Audio();
          state = a.canPlayType && (/maybe|probably/).test(a.canPlayType('audio/mpeg'));
          // let's enable the html5 audio on selected mobile devices first, unlikely to support Flash
          // the desktop browsers are still better with Flash, e.g. see the Safari 10.6 bug
          // comment the following line out, if you want to force the html5 mode
          state = state && (/iPad|iphone|mobile|pre\//i).test(navigator.userAgent);
        }catch(e){
          // there's no audio support here sadly
        }
        return state;
    }();
	
    callbacks = {
      onReady: function() {
        $doc.trigger('fapScPlayer:onAudioReady');
      },
      onPlay: function() {
        $doc.trigger('fapScPlayer:onMediaPlay');
      },
      onPause: function() {
        $doc.trigger('fapScPlayer:onMediaPause');
      },
      onEnd: function() {
        $doc.trigger('fapScPlayer:onMediaEnd');
      },
      onBuffer: function(percent) {
        $doc.trigger({type: 'fapScPlayer:onMediaBuffering', percent: percent});
      }
    };

    var html5Driver = function() {
      var player = new Audio(),
          onTimeUpdate = function(event){
            var obj = event.target,
                buffer = ((obj.buffered.length && obj.buffered.end(0)) / obj.duration) * 100;
            // ipad has no progress events implemented yet
            callbacks.onBuffer(buffer);
            // anounce if it's finished for the clients without 'ended' events implementation
            if (obj.currentTime === obj.duration) { callbacks.onEnd(); }
          },
          onProgress = function(event) {
            var obj = event.target,
                buffer = ((obj.buffered.length && obj.buffered.end(0)) / obj.duration) * 100;
            callbacks.onBuffer(buffer);
          };
          
      $('<div class="sc-player-engine-container"></div>').appendTo(document.body).append(player);

      // prepare the listeners
      player.addEventListener('play', callbacks.onPlay, false);
      player.addEventListener('pause', callbacks.onPause, false);
      player.addEventListener('ended', callbacks.onEnd, false);
      player.addEventListener('timeupdate', onTimeUpdate, false);
      player.addEventListener('progress', onProgress, false);

      return {
        load: function(track, apiKey) {
          player.pause();
          player.src = track.stream_url + '?consumer_key=' + apiKey;
          player.load();
          player.play();
        },
        play: function() {
          player.play();
        },
        pause: function() {
          player.pause();
        },
        stop: function(){
		  if(player.currentTime) { player.currentTime = 0; }
          player.pause();
        },
        seek: function(relative){
          player.currentTime = player.duration * relative;
          player.play();
        },
        getDuration: function() {
          return player.duration * 1000;
        },
        getPosition: function() {
          return player.currentTime * 1000;
        },
        setVolume: function(val) {
          if(player){
            player.volume = val / 100;
          }
        },
		html5: true
      };

    };



    var flashDriver = function() {
      var engineId = 'fapScPlayerEngine',
          player,
          flashHtml = function(url) {
            var swf = 'http://player.' + domain +'/player.swf?url=' + url +'&amp;enable_api=true&amp;player_type=engine&amp;object_id=' + engineId;
            if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
              return '<object height="100%" width="100%" id="' + engineId + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" data="' + swf + '">'+
                '<param name="movie" value="' + swf + '" />'+
                '<param name="allowscriptaccess" value="always" />'+
                '</object>';
            } else {
              return '<object height="100%" width="100%" id="' + engineId + '">'+
                '<embed allowscriptaccess="always" height="100%" width="100%" src="' + swf + '" type="application/x-shockwave-flash" name="' + engineId + '" />'+
                '</object>';
            }
          };



      // listen to audio engine events
      // when the loaded track is ready to play
      soundcloud.addEventListener('onPlayerReady', function(flashId, data) {
        player = soundcloud.getPlayer(engineId);
        callbacks.onReady();
      });

      // when the loaded track finished playing
      soundcloud.addEventListener('onMediaEnd', callbacks.onEnd);

      // when the loaded track is still buffering
      soundcloud.addEventListener('onMediaBuffering', function(flashId, data) {
        callbacks.onBuffer(data.percent);
      });

      // when the loaded track started to play
      soundcloud.addEventListener('onMediaPlay', callbacks.onPlay);

      // when the loaded track is was paused
      soundcloud.addEventListener('onMediaPause', callbacks.onPause);

      return {
        load: function(track) {
          var url = track.permalink_url;
          if(player){
            player.api_load(url);
          }else{
            // create a container for the flash engine (IE needs this to operate properly)
            $('<div class="sc-player-engine-container"></div>').appendTo(document.body).html(flashHtml(url));
          }
        },
        play: function() {
          player && player.api_play();
        },
        pause: function() {
          player && player.api_pause();
        },
        stop: function(){
          player && player.api_stop();
        },
        seek: function(relative){
          player && player.api_seekTo((player.api_getTrackDuration() * relative));
        },
        getDuration: function() {
          return player && player.api_getTrackDuration && player.api_getTrackDuration() * 1000;
        },
        getPosition: function() {
          return player && player.api_getTrackPosition && player.api_getTrackPosition() * 1000;
        },
        setVolume: function(val) {
          if(player && player.api_setVolume){
            player.api_setVolume(val);
          }
        },
        html5: false
      };
    };

    //return html5Driver();
    return html5AudioAvailable? html5Driver() : flashDriver();

  }();
  
  var apiKey,
      autoPlay,
      didAutoPlay = false,
	  preventPlaying = false,
      positionPoll;

  $.fapScPlayer = function(options) {
    var opts = $.extend({}, $.fapScPlayer.defaults, options);
	apiKey = opts.apiKey;
	autoPlay = opts.autoPlay;
  };
  
  $.fapScPlayer.html5 = function () {
	  return audioEngine.html5;
  };
  
  $.fapScPlayer.load = function(track, autoPlay) {
	  preventPlaying = !autoPlay;
	  audioEngine.stop();
	  audioEngine.load(track, apiKey);
	  $.fapScPlayer.duration = track.duration;
  };
  
  $.fapScPlayer.play = function() {
	  preventPlaying = false;
	  audioEngine.play();
  };
  
  $.fapScPlayer.pause = function() {
	  preventPlaying = true;
	  audioEngine.pause();
  };
  
  $.fapScPlayer.stop = function() {
	  preventPlaying = true;
	  audioEngine.stop();
  };
  
  $.fapScPlayer.setPosition = function(relative) {
	  audioEngine.seek(relative);
  };
  
  $.fapScPlayer.setVolume = function(relative) {
	  audioEngine.setVolume(relative);
  };
  
  $.fapScPlayer.destruct = function() {
	  preventPlaying = true;
	  audioEngine.pause();
	  audioEngine.stop();
  }; 

  // listen to audio engine events
  $doc
	.bind('fapScPlayer:onAudioReady', function(event) {
		audioEngine.html5 ? log('Soundcloud Player HTML5: audio engine is ready') : log('Soundcloud Player Flash: audio engine is ready');
		if(didAutoPlay || !preventPlaying) {
			audioEngine.play();
		}
		else {
			if(autoPlay) { audioEngine.play(); }
			else { audioEngine.pause(); } 
		}
		didAutoPlay = true;
		
	})
	// when the loaded track started to play
	.bind('fapScPlayer:onMediaPlay', function(event) {
		clearInterval(positionPoll);
		if(preventPlaying) { 
		    audioEngine.stop();
		    return false; 
		}
		
		positionPoll = setInterval(function() {
		  var duration = audioEngine.getDuration(),
			  position = audioEngine.getPosition();
		  $.fapScPlayer.defaults.whileplaying(position, duration);
		}, 500);
	})
	// when the loaded track is was paused
	.bind('fapScPlayer:onMediaPause', function(event) {
		clearInterval(positionPoll);
		positionPoll = null;
	})
	// change the volume
	.bind('fapScPlayer:onVolumeChange', function(event) {
		
	})
	.bind('fapScPlayer:onMediaEnd', function(event) {
		  $.fapScPlayer.defaults.onfinish();
	})
	.bind('fapScPlayer:onMediaBuffering', function(event) {
		  $.fapScPlayer.defaults.whileloading(event.percent+1);
	});

  // plugin wrapper
  $.fn.fapScPlayer = function(options) {
    // create the players
    this.each(function() {
      $.fapScPlayer(options, this);
    });
    return this;
  };

  // default plugin options
  $.fapScPlayer.defaults = $.fn.fapScPlayer.defaults = {
	whileloading: function() {},
	whileplaying : function() {},
	onfinish: function() {},
    apiKey: 'LFSDttxBaGVSYZfSitrA', //http://soundcloud.com/you/apps/new
	autoPlay: true
  };

})(jQuery);

/**
 * Antiscroll: cross-browser native OSX Lion scrollbars (MIT License)
 *
 * https://github.com/LearnBoost/antiscroll
 *
 **/
(function ($) {

  /**
   * Augment jQuery prototype.
   */

  $.fn.antiscroll = function (options) {
    return this.each(function () {
      if ($(this).data('antiscroll')) {
        $(this).data('antiscroll').destroy();
      }

      $(this).data('antiscroll', new $.Antiscroll(this, options));
    });
  };

  /**
   * Expose constructor.
   */

  $.Antiscroll = Antiscroll;

  /**
   * Antiscroll pane constructor.
   *
   * @param {Element|jQuery} main pane
   * @parma {Object} options
   * @api public
   */

  function Antiscroll (el, opts) {
    this.el = $(el);
    this.options = opts || {};

    this.x = false !== this.options.x;
    this.y = false !== this.options.y;
    this.padding = undefined == this.options.padding ? 2 : this.options.padding;

    this.inner = this.el.find('.antiscroll-inner');
    this.inner.css({
        'width': '+=' + scrollbarSize()
      , 'height': '+=' + scrollbarSize()
    });

    this.refresh();
  };

  /**
   * refresh scrollbars
   *
   * @api public
   */
  Antiscroll.prototype.refresh = function() {
    var needHScroll = this.inner.get(0).scrollWidth > this.el.width()
      , needVScroll = this.inner.get(0).scrollHeight > this.el.height();

    if (!this.horizontal && needHScroll && this.x) {
      this.horizontal = new Scrollbar.Horizontal(this);
    } else if (this.horizontal && !needHScroll)  {
      this.horizontal.destroy();
      this.horizontal = null
    }

    if (!this.vertical && needVScroll && this.y) {
      this.vertical = new Scrollbar.Vertical(this);
    } else if (this.vertical && !needVScroll)  {
      this.vertical.destroy();
      this.vertical = null
    }

  };

  /**
   * Cleans up.
   *
   * @return {Antiscroll} for chaining
   * @api public
   */

  Antiscroll.prototype.destroy = function () {
    if (this.horizontal) {
      this.horizontal.destroy();
    }
    if (this.vertical) {
      this.vertical.destroy();
    }
    return this;
  };

  /**
   * Rebuild Antiscroll.
   *
   * @return {Antiscroll} for chaining
   * @api public
   */

  Antiscroll.prototype.rebuild = function () {
    this.destroy();
    this.inner.attr('style', '');
    Antiscroll.call(this, this.el, this.options);
    return this;
  };

  /**
   * Scrollbar constructor.
   *
   * @param {Element|jQuery} element
   * @api public
   */

  function Scrollbar (pane) {
    this.pane = pane;
    this.pane.el.append(this.el);
    this.innerEl = this.pane.inner.get(0);

    this.dragging = false;
    this.enter = false;
    this.shown = false;

    // hovering
    this.pane.el.mouseenter($.proxy(this, 'mouseenter'));
    this.pane.el.mouseleave($.proxy(this, 'mouseleave'));

    // dragging
    this.el.mousedown($.proxy(this, 'mousedown'));

    // scrolling
    this.pane.inner.scroll($.proxy(this, 'scroll'));

    // wheel -optional-
    this.pane.inner.bind('mousewheel', $.proxy(this, 'mousewheel'));

    // show
    var initialDisplay = this.pane.options.initialDisplay;

    if (initialDisplay !== false) {
      this.show();
      this.hiding = setTimeout($.proxy(this, 'hide'), parseInt(initialDisplay, 10) || 3000);
    }
  };

  /**
   * Cleans up.
   *
   * @return {Scrollbar} for chaining
   * @api public
   */

  Scrollbar.prototype.destroy = function () {
    this.el.remove();
    return this;
  };

  /**
   * Called upon mouseenter.
   *
   * @api private
   */

  Scrollbar.prototype.mouseenter = function () {
    this.enter = true;
    this.show();
  };

  /**
   * Called upon mouseleave.
   *
   * @api private
   */

  Scrollbar.prototype.mouseleave = function () {
    this.enter = false;

    if (!this.dragging) {
      this.hide();
    }
  }

  /**
   * Called upon wrap scroll.
   *
   * @api private
   */

  Scrollbar.prototype.scroll = function () {
    if (!this.shown) {
      this.show();
      if (!this.enter && !this.dragging) {
        this.hiding = setTimeout($.proxy(this, 'hide'), 1500);
      }
    }

    this.update();
  };

  /**
   * Called upon scrollbar mousedown.
   *
   * @api private
   */

  Scrollbar.prototype.mousedown = function (ev) {
    ev.preventDefault();

    this.dragging = true;

    this.startPageY = ev.pageY - parseInt(this.el.css('top'), 10);
    this.startPageX = ev.pageX - parseInt(this.el.css('left'), 10);

    // prevent crazy selections on IE
    document.onselectstart = function () { return false; };

    var pane = this.pane
      , move = $.proxy(this, 'mousemove')
      , self = this

    $(document)
      .mousemove(move)
      .mouseup(function () {
        self.dragging = false;
        document.onselectstart = null;

        $(document).unbind('mousemove', move);

        if (!self.enter) {
          self.hide();
        }
      })
  };

  /**
   * Show scrollbar.
   *
   * @api private
   */

  Scrollbar.prototype.show = function (duration) {
    if (!this.shown) {
      this.update();
      this.el.addClass('antiscroll-scrollbar-shown');
      if (this.hiding) {
        clearTimeout(this.hiding);
        this.hiding = null;
      }
      this.shown = true;
    }
  };

  /**
   * Hide scrollbar.
   *
   * @api private
   */

  Scrollbar.prototype.hide = function () {
    if (this.shown) {
      // check for dragging
      this.el.removeClass('antiscroll-scrollbar-shown');
      this.shown = false;
    }
  };

  /**
   * Horizontal scrollbar constructor
   *
   * @api private
   */

  Scrollbar.Horizontal = function (pane) {
    this.el = $('<div class="antiscroll-scrollbar antiscroll-scrollbar-horizontal">');
    Scrollbar.call(this, pane);
  }

  /**
   * Inherits from Scrollbar.
   */

  inherits(Scrollbar.Horizontal, Scrollbar);

  /**
   * Updates size/position of scrollbar.
   *
   * @api private
   */

  Scrollbar.Horizontal.prototype.update = function () {
    var paneWidth = this.pane.el.width()
      , trackWidth = paneWidth - this.pane.padding * 2
      , innerEl = this.pane.inner.get(0)

    this.el
      .css('width', trackWidth * paneWidth / innerEl.scrollWidth)
      .css('left', trackWidth * innerEl.scrollLeft / innerEl.scrollWidth)
  }

  /**
   * Called upon drag.
   *
   * @api private
   */

  Scrollbar.Horizontal.prototype.mousemove = function (ev) {
    var trackWidth = this.pane.el.width() - this.pane.padding * 2
      , pos = ev.pageX - this.startPageX
      , barWidth = this.el.width()
      , innerEl = this.pane.inner.get(0)

    // minimum top is 0, maximum is the track height
    var y = Math.min(Math.max(pos, 0), trackWidth - barWidth)

    innerEl.scrollLeft = (innerEl.scrollWidth - this.pane.el.width())
      * y / (trackWidth - barWidth)
  };

  /**
   * Called upon container mousewheel.
   *
   * @api private
   */

  Scrollbar.Horizontal.prototype.mousewheel = function (ev, delta, x, y) {
    if ((x < 0 && 0 == this.pane.inner.get(0).scrollLeft) ||
        (x > 0 && (this.innerEl.scrollLeft + this.pane.el.width()
          == this.innerEl.scrollWidth))) {
      ev.preventDefault();
      return false;
    }
  };

  /**
   * Vertical scrollbar constructor
   *
   * @api private
   */

  Scrollbar.Vertical = function (pane) {
    this.el = $('<div class="antiscroll-scrollbar antiscroll-scrollbar-vertical">');
    Scrollbar.call(this, pane);
  };

  /**
   * Inherits from Scrollbar.
   */

  inherits(Scrollbar.Vertical, Scrollbar);

  /**
   * Updates size/position of scrollbar.
   *
   * @api private
   */

  Scrollbar.Vertical.prototype.update = function () {
    var paneHeight = this.pane.el.height()
      , trackHeight = paneHeight - this.pane.padding * 2
      , innerEl = this.innerEl

    this.el
      .css('height', trackHeight * paneHeight / innerEl.scrollHeight)
      .css('top', trackHeight * innerEl.scrollTop / innerEl.scrollHeight)
  };

  /**
   * Called upon drag.
   *
   * @api private
   */

  Scrollbar.Vertical.prototype.mousemove = function (ev) {
    var paneHeight = this.pane.el.height()
      , trackHeight = paneHeight - this.pane.padding * 2
      , pos = ev.pageY - this.startPageY
      , barHeight = this.el.height()
      , innerEl = this.innerEl

    // minimum top is 0, maximum is the track height
    var y = Math.min(Math.max(pos, 0), trackHeight - barHeight)

    innerEl.scrollTop = (innerEl.scrollHeight - paneHeight)
      * y / (trackHeight - barHeight)
  };

  /**
   * Called upon container mousewheel.
   *
   * @api private
   */

  Scrollbar.Vertical.prototype.mousewheel = function (ev, delta, x, y) {
    if ((y > 0 && 0 == this.innerEl.scrollTop) ||
        (y < 0 && (this.innerEl.scrollTop + this.pane.el.height()
          == this.innerEl.scrollHeight))) {
      ev.preventDefault();
      return false;
    }
  };

  /**
   * Cross-browser inheritance.
   *
   * @param {Function} constructor we inherit from
   * @api private
   */

  function inherits (ctorA, ctorB) {
    function f() {};
    f.prototype = ctorB.prototype;
    ctorA.prototype = new f;
  };

  /**
   * Scrollbar size detection.
   */

  var size;

  function scrollbarSize () {
    if (size === undefined) {
      var div = $(
          '<div style="width:50px;height:50px;overflow:hidden;'
        + 'position:absolute;top:-200px;left:-200px;"><div style="height:100px;">'
        + '</div>'
      );

      $('body').append(div);

      var w1 = $('div', div).innerWidth();
      div.css('overflow-y', 'scroll');
      var w2 = $('div', div).innerWidth();
      $(div).remove();

      size = w1 - w2;
    }

    return size;
  };

})(jQuery);