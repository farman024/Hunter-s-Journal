/* Offline shell only: never an offline identity or journal-data fallback. */
(function () {
  'use strict';
  const onlineBoot = bootPrivateJournal;
  const onlineAccept = acceptPrivateSession;
  const onlineSignIn = signInPrivateJournal;
  let offlineLocked = false;
  let booted = false;
  const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
  const node = id => document.getElementById(id);
  function offlineNotice(message) {
    node('offlineShellNotice').hidden = false;
    node('offlineShellMessage').textContent = message;
    node('googleSignIn').disabled = true;
    privateMessage(message);
  }
  function lockOfflineShell() {
    offlineLocked = true;
    ++authGeneration; // Any verification already in flight must not unlock the UI.
    if (privateJournal) privateJournal.lock(); // Does not delete stored recovery drafts.
    verifiedSession = null;
    hidePrivateApp();
    offlineNotice(isOffline() ? 'You’re offline. Connect to open your private journal.' : 'Connection restored. Select “Retry connection” to verify sign-in and open your private journal.');
  }
  bootPrivateJournal = async function () {
    booted = true;
    if (isOffline()) { lockOfflineShell(); return; }
    offlineLocked = false;
    node('offlineShellNotice').hidden = true;
    await onlineBoot();
  };
  acceptPrivateSession = async function (session) {
    if (isOffline() || offlineLocked) { lockOfflineShell(); return; }
    await onlineAccept(session); // Original server verification + owner-only cloud read.
    if (isOffline() || offlineLocked) lockOfflineShell();
  };
  signInPrivateJournal = async function () {
    if (isOffline() || offlineLocked) { lockOfflineShell(); return; }
    return onlineSignIn();
  };
  window.retryPrivateShell = function () {
    if (isOffline()) { lockOfflineShell(); return; }
    // Explicit same-tab reload preserves sessionStorage drafts. No sync, discard or logout.
    location.reload();
  };
  window.addEventListener('offline', () => { if (booted) lockOfflineShell(); });
  window.addEventListener('online', () => {
    if (offlineLocked) offlineNotice('Connection restored. Select “Retry connection” to verify sign-in and open your private journal.');
  });
})();
