/* Shared navigation behavior for public Axion pages.
 * Older pages place their links directly inside <nav>; newer pages use a
 * .nav-links wrapper. Normalize the older markup at runtime so every mobile
 * menu uses the same full-height drawer from mobile.css.
 */
(function () {
  'use strict'

  var nav = document.querySelector('body > nav')
  if (!nav) return

  var toggle = nav.querySelector('.hamburger-nav')
  if (!toggle) return

  var links = nav.querySelector(':scope > .nav-links')
  if (!links) {
    links = document.createElement('div')
    links.className = 'nav-links'
    links.dataset.axGenerated = 'true'
    links.style.display = 'flex'
    links.style.alignItems = 'center'
    links.style.gap = 'inherit'

    var brand = nav.querySelector(':scope > .brand, :scope > .nav-logo')
    var movable = Array.from(nav.children).filter(function (child) {
      return child.tagName === 'A' && child !== brand
    })
    movable.forEach(function (link) { links.appendChild(link) })
    if (brand) brand.insertAdjacentElement('afterend', links)
    else nav.insertBefore(links, nav.firstChild)
  }

  toggle.setAttribute('aria-expanded', 'false')

  function setOpen(open) {
    nav.classList.toggle('nav-links-visible', open)
    toggle.setAttribute('aria-expanded', String(open))
    document.documentElement.classList.toggle('ax-nav-open', open)
  }

  window.toggleNav = function () {
    setOpen(!nav.classList.contains('nav-links-visible'))
  }

  document.addEventListener('click', function (event) {
    if (!nav.contains(event.target)) setOpen(false)
  })
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      setOpen(false)
      toggle.focus()
    }
  })
})()
