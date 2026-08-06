(function () {
  'use strict'

  var nativeFetch = window.fetch.bind(window)

  window.sennoricFetch = function (input, options, timeoutMs) {
    var init = options || {}
    var upstreamSignal = init.signal
    var controller = new AbortController()
    var timeout = Number.isFinite(timeoutMs) ? timeoutMs : 12000

    function forwardAbort() {
      controller.abort(upstreamSignal && upstreamSignal.reason)
    }

    if (upstreamSignal) {
      if (upstreamSignal.aborted) forwardAbort()
      else upstreamSignal.addEventListener('abort', forwardAbort, { once: true })
    }

    var timer = setTimeout(function () {
      controller.abort(new DOMException('Request timed out', 'TimeoutError'))
    }, timeout)

    return nativeFetch(input, Object.assign({}, init, { signal: controller.signal }))
      .finally(function () {
        clearTimeout(timer)
        if (upstreamSignal) upstreamSignal.removeEventListener('abort', forwardAbort)
      })
  }
})()
