/* One-time migration from pre-rebrand axion_* localStorage keys to their
 * sennoric_* equivalents. Not deferred, and included first on every page
 * that reads these keys, so it always runs before anything else touches
 * localStorage. Idempotent: no-ops once a sennoric_* key already exists.
 */
;(function () {
  'use strict'
  ;['token', 'email', 'avatar_url', 'chat_model'].forEach(function (key) {
    var newKey = 'sennoric_' + key
    if (localStorage.getItem(newKey) !== null) return
    var oldValue = localStorage.getItem('axion_' + key)
    if (oldValue !== null) localStorage.setItem(newKey, oldValue)
  })
})()
