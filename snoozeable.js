// forked of "CSS3 Animated Swipe Gallery" by Matthew Burrows 
// source: http://codepen.io/mattjburrows/pen/GFCKL

/* LICENSE OF FORKED CODE:

Copyright (c) 2016 by Matthew Burrows (http://codepen.io/mattjburrows/pen/GFCKL)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

window.SnoozeSwiper = (function(window, document, undefined){

  // === HELPERS ===

  /*
   * Get the computed styles of any element.
   */
  function fetchComputedStyle(el, prop, pseudo) {
    return window.getComputedStyle(el, (pseudo || null)).getPropertyValue(prop);
  };

  /*
   * Get the prefixed version of a CSS property.
   */
  function getPrefix(prefixes) {
    var div = document.createElement('div');
    // Check to see if we are dealing with an array.
    if (Object.prototype.toString.call(prefixes) === '[object Array]') {
      var max = prefixes.length;
      while (max--) {
        if (prefixes[max] in div.style) {
          return prefixes[max];
        }
      }
    }
    // Else we'll assume it is an object.
    else {
      for (prefix in prefixes) {
        if (prefix in div.style) {
          return prefixes[prefix];
        }
      }
    }
    return false;
  };

  // === CLASSES ===

  /*
  * Set the window listeners up, listens to either 'orientationchange' or 'resize' events depending on support.
  *
  * @class WindowListeners
  * @param {Object} opts
  */
  WindowListeners = function (opts) {
    this.opts = opts;
    this._init();
  };
  WindowListeners.prototype.addListener = function (cb) {
    var self = this;
    if ('function' === typeof cb) {
      window.addEventListener(this.listener, cb, false);
    }
  };
  WindowListeners.prototype.removeListener = function (cb) {
    var self = this;
    if ('function' === typeof cb) {
      window.addEventListener(this.listener, cb, false);
    }
  };
  WindowListeners.prototype._init = function () {
    this.listener = 'onorientationchange' in window ? 'orientationchange' : 'resize';
    return this;
  };

  /*
  * Set up the ability to listen out to CSS animation and transition events.
  *
  * @class CSSListeners
  * @param {Object} opts
  */
  function CSSListeners (opts) {
    this._init(opts);
  };
  CSSListeners.prototype.addEvent = function (el, cb) {
    var self = this;
    el.addEventListener(this.prefix, cb, false);
  };
  CSSListeners.prototype.removeEvent = function (el, cb) {
    var self = this;
    el.removeEventListener(this.prefix, cb, false);
  };
  CSSListeners.prototype._init = function (opts) {
    var self = this;
    this.opts = opts;
    // By default we shall set up animation end listeners.
    this.type = this.opts.type || 'animation';
    // Set up the prefixes to default to the animation end browser prefixes.
    this.prefixes = this.opts.prefixes || {
      'WebkitAnimation': 'webkitAnimationEnd',
      'OAnimation': 'oanimationend',
      'MsAnimation': 'MSAnimationEnd',
      'animation': 'animationend'
    };
    this.prefix = getPrefix(this.prefixes);
    return this;
  };


  /*
  * Listen out for swipes.
  *
  * @class SwipeControl
  * @param {Object} opts
  */
  SwipeControl = function (opts) {
    this.opts = opts;
    this._init(opts);
  };
  SwipeControl.prototype.setListeners = function () {
    var self = this,
      hasTouch = 'ontouchstart' in window,
      startEvent = hasTouch ? 'touchstart' : 'mousedown',
      moveEvent = hasTouch ? 'touchmove' : 'mousemove',
      endEvent = hasTouch ? 'touchend' : 'mouseup';
    // Set the touch start event to track where the swipe originated.
    this.element.addEventListener(startEvent, function (e) {
      if (e.targetTouches && 1 === e.targetTouches.length || 'mousedown' === e.type) {
        var eventObj = hasTouch ? e.targetTouches[0] : e;
        // Set the start event related properties.
        self.startTime = Date.now();
        self.start = parseInt(eventObj.pageX);
      }
      // e.preventDefault();
    }, false);
    // Set the touch move event to track the swipe movement.
    this.element.addEventListener(moveEvent, function (e) {
      if (self.start && (e.targetTouches && 1 === e.targetTouches.length || 'mousemove' === e.type)) {
        var eventObj = hasTouch ? e.targetTouches[0] : e;
        // Set the current position related properties.
        self.currTime = Date.now();
        self.currPos = parseInt(eventObj.pageX);
        self.trackSwipe();
      }
      e.preventDefault();
    }, false);
    // Set the touch end event to track where the swipe finished.
    this.element.addEventListener(endEvent, function (e) {
      var eventObj = hasTouch ? e.changedTouches[0] : e;
      // Set the end event related properties.
      self.endTime = Date.now();
      self.end = parseInt(eventObj.pageX);
      // Run the confirm swipe method.
      self.confirmSwipe();
      // e.preventDefault();
    }, false);
  };
  SwipeControl.prototype.trackSwipe = function () {
    var self = this;
    // Overwrite the function properties.
    this.direction = (this.start > this.currPos) ? 'left' : 'right';
    this.trackDistance = ('left' === this.direction) ? (this.start - this.currPos) : (this.currPos - this.start);
    // Run the tracking callback.
    this.trackingCallback(this.direction, this.trackDistance, this.currPos, this.start, parseInt(this.currTime - this.startTime));
  };
  SwipeControl.prototype.confirmSwipe = function () {
    var self = this;
    // Set up the direction property.
    this.direction = (this.start > this.end) ? 'left' : 'right';
    // Set up the duration property.
    this.duration = parseInt(this.endTime - this.startTime);
    // Work out the distance based on the direction of the swipe.
    this.swipeDistance = ('left' === this.direction) ? (this.start - this.end) : (this.end - this.start);
    // This is where we determine whether it was a swipe or not.
    this.swipeSuccessCallback(this.direction, this.swipeDistance, this.duration);
    // Reset the variables.
    this._config();
  };
  SwipeControl.prototype._config = function () {
    this.start = null;
    this.end = null;
    this.trackDistance = null;
    this.swipeDistance = null;
    this.currPos = null;
    this.startTime = null;
    this.endTime = null;
    this.currTime = null;
    this.direction = null;
    this.duration = null;
  };
  SwipeControl.prototype._init = function (opts) {
    // Set the function properties.
    this.element = this.opts.element;
    this.swipeSuccessCallback = this.opts.swipeSuccessCallback || function (dir, dist, time) {
      console.log(dir, dist, time);
    };
    this.trackingCallback = this.opts.trackingCallback || function (dir, dist, currPos, time) {
      console.log(dir, dist, currPos, time);
    };
    // Run the function methods.
    this._config();
    this.setListeners();
    return this;
  };

  // === GALLERY CONTROL CLASS ===

  var ItemClasses = {
    hidden: 'is-hidden',
    active: 'is-active',
    animateIn: 'animate-in',
    animateOut: 'animate-out'
  };

  /*
  * Reposition the snoozeable elements based on the size of the screen.
  *
  * @class GalleryControl
  * @param {Object} opts
  */
  GalleryControl = function (opts) {
    this.animating = false;
    this.active = 0; // active item/slide is always the first one
    this.opts = opts;
    this._init();
  };
  GalleryControl.prototype.trackSlides = function (dir, dist, callback) {
    var self = this,
      currPos = -(this.active * this.slideWidth),
      translateX = ('left' === dir) ? parseFloat(currPos - dist) : parseFloat(currPos + dist),
      wrapper = this.wrapper[0];
    wrapper.style[this.prefix] = 'translate(' + translateX + 'px, 0)';
    if ('function' === typeof callback) {
      callback();
    }
  };
  GalleryControl.prototype.animateSlides = function (next, speed) {
    var self = this,
      next = next || 0,
      speed = speed || false,
      max = this.slides.length,
      wrapper = this.wrapper[0],
      translateX = (next * this.slideWidth),
      speedPrefix = getPrefix(['webkitTransitionDuration', 'MSTransitionDuration', 'oTransitionDuration', 'transitionDuration']),
      // We know that the heading and icon animations take 0.5s to complete...
      // So we need to make sure the next animation can't be initiated before everything has finished the animation cycle.
      // What we are doing is minusing the swipe speed from the CSS transition speed.
      // I know... the implementation is a little stinky...
      timeout = speed ? (0.5 - speed).toString().replace('.', '').slice(0, 4) : 1;
    // Make sure the app isn't currently animating...
    // And that the new position doesn't equal the current position.
    if (('translate(-' + translateX + 'px, 0)' !== wrapper.style[this.prefix])) {
      this.animating = true;
      this.listener.addEvent(wrapper, function transition() {
        // Remove the transition property.
        wrapper.style[speedPrefix] = '';
        // Remove the event.
        self.listener.removeEvent(wrapper, transition);
        // Remove the active class.
        wrapper.classList.remove(ItemClasses.active);
        // Reset the App.animating property...
        // Add a slight delay to stop any chaining.
        setTimeout(function () {
          self.animating = false;
        }, parseFloat(timeout));
      });
      // Toggle the slide styles.
      while (max--) {
        this.slides[max].classList.remove(ItemClasses.active);
      }
      this.slides[next].classList.add(ItemClasses.active);
      // Change the wrapper styles.
      wrapper.classList.add(ItemClasses.active);
      wrapper.style[this.prefix] = 'translate(-' + translateX + 'px, 0)';
      if (speed) {
        wrapper.style[speedPrefix] = speed + 's';
      }
    }
  };
  GalleryControl.prototype.fixSlideDimensions = function (active) {
    var max = this.slides.length,
      wrapper = this.wrapper[0];
    // Reset the function properties.
    this._config();
    // Set the wrapper dimensions.
    //this.element.style.height = this.slideHeight + 'px';
    wrapper.style.width = (this.slideWidth * max) + 'px';
    //wrapper.style.height = this.slideHeight + 'px';
    wrapper.style.marginLeft = (this.elementWidth / 2) - (this.slideWidth / 2) + 'px';
    // Set the slide dimensions.
    while (max--) {
      var slide = this.slides[max];
      slide.style.width = this.slideWidth + 'px';
      //slide.style.height = this.slideHeight + 'px';
    }
    wrapper.style[this.prefix] = 'translate(-' + (active * this.slideWidth) + 'px, 0)';
  };
  GalleryControl.prototype._config = function () {
    this.prefix = getPrefix(['transform', 'WebkitTransform']);
    this.elementWidth = parseInt(fetchComputedStyle(this.element, 'width'));
    this.slideWidth = ((this.elementWidth >= 1024) && ('landscape' === fetchComputedStyle(document.body, 'content', ':before'))) ? 640 : this.elementWidth;
    //this.slideHeight = parseFloat(calculateAspectRatio(this.slideWidth, null));
  };
  GalleryControl.prototype._init = function () {
    var self = this;
    // Set the function properties.
    this.element = this.opts.element;
    this.wrapper = this.element.querySelectorAll(this.opts.wrapper);
    this.slides = this.element.querySelectorAll(this.opts.slides);
    this.listener = new CSSListeners({
      type: 'transition',
      prefixes: {
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'msTransition': 'MSTransitionEnd',
        'transition': 'transitionEnd'
      }
    });
    // Run the function methods.
    this.fixSlideDimensions(0);
    return this;
  };

  // === MAIN COMPONENT LOGIC ===

  return function(element, onSnoozeFct) {

    var active = 0;

    element.classList.add('snoozeable-module');

    var
      windowChange = new WindowListeners(),
      snoozeableControl = new GalleryControl({
        element: element,
        wrapper: '.snoozeable-module__wrapper',
        slides: '.snoozeable-module__slide'
      }),
      swipeListener = new SwipeControl({
        element: element,
        trackingCallback: function (dir, dist, currPos, startPos, time) {
          var self = this;
          if (!snoozeableControl.animating) {
            // Create a callback to determine whether the user has tracked enough to move onto the next slide.
            snoozeableControl.trackSlides(dir, dist, function callback() { });
          }
        },
        swipeSuccessCallback: function (dir, dist, time) {
          if (!snoozeableControl.animating) {
            var width = snoozeableControl.slideWidth,
              offsetDist = (dist * 1.66),
              speed = (offsetDist / time) / 10;
            // Make sure the swipe distance is less than the swipe time...
            // Or that the swipe distance is greater than the half of the slide width.
            if (offsetDist > time || (dist > (width / 2))) {
              if ('left' === dir) {
                var next = active + 1;
                // Animate the snoozeable slides along...
                // Only pass the speed property on fast or long swipes, else default to the value set up in the css.
                snoozeableControl.animateSlides(next, ((offsetDist > time) && (dist > (width / 2))) ? speed : false);
                // Callback the parent of this component instance
                onSnoozeFct();
              } else {
                // Animate the snoozeable slides back into place.
                snoozeableControl.animateSlides(active);
              }
            } else {
              // Make sure we have actually travelled.
              if (10 < dist) {
                // Animate the snoozeable slides back into place.
                snoozeableControl.animateSlides(active, null);
              }
            }
          }
        }
      }),
      resizeTimer = null;

    // Listen out for 'orientationchange' or 'resize' events on the window.
    windowChange.addListener(function changed() {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(function () {
        snoozeableControl.fixSlideDimensions(active);
      }, 250);
    });

  };

})(window, document);
