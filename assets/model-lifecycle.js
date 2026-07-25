/* One source of truth for Veil's scheduled deprecation and retirement state.
 *
 * Exposes window.AxionModelLifecycle so pages that build their model list in
 * JavaScript (chat.html) can read the same state the static pages render, and
 * applies the DOM updates for pages that mark up the model card server-side
 * (index.html, models.html, veil.html).
 *
 * Safe to load with or without `defer`, in <head> or at the end of <body>: the
 * state is published synchronously, and the DOM work waits for parsing to
 * finish if it hasn't already.
 */
(function () {
  'use strict'

  var deprecatedAt = new Date('2026-07-25T00:00:00Z')
  var retiredAt = new Date('2026-07-30T00:00:00Z')
  var now = new Date()
  var state = now >= retiredAt ? 'retired' : now >= deprecatedAt ? 'deprecated' : 'migrating'

  var copy = {
    migrating: {
      short: 'migrating · back soon',
      badge: 'Free',
      page: 'Veil is migrating now; deprecates July 25 and retires July 30, 2026.',
      description: 'Our first and fastest model — a fine-tuned Llama 3.1 3B for quick general chat.',
      chatDescription: 'Legacy 3B model built for quick, lightweight conversations.',
    },
    deprecated: {
      short: 'deprecated',
      badge: 'Deprecated',
      page: 'Veil is deprecated — still usable until it retires July 30, 2026.',
      description: 'Our first and fastest model — a fine-tuned Llama 3.1 3B for quick general chat. Deprecated as of July 25, 2026 and retiring July 30 — still usable until then, but no longer actively developed.',
      chatDescription: 'Deprecated 3B model — retiring July 30, 2026. Use Lumen instead.',
    },
    retired: {
      short: 'retired',
      badge: 'Retired',
      page: 'Veil is retired as of July 30, 2026.',
      description: 'Our first and fastest model — a fine-tuned Llama 3.1 3B for quick general chat. Retired July 30, 2026 — kept here as a memory: Axion’s first model, and the reason Lumen exists.',
      chatDescription: 'Retired July 30, 2026. Use Lumen instead.',
    },
  }[state]

  // Published before any DOM work so inline scripts can read it immediately.
  window.AxionModelLifecycle = {
    veil: {
      state: state,
      isRetired: state === 'retired',
      isDeprecated: state === 'deprecated' || state === 'retired',
      shortStatus: copy.short,
      badge: copy.badge,
      description: copy.description,
      chatDescription: copy.chatDescription,
      deprecatedAt: deprecatedAt,
      retiredAt: retiredAt,
    },
  }

  function apply() {
    var homeStatus = document.getElementById('veil-status')
    if (homeStatus && state !== 'migrating') {
      homeStatus.innerHTML = '<span class="led down"></span> ' + copy.short
    }

    var badge = document.getElementById('veil-badge')
    if (badge && state !== 'migrating') {
      badge.textContent = copy.badge
      badge.className = 'badge badge-paid'
    }

    var description = document.getElementById('veil-desc')
    if (description && state !== 'migrating') description.textContent = copy.description

    var pageStatus = document.getElementById('status-text')
    if (pageStatus && document.getElementById('status-line')) pageStatus.textContent = copy.page
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply)
  else apply()
})()
