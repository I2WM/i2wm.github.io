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
  var tabContent = document.getElementById(tabId + '-content');
  tabContent.style.display = 'block';
  
  // Add active class to selected tab button
  var activeBtn = document.getElementById(tabId + '-btn');
  activeBtn.classList.add('active');
  activeBtn.classList.remove('is-light');
  
  // Re-initialize image comparisons in the newly shown tab
  // Use setTimeout to ensure the tab is fully visible before getting dimensions
  setTimeout(function() {
    initComparisons(tabContent, true);
  }, 100);
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

function initComparisons(scope, forceReinit) {
  var x, i;
  /* Find all elements with an "overlay" class within the scope (or whole document): */
  var searchRoot = scope || document;
  x = searchRoot.getElementsByClassName("img-comp-overlay");
  for (i = 0; i < x.length; i++) {
    /* Once for each "overlay" element:
    pass the "overlay" element as a parameter when executing the compareImages function: */
    compareImages(x[i]);
  }
  function compareImages(overlay) {
    var slider, w, h;
    /* Get the container element */
    var container = overlay.parentElement;
    
    /* Get the width and height of the container */
    w = container.offsetWidth;
    h = container.offsetHeight;
    /* Skip if container is hidden (dimensions are 0) */
    if (w === 0 || h === 0) {
      return;
    }
    
    /* Check if already initialized (has a slider) */
    var existingSlider = container.querySelector(".img-comp-slider");
    var isAlreadyInitialized = container.dataset.compInitialized === "true";
    
    if (existingSlider && !forceReinit) {
      return;
    }
    
    if (existingSlider && forceReinit) {
      /* Remove existing slider for re-initialization */
      existingSlider.remove();
    }
    
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
    
    /* Only bind events once */
    if (!isAlreadyInitialized) {
      container.dataset.compInitialized = "true";
      
      /* Store state on container for event handlers */
      container._compState = { clicked: 0, w: w, h: h, overlay: overlay, slider: slider };
      
      /* Hover mode: start tracking when mouse enters container */
      container.addEventListener("mouseenter", function(e) {
        e.preventDefault();
        container._compState.clicked = 1;
        container.addEventListener("mousemove", handleSlideMove);
      });
      container.addEventListener("mouseleave", function() {
        container._compState.clicked = 0;
        container.removeEventListener("mousemove", handleSlideMove);
      });
      /* Touch support */
      slider.addEventListener("touchstart", function(e) {
        e.preventDefault();
        container._compState.clicked = 1;
        window.addEventListener("touchmove", handleSlideMove);
      });
      window.addEventListener("touchend", function() {
        container._compState.clicked = 0;
      });
      
      function handleSlideMove(e) {
        var state = container._compState;
        if (state.clicked == 0) return false;
        var pos = getCursorPos(e, container);
        if (pos < 0) pos = 0;
        if (pos > state.w) pos = state.w;
        state.overlay.style.width = pos + "px";
        state.slider.style.left = state.overlay.offsetWidth - (state.slider.offsetWidth / 2) + "px";
      }
    } else {
      /* Update state references for the new slider */
      container._compState.w = w;
      container._compState.h = h;
      container._compState.slider = slider;
    }
  }
  
  function getCursorPos(e, container) {
    var a, x = 0;
    e = (e.changedTouches) ? e.changedTouches[0] : e;
    a = container.getBoundingClientRect();
    x = e.pageX - a.left;
    x = x - window.pageXOffset;
    return x;
  }
}