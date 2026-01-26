window.HELP_IMPROVE_VIDEOJS = false;

// Tab switching function
function switchTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(function(content) {
    content.style.display = 'none';
  });
  
  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-button').forEach(function(btn) {
    btn.classList.remove('active');
    btn.classList.add('is-light');
  });
  
  // Show selected tab content
  document.getElementById(tabId + '-content').style.display = 'block';
  
  // Add active class to selected tab button
  var activeBtn = document.getElementById(tabId + '-btn');
  activeBtn.classList.add('active');
  activeBtn.classList.remove('is-light');
}

// var INTERP_BASE_0 = ;
// var NUM_INTERP_FRAMES = 12;

var interp_images = [];
function preloadInterpolationImages(INTERP_BASE, NUM_INTERP_FRAMES) {
  interp_images.push([]);
  for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
    var path = INTERP_BASE + '/' + String(i) + '.jpg';
    interp_images[interp_images.length-1][i] = new Image();
    interp_images[interp_images.length-1][i].src = path;
  }
}

function setInterpolationImage(wrapper_id, stack_id, i) {
  var image = interp_images[stack_id][i];
  image.ondragstart = function() { return false; };
  image.oncontextmenu = function() { return false; };
  $('#interpolation-image-wrapper-'+wrapper_id).empty().append(image);
}


$(document).ready(function() {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
			slidesToScroll: 1,
			slidesToShow: 3,
			loop: true,
			infinite: true,
			autoplay: false,
			autoplaySpeed: 3000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	// Add listener to  event
    	carousels[i].on('before:show', state => {
    		console.log(state);
    	});
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before-show', function(state) {
    		console.log(state);
    	});
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/
    preloadInterpolationImages("./static/images/akikaze", 4);
    preloadInterpolationImages("./static/images/bluehawaii", 4);


    $('#interpolation-slider-0').on('input', function(event) {
      setInterpolationImage('0', 0, this.value);
    });
    setInterpolationImage('0', 0, 0);
    $('#interpolation-slider-0').prop('max', 4);

    $('#interpolation-slider-1').on('input', function(event) {
      setInterpolationImage('1', 1, this.value);
    });
    setInterpolationImage('1', 1, 0);
    $('#interpolation-slider-1').prop('max', 4);


    bulmaSlider.attach();

})

function initComparisons() {
  var x, i;
  /* Find all elements with an "overlay" class: */
  x = document.getElementsByClassName("img-comp-overlay");
  for (i = 0; i < x.length; i++) {
    /* Once for each "overlay" element:
    pass the "overlay" element as a parameter when executing the compareImages function: */
    compareImages(x[i]);
  }
  function compareImages(overlay) {
    var slider, clicked = 0, w, h;
    /* Get the container element */
    var container = overlay.parentElement;
    /* Get the width and height of the container */
    w = container.offsetWidth;
    h = container.offsetHeight;
    /* Fix the overlay image width to container width, so it clips instead of scaling */
    var overlayImg = overlay.querySelector("img");
    if (overlayImg) {
      overlayImg.style.width = w + "px";
      overlayImg.style.height = h + "px";
    }
    /* Set the width of the overlay element to 50%: */
    overlay.style.width = (w / 2) + "px";
    /* Create slider: */
    slider = document.createElement("DIV");
    slider.setAttribute("class", "img-comp-slider");
    /* Insert slider */
    container.insertBefore(slider, overlay);
    /* Position the slider in the middle: */
    slider.style.top = (h / 2) - (slider.offsetHeight / 2) + "px";
    slider.style.left = (w / 2) - (slider.offsetWidth / 2) + "px";
    /* Hover mode: start tracking when mouse enters container */
    container.addEventListener("mouseenter", slideReady);
    container.addEventListener("mouseleave", slideFinish);
    /* Touch support: still use touch events */
    slider.addEventListener("touchstart", slideReady);
    window.addEventListener("touchend", slideFinish);
    function slideReady(e) {
      /* Prevent any other actions that may occur when moving over the image: */
      e.preventDefault();
      /* The slider is now active and ready to move: */
      clicked = 1;
      /* Execute a function when the mouse/touch is moved: */
      container.addEventListener("mousemove", slideMove);
      window.addEventListener("touchmove", slideMove);
    }
    function slideFinish() {
      /* The slider is no longer active: */
      clicked = 0;
      container.removeEventListener("mousemove", slideMove);
    }
    function slideMove(e) {
      var pos;
      /* If the slider is no longer active, exit this function: */
      if (clicked == 0) return false;
      /* Get the cursor's x position: */
      pos = getCursorPos(e)
      /* Prevent the slider from being positioned outside the image: */
      if (pos < 0) pos = 0;
      if (pos > w) pos = w;
      /* Execute a function that will resize the overlay image according to the cursor: */
      slide(pos);
    }
    function getCursorPos(e) {
      var a, x = 0;
      e = (e.changedTouches) ? e.changedTouches[0] : e;
      /* Get the x positions of the container (not overlay, since overlay width changes): */
      a = container.getBoundingClientRect();
      /* Calculate the cursor's x coordinate, relative to the container: */
      x = e.pageX - a.left;
      /* Consider any page scrolling: */
      x = x - window.pageXOffset;
      return x;
    }
    function slide(x) {
      /* Resize the overlay (image inside stays fixed width, gets clipped): */
      overlay.style.width = x + "px";
      /* Position the slider: */
      slider.style.left = overlay.offsetWidth - (slider.offsetWidth / 2) + "px";
    }
  }
}