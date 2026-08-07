/* One-time migration from pre-rebrand axion_* localStorage keys to their
 * sennoric_* equivalents. Not deferred, and included first on every page
 * that reads these keys, so it always runs before anything else touches
 * localStorage. Idempotent: no-ops once a sennoric_* key already exists.
 */
;(function () {
  'use strict'
  ;['token', 'email', 'avatar_url', 'chat_model'].forEach(function (key) {
    var oldKey = 'axion_' + key
    var oldValue = localStorage.getItem(oldKey)
    if (oldValue === null) return
    var newKey = 'sennoric_' + key
    if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, oldValue)
    // Removed so a later logout (which only clears sennoric_* keys) can't
    // have this migration silently restore the old token on next page load.
    localStorage.removeItem(oldKey)
  })
})()
