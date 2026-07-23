/* One source of truth for Veil's scheduled deprecation and retirement state. */
(function () {
  'use strict'

  var deprecatedAt = new Date('2026-07-25T00:00:00Z')
  var retiredAt = new Date('2026-07-30T00:00:00Z')
  var now = new Date()
  var state = now >= retiredAt ? 'retired' : now >= deprecatedAt ? 'deprecated' : 'migrating'

  var copy = {
    migrating: {
      short: 'migrating · back soon',
      page: 'Veil is migrating now; deprecates July 25 and retires July 30, 2026.',
      description: 'Our first and fastest model — a fine-tuned Llama 3.1 3B for quick general chat.',
    },
    deprecated: {
      short: 'deprecated',
      page: 'Veil is deprecated — still usable until it retires July 30, 2026.',
      description: 'Our first and fastest model — a fine-tuned Llama 3.1 3B for quick general chat. Deprecated as of July 25, 2026 and retiring July 30 — still usable until then, but no longer actively developed.',
    },
    retired: {
      short: 'retired',
      page: 'Veil is retired as of July 30, 2026.',
      description: 'Our first and fastest model — a fine-tuned Llama 3.1 3B for quick general chat. Retired July 30, 2026 — kept here as a memory: Axion’s first model, and the reason Lumen exists.',
    },
  }[state]

  var homeStatus = document.getElementById('veil-status')
  if (homeStatus && state !== 'migrating') {
    homeStatus.innerHTML = '<span class="led down"></span> ' + copy.short
  }

  var badge = document.getElementById('veil-badge')
  if (badge && state !== 'migrating') {
    badge.textContent = state === 'retired' ? 'Retired' : 'Deprecated'
    badge.className = 'badge badge-paid'
  }

  var description = document.getElementById('veil-desc')
  if (description && state !== 'migrating') description.textContent = copy.description

  var pageStatus = document.getElementById('status-text')
  if (pageStatus && document.getElementById('status-line')) pageStatus.textContent = copy.page
})()
