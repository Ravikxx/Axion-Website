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
 */
(function () {
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function paintLayer(layer, container, imgEl, zoomMin, zoomMax) {
    var cw = container.clientWidth, ch = container.clientHeight;
    var nw = imgEl.naturalWidth, nh = imgEl.naturalHeight;
    var posX = rand(20, 80);
    var posY = rand(20, 80);

    layer.style.backgroundImage = 'url(' + imgEl.src + ')';
    layer.style.backgroundPosition = posX + '% ' + posY + '%';

    if (cw && ch && nw && nh) {
      var coverScale = Math.max(cw / nw, ch / nh);   // CSS `cover` formula
      var extra = rand(zoomMin, zoomMax) / 100;        // >= 1: crop in only
      var scale = coverScale * Math.max(extra, 1);
      layer.style.backgroundSize = Math.ceil(nw * scale) + 'px ' + Math.ceil(nh * scale) + 'px';
    } else {
      // Dimensions not measurable yet (shouldn't happen post-load) — a
      // generous percentage still beats leaving no size at all.
      layer.style.backgroundSize = '160%';
    }

    layer.dataset.currentImg = imgEl.src;
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

    function paintNext() {
      for (var step = 1; step <= images.length; step++) {
        var candidate = (index + step) % images.length;
        if (loaded[candidate]) {
          index = candidate;
          paintLayer(layer, el, imgEls[index], zoomMin, zoomMax);
          painted = true;
          return;
        }
      }
    }

    // Re-fit the currently visible image (same crop position, recomputed
    // size) whenever the container's rendered box changes — window resize,
    // orientation change, or a responsive layout shift — so coverage stays
    // guaranteed instead of being frozen to the size at paint time.
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (!painted) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var cw = el.clientWidth, ch = el.clientHeight;
        var img = imgEls[index];
        if (!cw || !ch || !img) return;
        var coverScale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        layer.style.backgroundSize = Math.ceil(img.naturalWidth * coverScale) + 'px ' + Math.ceil(img.naturalHeight * coverScale) + 'px';
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
