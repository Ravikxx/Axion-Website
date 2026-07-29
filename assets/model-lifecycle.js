/* One source of truth for Veil's deprecation, outage, and retirement state.
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

  var deprecatedAt = new Date('2026-07-25T00:00:00Z')  // marked deprecated
  var returnsAt = new Date('2026-07-30T00:00:00Z')     // compute frees up, back online
  var retiredAt = new Date('2026-08-17T00:00:00Z')     // final shutdown
  var now = new Date()

  // Veil went offline early: the compute it ran on is committed to the Crucible
  // 600M rerun, so it is unavailable between being deprecated and returning on
  // July 30. It then runs until it retires for good on August 17.
  var state = now >= retiredAt ? 'retired'
    : now >= returnsAt ? 'deprecated'
    : now >= deprecatedAt ? 'offline'
    : 'migrating'

  var copy = {
    migrating: {
      short: 'migrating · back soon',
      badge: 'Free',
      page: 'Veil is migrating now; deprecates July 25 and retires August 17, 2026.',
      description: 'A fine-tuned Llama 3.1 3B. Our first model, and still the fastest for short chats.',
      chatDescription: 'Legacy 3B model built for quick, lightweight conversations.',
    },
    offline: {
      short: 'offline · back July 30',
      badge: 'Offline',
      page: 'Veil is deprecated and temporarily offline. It returns July 30 and retires August 17, 2026.',
      description: 'A fine-tuned Llama 3.1 3B. Our first model, and still the fastest for short chats. Deprecated on July 25, 2026, and offline while its compute is committed elsewhere. Back July 30, retiring August 17.',
      chatDescription: 'Offline until July 30, 2026 and retiring August 17. Use Lumen instead.',
    },
    deprecated: {
      short: 'deprecated · retires Aug 17',
      badge: 'Deprecated',
      page: 'Veil is deprecated but still usable until it retires August 17, 2026.',
      description: 'A fine-tuned Llama 3.1 3B. Our first model, and still the fastest for short chats. Deprecated on July 25, 2026 and retiring August 17. Still usable until then, but no longer actively developed.',
      chatDescription: 'Deprecated 3B model, retiring August 17, 2026. Use Lumen instead.',
    },
    retired: {
      short: 'retired',
      badge: 'Retired',
      page: 'Veil is retired as of August 17, 2026.',
      description: 'A fine-tuned Llama 3.1 3B. Our first model, and still the fastest for short chats. Retired on August 17, 2026, and kept here as a record of Axion’s first model and the reason Lumen exists.',
      chatDescription: 'Retired August 17, 2026. Use Lumen instead.',
    },
  }[state]

  // Published before any DOM work so inline scripts can read it immediately.
  window.AxionModelLifecycle = {
    veil: {
      state: state,
      isRetired: state === 'retired',
      isOffline: state === 'offline',
      isDeprecated: state !== 'migrating',
      shortStatus: copy.short,
      badge: copy.badge,
      description: copy.description,
      chatDescription: copy.chatDescription,
      deprecatedAt: deprecatedAt,
      returnsAt: returnsAt,
      retiredAt: retiredAt,
    },
  }

  function apply() {
    var homeStatus = document.getElementById('veil-status')
    if (homeStatus && state !== 'migrating') {
      homeStatus.innerHTML = '<span class="led down"></span> ' + copy.short
    }

    // Swap only the state modifier — models.html bases its pill on .badge and
    // docs.html on .model-card-badge, so overwriting className wholesale would
    // strip one page's styling to suit the other's.
    var badge = document.getElementById('veil-badge')
    if (badge && state !== 'migrating') {
      badge.textContent = copy.badge
      badge.classList.remove('badge-free', 'badge-key', 'badge-freetier')
      badge.classList.add('badge-paid')
    }

    var description = document.getElementById('veil-desc')
    if (description && state !== 'migrating') description.textContent = copy.description

    var pageStatus = document.getElementById('status-text')
    if (pageStatus && document.getElementById('status-line')) pageStatus.textContent = copy.page
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply)
  else apply()
})()
