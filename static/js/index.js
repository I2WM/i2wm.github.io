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
    preloadInterpolationImages("./static/images/stacked0", 12);
    preloadInterpolationImages("./static/images/stacked1", 12);
    preloadInterpolationImages("./static/images/stacked2", 12);
    preloadInterpolationImages("./static/images/stacked3", 12);
    preloadInterpolationImages("./static/images/stacked4", 12);


    $('#interpolation-slider-0').on('input', function(event) {
      setInterpolationImage('0', 0, this.value);
    });
    setInterpolationImage('0', 0, 0);
    $('#interpolation-slider-0').prop('max', 11);

    $('#interpolation-slider-1').on('input', function(event) {
      setInterpolationImage('1', 1, this.value);
    });
    setInterpolationImage('1', 1, 0);
    $('#interpolation-slider-1').prop('max', 11);

    $('#interpolation-slider-2').on('input', function(event) {
      setInterpolationImage('2', 2, this.value);
    });
    setInterpolationImage('2', 2, 0);
    $('#interpolation-slider-2').prop('max', 11);

    $('#interpolation-slider-3').on('input', function(event) {
      setInterpolationImage('3', 3, this.value);
    });
    setInterpolationImage('3', 3, 0);
    $('#interpolation-slider-3').prop('max', 11);

    $('#interpolation-slider-4').on('input', function(event) {
      setInterpolationImage('4', 4, this.value);
    });
    setInterpolationImage('4', 4, 0);
    $('#interpolation-slider-4').prop('max', 11);


    bulmaSlider.attach();

})
