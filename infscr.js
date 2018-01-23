/* Notes

- canOverwrite method to check whether the current page can be overwritten
  by cached content?

- Need a "sanity check" value which can be compared to see if the cached
  content matches. Default could be length of html, or don't use by default.
  For cag it's the href of the next link as this contains the order_token

- use #fragment to remember which page we're at, might solve above problems

- TODO jquery purge - check

*/

(function (window, factory) {
  // universal module definition - thanks @desandro
  /* eslint-disable eqeqeq, no-undef */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define([], factory)
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS
    module.exports = factory()
  } else {
    // browser global
    window.InfScr = factory()
  }
  /* eslint-enable eqeqeq, no-undef */
}(window, function factory () {
  'use strict'

  var sessionCache = {
    set: function (key, value) {
      return window.sessionStorage.setItem(key, value)
    },
    get: function (key) {
      return window.sessionStorage.getItem(key)
    }
  }

  var dummyCache = {
    set: function () {},
    get: function () {}
  }

  function getOffset (el) {
    el = el.getBoundingClientRect()
    return {
      left: el.left + window.scrollX,
      top: el.top + window.scrollY
    }
  }

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

    options = Object.assign({
      cache: sessionCache,
      nextSelector: null,
      contentSelector: null,
      autoOffset: null,
      bind: false,
      get_url: function (link) {
        return link.getAttribute('href')
      },
      get_content: function (data) {
        return data
      },
      getCacheKey: function () {
        // TODO get a unique key for the instance/url etc
        return 'infscr_cache' + window.location.pathname + window.location.search
      },
      beforeLoad: null,
      onLoad: null
    }, options)
    var loading = false
    var winHeight
    var containerOffset
    var autoLoadThreshold
    var setThreshold
    // var xhr
    var nextLink = container.querySelector(options.nextSelector)

    if (!options.cache) {
      options.cache = dummyCache
    }

    var cached = options.cache.get(options.getCacheKey())
    if (cached) {
      // assume cached is a superset of the current items. TODO check this is
      // actually the case
      // console.log('Adding', container.html().length, cached.length)

      var newContainer = document.createElement('div')
      newContainer.innerHTML = cached
      var currentItems = container.querySelectorAll(options.contentSelector)
      var newItems = newContainer.querySelectorAll(options.contentSelector)
      // newItems = Array.prototype.slice.call(newItems).slice(currentItems.length)
      var newNextLink = newContainer.querySelector(options.nextSelector)
      var nextHref = newNextLink ? newNextLink.getAttribute('href') : null

      var frag = document.createDocumentFragment()
      for (var i = 0; i < newItems.length; i++) {
        if (i >= currentItems.length) {
          frag.appendChild(newItems)
        }
      }

      if (nextLink) {
        container.insertBefore(frag, nextLink)
        if (nextHref) {
          nextLink.setAttribute('href', nextHref)
        } else {
          nextLink.remove()
        }
      } else {
        container.appendChild(frag)
      }

      // TODO
      // options.onLoad(newItems, container)
      options.onLoad(null, container)
    } else {
      options.cache.set(options.getCacheKey(), container.innerHTML)
    }

    function cancelFetch () {
      // TODO
      // if (xhr) {
      //   xhr.abort()
      // }
    }

    function append () {
      var next = container.querySelector(options.nextSelector)
      if (!loading && next) {
        container.classList.add('loading-more')
        loading = true
        cancelFetch()
        if (options.beforeLoad) {
          options.beforeLoad()
        }

        var params = {
          method: 'get',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        }

        return window.fetch(options.get_url(next), params)
          .then(function (response) {
            return response.text()
          }).then(function (text) {
            return options.get_content(text)
          }).then(function (html) {
            var content = document.createElement('div')
            content.innerHTML = html
            var newNextLink = content.querySelector(options.nextSelector)
            var newContent = content.querySelectorAll(options.contentSelector)

            var frag = document.createDocumentFragment()
            for (var i = 0; i < newContent.length; i++) {
              frag.appendChild(newContent[i])
            }
            if (nextLink) {
              container.insertBefore(frag, nextLink)
            } else {
              container.appendChild(frag)
            }

            container.classList.remove('loading-more')

            if (newNextLink) {
              nextLink.setAttribute('href', newNextLink.getAttribute('href'))
            } else {
              nextLink.remove()
            }

            options.cache.set(options.getCacheKey(), container.innerHTML)

            if (options.onLoad) {
              options.onLoad(newContent, container)
            }
            loading = false
            if (setThreshold) {
              // won't exist if not auto-loading
              setThreshold()
            }
          })
      }
    }

    if (nextLink) {
      nextLink.addEventListener('click', function (e) {
        append()
        e.preventDefault()
      })
    }

    var obj = {
      cancel: cancelFetch
    }

    function resize (w, h) {
      winHeight = h
      containerOffset = getOffset(container)
      setThreshold()
    }

    function scroll (t, l) {
      if (t > autoLoadThreshold) {
        append()
      }
    }

    if (options.autoOffset) {
      if (nextLink) {
        nextLink.style.display = 'none'
      }

      setThreshold = function () {
        if (winHeight === undefined) {
          return
        }
        autoLoadThreshold = containerOffset.top + container.offsetHeight -
        winHeight - options.autoOffset
      }

      // if (options.bind) {
      //   bind_handlers(resize, scroll)
      // }
      obj.resize = resize
      obj.setThreshold = setThreshold
      obj.scroll = scroll
    }
    return obj
  }

  return InfScr
}))
