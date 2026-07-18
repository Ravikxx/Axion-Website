/* Paper banner — reusable "logo on textured paper" masthead.
 *
 * Markup template (copy this to reuse elsewhere, just swap data-images):
 *
 *   <div class="paper-banner"
 *        data-images="/assets/paper/paper-1.jpg,/assets/paper/paper-2.jpg"
 *        data-logo="/assets/logo-axion-new.png"
 *        data-interval="500"
 *        data-zoom-min="100"
 *        data-zoom-max="106"></div>
 *
 * Each cycle advances to the next image in data-images (looping back to
 * the first, or re-cropping the same one if only one is given) and snaps
 * to a new random crop (zoom + position) for it — an instant cut, not a
 * fade.
 *
 * The fill size is computed from the image's *actual* natural dimensions
 * and the container's *actual* rendered box (the same math as CSS
 * `background-size: cover`), not a fixed percentage. That guarantees full
 * coverage — no sliver of the container ever shows through — regardless
 * of a photo's aspect ratio or the container's size, and it re-fits on
 * resize/orientation-change instead of assuming a fixed viewport. The
 * zoom range is just a small *extra* multiplier on top of that guaranteed
 * cover scale, so it only ever crops in further, never under.
 *
 * Orientation is also picked automatically: for each image we compare the
 * cover scale needed normally against the cover scale needed if the image
 * were rotated 90°, and use whichever needs less zoom. A photo whose own
 * aspect ratio is a poor match for the banner's shape (e.g. a portrait
 * photo dropped into this wide landscape strip) can end up needing
 * noticeably less crop rotated than upright — this only matters for
 * texture/pattern photos with no inherent "up," which is what this banner
 * uses.
 */
(function () {
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  // Compare the CSS `cover` scale needed for an image at its natural
  // orientation vs. rotated 90°, and return whichever needs less zoom.
  function bestFit(cw, ch, nw, nh) {
    var normalScale = Math.max(cw / nw, ch / nh);
    var rotatedScale = Math.max(cw / nh, ch / nw);
    if (rotatedScale < normalScale) {
      return { rotated: true, scale: rotatedScale };
    }
    return { rotated: false, scale: normalScale };
  }

  function paintLayer(layer, container, imgEl, zoomMin, zoomMax) {
    var cw = container.clientWidth, ch = container.clientHeight;
    var nw = imgEl.naturalWidth, nh = imgEl.naturalHeight;
    var posX = rand(20, 80);
    var posY = rand(20, 80);

    layer.style.backgroundImage = 'url(' + imgEl.src + ')';
    layer.style.backgroundPosition = posX + '% ' + posY + '%';

    var extraUsed = 1;
    if (cw && ch && nw && nh) {
      var fit = bestFit(cw, ch, nw, nh);
      extraUsed = Math.max(rand(zoomMin, zoomMax) / 100, 1);   // >= 1: crop in only
      var scale = fit.scale * extraUsed;
      layer.style.backgroundSize = Math.ceil(nw * scale) + 'px ' + Math.ceil(nh * scale) + 'px';
      applyOrientation(layer, cw, ch, fit.rotated);
    } else {
      // Dimensions not measurable yet (shouldn't happen post-load) — a
      // generous percentage still beats leaving no size at all.
      layer.style.backgroundSize = '160%';
      applyOrientation(layer, cw, ch, false);
    }

    layer.dataset.currentImg = imgEl.src;
    return extraUsed;
  }

  // Rotating a box 90° swaps its visual width/height but NOT its layout
  // box (background-size/position are computed against the un-rotated
  // layout box). So to make a rotated layer visually fill a cw×ch
  // container, its own layout box must be laid out at ch×cw (swapped),
  // centered, then visually spun into place — at which point it exactly
  // covers the cw×ch container with zero overhang.
  function applyOrientation(layer, cw, ch, rotated) {
    if (rotated) {
      layer.style.width = ch + 'px';
      layer.style.height = cw + 'px';
      layer.style.left = '50%';
      layer.style.top = '50%';
      layer.style.right = 'auto';
      layer.style.bottom = 'auto';
      layer.style.transform = 'translate(-50%, -50%) rotate(90deg)';
    } else {
      layer.style.width = '';
      layer.style.height = '';
      layer.style.left = '';
      layer.style.top = '';
      layer.style.right = '';
      layer.style.bottom = '';
      layer.style.transform = '';
    }
    layer.dataset.rotated = rotated ? 'true' : 'false';
  }

  function initBanner(el) {
    var images = (el.dataset.images || '')
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    if (!images.length) return;

    var logo = el.dataset.logo;
    var interval = parseInt(el.dataset.interval, 10) || 500;
    var zoomMin = parseFloat(el.dataset.zoomMin) || 100;
    var zoomMax = parseFloat(el.dataset.zoomMax) || 106;

    el.innerHTML = '';

    var layer = document.createElement('div');
    layer.className = 'paper-banner-layer is-visible';
    el.appendChild(layer);

    if (logo) {
      var logoImg = document.createElement('img');
      logoImg.src = logo;
      logoImg.alt = el.dataset.logoAlt || 'Axion';
      logoImg.className = 'paper-banner-logo';
      el.appendChild(logoImg);
    }

    // Only ever paint an image that has actually finished downloading —
    // setting background-image on an unloaded URL leaves the layer with
    // nothing to render until it decodes, flashing the container's own
    // background color through for a frame. Track load state per image
    // and skip forward to the next one that's actually ready.
    var imgEls = new Array(images.length);
    var loaded = images.map(function () { return false; });
    var index = -1;
    var painted = false;
    var lastExtra = 1;

    function paintNext() {
      for (var step = 1; step <= images.length; step++) {
        var candidate = (index + step) % images.length;
        if (loaded[candidate]) {
          index = candidate;
          lastExtra = paintLayer(layer, el, imgEls[index], zoomMin, zoomMax);
          painted = true;
          return;
        }
      }
    }

    // Re-fit the currently visible image (same crop position and zoom
    // "character", recomputed size/orientation) whenever the container's
    // rendered box changes — window resize, orientation change, or a
    // responsive layout shift — so coverage stays guaranteed instead of
    // being frozen to the size at paint time.
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (!painted) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var cw = el.clientWidth, ch = el.clientHeight;
        var img = imgEls[index];
        if (!cw || !ch || !img) return;
        var fit = bestFit(cw, ch, img.naturalWidth, img.naturalHeight);
        var scale = fit.scale * lastExtra;
        layer.style.backgroundSize = Math.ceil(img.naturalWidth * scale) + 'px ' + Math.ceil(img.naturalHeight * scale) + 'px';
        applyOrientation(layer, cw, ch, fit.rotated);
      }, 120);
    });

    images.forEach(function (src, i) {
      var img = new Image();
      img.src = src;
      imgEls[i] = img;

      function markReady() {
        loaded[i] = true;
        if (!painted) paintNext();
      }

      // decode() guarantees the image is fully decoded and paintable with
      // zero cost — the plain 'load' event fires once the bytes are in,
      // but some browsers (notably Safari) still pay a decode cost the
      // first time it's actually drawn, which is exactly the flash this
      // is trying to avoid. Fall back to onload where decode() isn't
      // available.
      if (img.decode) {
        img.decode().then(markReady, function () {
          img.onload = markReady;
        });
      } else {
        img.onload = markReady;
      }
    });

    window.setInterval(paintNext, interval);
  }

  function init() {
    document.querySelectorAll('.paper-banner[data-images]').forEach(initBanner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
