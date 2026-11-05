// Auth guard — call checkAuth() at the top of every page's script.
// If no PIN set + no GH credentials → lock.html handles first-time setup.
// If PIN is set but session not unlocked → redirect to lock.html.
// Once unlocked, sessionStorage flag keeps you in until app is closed.

function checkAuth() {
  const pin       = localStorage.getItem('app_pin');
  const unlocked  = sessionStorage.getItem('lock_unlocked');
  const ghReady   = !!(localStorage.getItem('gh_token') &&
                       localStorage.getItem('gh_owner') &&
                       localStorage.getItem('gh_repo'));

  // Already unlocked this session — allow through
  if (unlocked === '1') return;

  // No PIN and no GH config → first-ever launch, settings will handle it
  if (!pin && !ghReady) {
    sessionStorage.setItem('lock_unlocked', '1');
    return;
  }

  // PIN not yet set but GH is ready → lock.html will prompt to create PIN
  // OR PIN is set → need to verify → either way, go to lock.html
  sessionStorage.setItem('lock_dest', window.location.pathname.split('/').pop() || 'index.html');
  window.location.replace('lock.html');
}
