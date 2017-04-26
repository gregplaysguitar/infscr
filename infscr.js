(function (window, factory) {
  // universal module definition - thanks @desandro
  /* eslint-disable eqeqeq, no-undef */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // browser global
    window.InfScr = factory(window.jQuery);
  }
  /* eslint-enable eqeqeq, no-undef */
}(window, function factory ($) {
  'use strict';

  function InfScr (container, options) {
    /* Create an infinite-scrolling page from a container with pagination.

       Options:

       nextSelector: css selector to find the "next page" link
       contentSelector: selector to find content
       autoOffset: distance from bottom to trigger auto-load
       callback: function called on content load
       bind: whether to bind the resize/scroll handlers directly to the window
       get_url: function to get the next page url from a link

       If bind is false, the resize method must be called before the
       auto-load behaviour will work. */

    options = $.extend({
      nextSelector: null,
      contentSelector: null,
      autoOffset: null,
      bind: false,
      get_url: function (link) {
        return link.attr('href');
      },
      get_content: function (data) {
        return data;
      },
      getCacheKey: function () {
        // TODO get a unique key for the instance/url etc
        return 'infscr_cache' + window.location.pathname + window.location.search;
      },
      beforeLoad: null,
      onLoad: null
    }, options);
    var loading = false;
    var winHeight;
    var containerOffset;
    var autoLoadThreshold;
    var setThreshold;
    var xhr;

    var cached = window.sessionStorage.getItem(options.getCacheKey());
    if (cached) {
      // assume cached is a superset of the current items. TODO check this is
      // actually the case
      // console.log('Adding', container.html().length, cached.length);

      var tempEl = $('<div>').html(cached);
      var currentItems = container.find(options.contentSelector);
      var newItems = tempEl.find(options.contentSelector)
      .slice(currentItems.length);
      var nextHref = tempEl.find(options.nextSelector).attr('href');

      container.find(options.nextSelector).attr('href', nextHref);
      container.append(newItems);
      options.onLoad(newItems, container);
    } else {
      window.sessionStorage.setItem(options.getCacheKey(), container.html());
    }

    function cancelXhr () {
      if (xhr) {
        xhr.abort();
      }
    }

    function append (url) {
      if (!loading) {
        container.addClass('loading-more');
        loading = true;
        cancelXhr();
        if (options.beforeLoad) {
          options.beforeLoad();
        }
        // TODO get rid of jquery, use window.fetch
        xhr = $.get(url, function (data) {
          var html = options.get_content(data);
          var content = $('<div>').html(html);
          var nextHref = content.find(options.nextSelector).attr('href');
          var link = container.find(options.nextSelector);
          var newContent = content.find(options.contentSelector);

          if (link.length) {
            newContent.insertBefore(link);
          } else {
            container.append(newContent);
          }
          container.removeClass('loading-more');

          if (nextHref) {
            link.attr('href', nextHref);
          } else {
            link.remove();
          }

          window.sessionStorage.setItem(options.getCacheKey(), container.html());

          if (options.onLoad) {
            options.onLoad(newContent, container);
          }
          loading = false;
          if (setThreshold) {
            // won't exist if not auto-loading
            setThreshold();
          }
        });
      }
    }

    container.on('click', options.nextSelector, function () {
      append(options.get_url($(this)));
      return false;
    });

    var obj = {
      cancel: cancelXhr
    };

    function resize (w, h) {
      winHeight = h;
      containerOffset = container.offset();
      setThreshold();
    }

    function scroll (t, l) {
      if (t > autoLoadThreshold) {
        container.find(options.nextSelector).trigger('click');
      }
    }

    if (options.autoOffset) {
      container.find(options.nextSelector).hide();

      setThreshold = function () {
        if (winHeight === undefined) {
          return;
        }
        autoLoadThreshold = containerOffset.top + container.outerHeight() -
        winHeight - options.autoOffset;
      };

      // if (options.bind) {
      //   bind_handlers(resize, scroll);
      // }
      obj.resize = resize;
      obj.setThreshold = setThreshold;
      obj.scroll = scroll;
    }
    return obj;
  }

  return InfScr;
}));
