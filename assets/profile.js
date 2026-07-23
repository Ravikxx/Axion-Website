/* Signed-in profile menu. Include on any page with a top <nav>.
 * Shows an avatar in the top-right when localStorage.axion_token exists;
 * clicking it opens a dropdown (Chat, API Keys, Settings, Admin, Log out).
 * Settings links to /settings — a real page, not a modal.
 */
(function () {
  'use strict'
  var API = 'https://api.amplifiedsmp.org'

  var token = localStorage.getItem('axion_token')
  var email = localStorage.getItem('axion_email') || ''
  if (!token) return // not signed in — leave the default nav (Get started / Sign in)

  var nav = document.querySelector('nav')
  if (!nav) return

  function el(tag, cls, html) {
    var e = document.createElement(tag)
    if (cls) e.className = cls
    if (html != null) e.innerHTML = html
    return e
  }

  // ── Build avatar + menu ──────────────────────────────────────────────
  var wrap = el('div', 'ax-profile')
  var initial = (email.trim()[0] || 'A').toUpperCase()
  var avatar = el('button', 'ax-avatar', initial)
  avatar.setAttribute('aria-label', 'Account menu')
  wrap.appendChild(avatar)

  var menu = el('div', 'ax-menu')
  menu.innerHTML =
    '<div class="ax-menu-head"><div class="ax-hi">Signed in as</div><div class="ax-email"></div></div>' +
    '<div class="ax-menu-group-label">Navigate</div>' +
    '<a class="ax-menu-item" href="/chat">Chat</a>' +
    '<a class="ax-menu-item" href="/keys">API Keys</a>' +
    '<div class="ax-menu-group-label">Account</div>' +
    '<a class="ax-menu-item" href="/settings">Settings</a>' +
    '<div class="ax-admin-slot"></div>' +
    '<div class="ax-menu-sep"></div>' +
    '<button class="ax-menu-item danger" data-act="logout">Log out</button>'
  menu.querySelector('.ax-email').textContent = email || 'your account'
  wrap.appendChild(menu)

  // Place in nav-right if present, else push to the right of the nav.
  var navRight = nav.querySelector('.nav-right')
  if (navRight) {
    var getStarted = navRight.querySelector('.nav-btn')
    if (getStarted) getStarted.classList.add('ax-hidden') // already signed in
    navRight.appendChild(wrap)
  } else {
    wrap.style.marginLeft = 'auto'
    nav.appendChild(wrap)
  }

  // ── Toggle menu ──────────────────────────────────────────────────────
  function closeMenu() { menu.classList.remove('open') }
  avatar.addEventListener('click', function (e) {
    e.stopPropagation()
    menu.classList.toggle('open')
  })
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) closeMenu()
  })
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu() })

  // ── Admin link (only if the user is an admin) ────────────────────────
  fetch(API + '/admin/check', { headers: { Authorization: 'Bearer ' + token } })
    .then(function (r) { return r.json() })
    .then(function (d) {
      if (d && d.admin) {
        var a = el('a', 'ax-menu-item', 'Admin')
        a.href = '/admin'
        menu.querySelector('.ax-admin-slot').appendChild(a)
      }
    })
    .catch(function () {})

  // ── Actions ──────────────────────────────────────────────────────────
  menu.addEventListener('click', function (e) {
    var item = e.target.closest('[data-act]')
    if (!item) return
    if (item.dataset.act === 'logout') {
      localStorage.removeItem('axion_token')
      localStorage.removeItem('axion_email')
      location.href = '/'
    }
  })
})()
