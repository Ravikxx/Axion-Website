(function () {
  'use strict'

  var body = document.body
  var sidebar = document.querySelector('.sidebar')
  var topbar = document.querySelector('.topbar')
  if (!body || !sidebar || !topbar) return
  var mobileQuery = window.matchMedia('(max-width: 768px)')

  if (!sidebar.id) sidebar.id = 'account-sidebar'
  sidebar.classList.add('account-mobile-drawer')

  var menu = document.createElement('button')
  menu.type = 'button'
  menu.className = 'account-mobile-menu'
  menu.setAttribute('aria-label', 'Open account navigation')
  menu.setAttribute('aria-controls', sidebar.id)
  menu.setAttribute('aria-expanded', 'false')
  menu.innerHTML = '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  topbar.insertBefore(menu, topbar.firstChild)

  var backdrop = document.createElement('button')
  backdrop.type = 'button'
  backdrop.className = 'account-sidebar-backdrop'
  backdrop.setAttribute('aria-label', 'Close account navigation')
  body.appendChild(backdrop)

  function setOpen(open) {
    body.classList.toggle('ax-account-nav-open', open)
    menu.setAttribute('aria-expanded', String(open))
    menu.setAttribute('aria-label', open ? 'Close account navigation' : 'Open account navigation')
    sidebar.inert = mobileQuery.matches && !open
    if (open) {
      var firstLink = sidebar.querySelector('a, button')
      if (firstLink) requestAnimationFrame(function () { firstLink.focus() })
    }
  }

  menu.addEventListener('click', function () {
    setOpen(!body.classList.contains('ax-account-nav-open'))
  })
  backdrop.addEventListener('click', function () {
    setOpen(false)
    menu.focus()
  })
  sidebar.addEventListener('click', function (event) {
    if (event.target.closest('a, .nav-item, .org-nav-item')) setOpen(false)
  })
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !body.classList.contains('ax-account-nav-open')) return
    setOpen(false)
    menu.focus()
  })
  mobileQuery.addEventListener('change', function () {
    setOpen(false)
  })
  setOpen(false)
})()
