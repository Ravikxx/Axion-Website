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

  /* Irregular, jagged closed polygon inside a 0-100% box — reads as a
     torn-paper edge rather than a smooth blob. */
  function tornClipPath(baseRadius, jag) {
    var points = 16 + Math.floor(rand(0, 6));
    var out = [];
    for (var i = 0; i < points; i++) {
      var angle = (i / points) * Math.PI * 2;
      var r = baseRadius + rand(-jag, jag);
      if (Math.random() < 0.3) r -= jag * 1.4;
      var x = 50 + r * Math.cos(angle);
      var y = 50 + r * Math.sin(angle) * 0.82;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      out.push(x.toFixed(1) + '% ' + y.toFixed(1) + '%');
    }
    return 'polygon(' + out.join(', ') + ')';
  }

  function paintRip(rim, hole) {
    rim.style.clipPath = tornClipPath(47, 9);
    hole.style.clipPath = tornClipPath(39, 8);
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

    images.forEach(function (src) {
      var preload = new Image();
      preload.src = src;
    });

    el.innerHTML = '';

    var layer = document.createElement('div');
    layer.className = 'paper-banner-layer is-visible';
    el.appendChild(layer);

    var rip = document.createElement('div');
    rip.className = 'paper-banner-rip';
    var ripRim = document.createElement('div');
    ripRim.className = 'paper-banner-rip-rim';
    var ripHole = document.createElement('div');
    ripHole.className = 'paper-banner-rip-hole';
    rip.appendChild(ripRim);
    rip.appendChild(ripHole);
    el.appendChild(rip);

    if (logo) {
      var logoImg = document.createElement('img');
      logoImg.src = logo;
      logoImg.alt = el.dataset.logoAlt || 'Axion';
      logoImg.className = 'paper-banner-logo';
      el.appendChild(logoImg);
    }

    var index = 0;
    paintLayer(layer, images[index], zoomMin, zoomMax);
    paintRip(ripRim, ripHole);

    function cycle() {
      index = (index + 1) % images.length;
      paintLayer(layer, images[index], zoomMin, zoomMax);
      paintRip(ripRim, ripHole);
    }

    window.setInterval(cycle, interval);
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
