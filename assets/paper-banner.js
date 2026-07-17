/* Paper banner — reusable "logo on textured paper" masthead.
 *
 * Markup template (copy this to reuse elsewhere, just swap data-images):
 *
 *   <div class="paper-banner"
 *        data-images="/assets/paper/paper-1.jpg,/assets/paper/paper-2.jpg"
 *        data-logo="/assets/logo-axion-new.png"
 *        data-interval="500"
 *        data-zoom-min="115"
 *        data-zoom-max="155"></div>
 *
 * Each cycle advances to the next image in data-images (looping back to
 * the first, or re-cropping the same one if only one is given) and snaps
 * to a new random crop (zoom % + position) for it — an instant cut, not
 * a fade.
 */
(function () {
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function paintLayer(layer, src, zoomMin, zoomMax) {
    var zoom = rand(zoomMin, zoomMax);
    var posX = rand(20, 80);
    var posY = rand(20, 80);
    layer.style.backgroundImage = 'url(' + src + ')';
    layer.style.backgroundSize = zoom + '%';
    layer.style.backgroundPosition = posX + '% ' + posY + '%';
  }

  function initBanner(el) {
    var images = (el.dataset.images || '')
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    if (!images.length) return;

    var logo = el.dataset.logo;
    var interval = parseInt(el.dataset.interval, 10) || 500;
    var zoomMin = parseFloat(el.dataset.zoomMin) || 115;
    var zoomMax = parseFloat(el.dataset.zoomMax) || 155;

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
    var loaded = images.map(function () { return false; });
    var index = -1;
    var painted = false;

    function paintNext() {
      for (var step = 1; step <= images.length; step++) {
        var candidate = (index + step) % images.length;
        if (loaded[candidate]) {
          index = candidate;
          paintLayer(layer, images[index], zoomMin, zoomMax);
          painted = true;
          return;
        }
      }
    }

    images.forEach(function (src, i) {
      var img = new Image();
      img.src = src;

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
