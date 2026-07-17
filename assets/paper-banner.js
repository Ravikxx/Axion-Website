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

    images.forEach(function (src) {
      var preload = new Image();
      preload.src = src;
    });

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

    var index = 0;
    paintLayer(layer, images[index], zoomMin, zoomMax);

    function cycle() {
      index = (index + 1) % images.length;
      paintLayer(layer, images[index], zoomMin, zoomMax);
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
