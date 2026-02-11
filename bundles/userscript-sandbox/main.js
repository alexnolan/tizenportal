/**
 * Userscript Sandbox Bundle
 * 
 * Provides a safe place to experiment with user scripts.
 */

import styles from './style.css';

export default {
  style: styles,
  userscripts: [
    {
      id: 'sandbox-readability',
      name: 'TV Readability Booster',
      enabled: true,
      inline: "(function(){var s=document.createElement('style');s.id='tp-readability';s.textContent='body,p,span,div,li,td,th,a,h1,h2,h3,h4,h5,h6{font-size:clamp(18px,2.5vw,32px)!important;line-height:1.8!important;letter-spacing:0.02em!important}p,li,td,th{max-width:1200px!important}a{text-decoration:underline!important;outline:2px solid cyan!important;padding:4px!important}button,input,select,textarea{min-height:44px!important;font-size:20px!important;padding:8px 12px!important}';document.head.appendChild(s);userscript.cleanup=function(){var el=document.getElementById('tp-readability');if(el)el.remove();}})();",
    },
    {
      id: 'sandbox-autoscroll',
      name: 'Smart Auto-Scroll',
      enabled: false,
      inline: "(function(){var speed=1;var interval=null;var scrolling=true;function startScroll(){if(interval)clearInterval(interval);interval=setInterval(function(){if(scrolling)window.scrollBy(0,speed);},30);}function stopScroll(){if(interval){clearInterval(interval);interval=null;}}function toggleScroll(){scrolling=!scrolling;TizenPortal.log('Auto-scroll '+(scrolling?'resumed':'paused'));}var keyHandler=function(e){if(e.keyCode===38){speed=Math.max(0.5,speed-0.5);TizenPortal.log('Scroll speed: '+speed+'px');e.preventDefault();}else if(e.keyCode===40){speed=Math.min(5,speed+0.5);TizenPortal.log('Scroll speed: '+speed+'px');e.preventDefault();}else if(e.keyCode===19||e.keyCode===415||e.keyCode===13){toggleScroll();e.preventDefault();}else if(e.keyCode===413||e.keyCode===10009){stopScroll();document.removeEventListener('keydown',keyHandler);TizenPortal.log('Auto-scroll stopped');e.preventDefault();}};document.addEventListener('keydown',keyHandler);startScroll();TizenPortal.log('Auto-scroll started (Up/Down: speed, Enter/Pause: toggle, Stop/Back: exit)');userscript.cleanup=function(){stopScroll();document.removeEventListener('keydown',keyHandler);}})();",
    },
    {
      id: 'sandbox-smart-dark',
      name: 'Smart Dark Mode',
      enabled: false,
      inline: "(function(){var s=document.createElement('style');s.id='tp-smart-dark';s.textContent='html{background-color:#181818!important;color:#e8e6e3!important}body{background-color:#181818!important;color:#e8e6e3!important}div,section,article,main,aside,nav,header,footer,p,span,li,td,th,h1,h2,h3,h4,h5,h6{background-color:transparent!important;color:#e8e6e3!important}a{color:#8ab4f8!important}a:visited{color:#c58af9!important}input,textarea,select,button{background-color:#303134!important;color:#e8e6e3!important;border:1px solid #5f6368!important}input::placeholder,textarea::placeholder{color:#9aa0a6!important}img,video,canvas,iframe{opacity:0.9!important}*[style*=\"background\"]:not(img):not(video):not(canvas){background-color:#202124!important}*[style*=\"color\"]{color:#e8e6e3!important}';document.head.appendChild(s);userscript.cleanup=function(){var el=document.getElementById('tp-smart-dark');if(el)el.remove();}})();",
    },
    {
      id: 'sandbox-youtube-tv',
      name: 'YouTube TV Enhancements',
      enabled: false,
      inline: "(function(){if(!window.location.host.includes('youtube.com'))return;var s=document.createElement('style');s.id='tp-yt-tv';s.textContent='.ytp-chrome-top,.ytp-chrome-bottom,.ytp-gradient-top,.ytp-gradient-bottom{display:block!important;opacity:1!important}.html5-video-player:not(.ytp-fullscreen) .ytp-chrome-bottom{height:auto!important;padding:10px!important}.ytp-play-button,.ytp-time-display,.ytp-volume-panel{font-size:140%!important;min-width:50px!important;min-height:50px!important}video{max-height:90vh!important}';document.head.appendChild(s);var checkInterval=setInterval(function(){var vid=document.querySelector('video');if(vid){vid.playbackRate=1.0;clearInterval(checkInterval);}},1000);userscript.cleanup=function(){var el=document.getElementById('tp-yt-tv');if(el)el.remove();if(checkInterval)clearInterval(checkInterval);}})();",
    },
    {
      id: 'sandbox-ad-skipper',
      name: 'Video Ad Skip Helper',
      enabled: false,
      inline: "(function(){var observer=null;var skipButtons=['button[class*=\"skip\"]','button[class*=\"Skip\"]','button[id*=\"skip\"]','button[aria-label*=\"Skip\"]','.ytp-ad-skip-button','.ytp-skip-ad-button','button:contains(\"Skip\")'];function clickSkip(){for(var i=0;i<skipButtons.length;i++){var btns=document.querySelectorAll(skipButtons[i]);for(var j=0;j<btns.length;j++){if(btns[j].offsetParent!==null){btns[j].click();TizenPortal.log('Clicked skip button');return true;}}}return false;}var checkInterval=setInterval(clickSkip,2000);observer=new MutationObserver(function(){setTimeout(clickSkip,100);});observer.observe(document.body,{childList:true,subtree:true});userscript.cleanup=function(){if(checkInterval)clearInterval(checkInterval);if(observer)observer.disconnect();}})();",
    },
    {
      id: 'sandbox-focus-zoom',
      name: 'Image Focus Zoom',
      enabled: false,
      inline: "(function(){var zoomedImg=null;var overlay=null;function createOverlay(){overlay=document.createElement('div');overlay.id='tp-zoom-overlay';overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:999999;display:none;align-items:center;justify-content:center;';var img=document.createElement('img');img.id='tp-zoom-img';img.style.cssText='max-width:95%;max-height:95%;object-fit:contain;';overlay.appendChild(img);document.body.appendChild(overlay);return overlay;}function showZoom(src){if(!overlay)overlay=createOverlay();var img=document.getElementById('tp-zoom-img');img.src=src;overlay.style.display='flex';zoomedImg=img;}function hideZoom(){if(overlay)overlay.style.display='none';zoomedImg=null;}var keyHandler=function(e){if(zoomedImg&&(e.keyCode===10009||e.keyCode===13)){hideZoom();e.preventDefault();e.stopPropagation();}};var clickHandler=function(e){var target=e.target;if(target.tagName==='IMG'&&target.src&&!target.closest('#tp-zoom-overlay')){showZoom(target.src);e.preventDefault();}};document.addEventListener('keydown',keyHandler,true);document.addEventListener('click',clickHandler,true);userscript.cleanup=function(){document.removeEventListener('keydown',keyHandler,true);document.removeEventListener('click',clickHandler,true);if(overlay)overlay.remove();}})();",
    },
    {
      id: 'sandbox-autoplay-blocker',
      name: 'Auto-Play Video Blocker',
      enabled: false,
      inline: "(function(){var pausedVideos=[];function pauseVideo(vid){if(!vid.paused&&!pausedVideos.includes(vid)){vid.pause();pausedVideos.push(vid);TizenPortal.log('Auto-paused video');}}function checkVideos(){var vids=document.querySelectorAll('video');for(var i=0;i<vids.length;i++){if(!vids[i].paused&&vids[i].currentTime>0){pauseVideo(vids[i]);}}}var observer=new MutationObserver(checkVideos);observer.observe(document.body,{childList:true,subtree:true});checkVideos();var interval=setInterval(checkVideos,1000);userscript.cleanup=function(){if(observer)observer.disconnect();if(interval)clearInterval(interval);}})();",
    },
    {
      id: 'sandbox-remove-sticky',
      name: 'Remove Sticky Headers',
      enabled: false,
      inline: "(function(){var s=document.createElement('style');s.id='tp-no-sticky';s.textContent='*[style*=\"position: fixed\"],*[style*=\"position:fixed\"]{position:static!important}header[style*=\"position\"],nav[style*=\"position\"]{position:static!important}.fixed,.sticky,[class*=\"fixed\"],[class*=\"sticky\"]{position:static!important}';document.head.appendChild(s);userscript.cleanup=function(){var el=document.getElementById('tp-no-sticky');if(el)el.remove();}})();",
    },
    {
      id: 'sandbox-web-grayscale',
      name: 'Grayscale Mode',
      source: 'url',
      enabled: false,
      url: 'https://cdn.jsdelivr.net/gh/openstyles/stylus@1.5.31/tools/grayscale.user.js',
      inline: '',
      cached: '',
    },
    {
      id: 'sandbox-custom-css',
      name: 'Custom CSS Template',
      enabled: false,
      inline: "(function(){var customCSS='body { /* Add your CSS here */ }';var s=document.createElement('style');s.id='tp-custom-css';s.textContent=customCSS;document.head.appendChild(s);TizenPortal.log('Custom CSS applied');userscript.cleanup=function(){var el=document.getElementById('tp-custom-css');if(el)el.remove();}})();",
    },
  ],

  onActivate: function(win, card) {
    try {
      if (win && win.TizenPortal && win.TizenPortal.log) {
        win.TizenPortal.log('Userscript Sandbox: Active');
      }
    } catch (err) {
      // Ignore
    }
  },

  onDeactivate: function() {
    // No-op
  },
};
