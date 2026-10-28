/* Start the project presentation without native captions when the current
   YouTube runtime supports unloading them. unloadModule is runtime-exposed,
   not a documented stable IFrame API guarantee. Never override later toggles. */
(function () {
  'use strict';
  var frame = document.getElementById('fluxflow-video-player');
  if (!frame || !/^https?:$/.test(window.location.protocol)) return;
  var source = new URL(frame.src);
  source.searchParams.set('enablejsapi', '1');
  source.searchParams.set('origin', window.location.origin);
  frame.src = source.toString();

  var created = false;
  var finished = false;
  var firstBufferSeen = false;
  var initializationOpen = false;
  var closeTimer = null;
  function finish() {
    finished = true;
    initializationOpen = false;
    window.clearTimeout(closeTimer);
  }
  function tryInitialCaptionOff(player) {
    if (finished || !initializationOpen) return;
    if (typeof player.unloadModule !== 'function' || typeof player.getOptions !== 'function') {
      finish();
      return;
    }
    try {
      if (player.getOptions().indexOf('captions') === -1) return;
      // Consume before calling: unload can itself trigger another API event.
      finish();
      player.unloadModule('captions');
    } catch (_) {
      finish(); // Unsupported runtimes retain the normal accessible player.
    }
  }
  function createPlayer() {
    if (created || !window.YT || typeof window.YT.Player !== 'function') return;
    created = true;
    new window.YT.Player(frame.id, {
      events: {
        onReady: function (event) {
          initializationOpen = true;
          tryInitialCaptionOff(event.target);
          initializationOpen = false;
        },
        onStateChange: function (event) {
          if (finished) return;
          if (event.data === 3 && !firstBufferSeen) {
            firstBufferSeen = true;
            initializationOpen = true;
            // Captions usually load with the first buffer. Never remain armed
            // until a visitor elects to enable them much later.
            closeTimer = window.setTimeout(finish, 1500);
            tryInitialCaptionOff(event.target);
          } else if (event.data === 1) {
            tryInitialCaptionOff(event.target);
            finish();
          }
        },
        onApiChange: function (event) { tryInitialCaptionOff(event.target); },
        onError: finish
      }
    });
  }
  window.addEventListener('pagehide', finish, { once: true });
  var previousReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    try { if (typeof previousReady === 'function') previousReady(); }
    finally { createPlayer(); }
  };
  if (window.YT && typeof window.YT.Player === 'function') {
    createPlayer();
  } else if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
    var loader = document.createElement('script');
    loader.src = 'https://www.youtube.com/iframe_api';
    loader.async = true;
    document.head.appendChild(loader);
  }
})();
