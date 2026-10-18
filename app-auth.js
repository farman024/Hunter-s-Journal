/* Auth/UI adapter. The default config is inert and cannot contact production. */
let privateJournal = null;
let authClient = null;
let verifiedSession = null;
let authGeneration = 0;
let loggingOut = false;
let observedAuthUser = null;

function privateMessage(text) {
  document.getElementById('privateStatus').textContent = text;
  document.getElementById('privateRecovery').hidden = !(privateJournal && privateJournal.userId);
}
function hidePrivateApp() {
  const app = document.getElementById('journalApp');
  app.hidden = true;
  app.inert = true;
  document.getElementById('privateGate').hidden = false;
  state = HJPrivate.emptyState();
  if (equityChartInstance) { equityChartInstance.destroy(); equityChartInstance = null; }
  lastTradeHash = ''; deepAnalyticsCache = null; pendingDelete = null;
  // Account changes hard-reload below: callbacks, form values, images and DOM are never reused.
}
function privatePrefKey(name) {
  if (!privateJournal || !privateJournal.userId || privateJournal.mode !== 'ready') throw new Error('Private journal is locked.');
  return `hj:private:v1:${privateJournal.userId}:preference:${name}`;
}
function privateJournalSave() {
  if (!privateJournal || privateJournal.mode !== 'ready') {
    showToast('Your private journal must be loaded before saving.', 'error'); return;
  }
  try { void privateJournal.save(state); }
  catch (error) { privateMessage(error.message); showToast(error.message, 'error'); }
  scheduleRender();
}
function showPrivateState(value) {
  state = HJPrivate.normalize(value);
  loadSettings();
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeBtn(); performRender(); updateProfileUI();
  document.getElementById('privateGate').hidden = true;
  document.getElementById('journalApp').hidden = false;
  document.getElementById('journalApp').inert = false;
  document.getElementById('signedInEmail').textContent = verifiedSession?.user.email || 'Signed in';
}
function privateSyncStatus(status, message) {
  const labels = { loading: 'Loading your private journal…', pending: 'Private draft pending sync', syncing: 'Syncing…', ok: 'Private journal ready', conflict: 'Another version exists. Export your private draft before choosing “Reload cloud version”.', error: 'Private sync failed. No empty journal was uploaded.' };
  privateMessage(message || labels[status] || 'Sign in to continue.');
  const dot = document.getElementById('syncDot');
  if (dot) { dot.title = labels[status] || status; dot.style.background = status === 'ok' ? '#00e676' : (status === 'error' || status === 'conflict') ? '#ff4444' : '#ffa726'; }
  document.getElementById('privateRecovery').hidden = !(privateJournal && privateJournal.userId);
}
async function acceptPrivateSession(session) {
  const generation = ++authGeneration;
  if (!session) { verifiedSession = null; privateJournal.lock(); privateMessage('Sign in with Google to open your own private journal.'); return; }
  hidePrivateApp();
  privateMessage('Verifying your sign-in…');
  const { data, error } = await authClient.auth.getUser(session.access_token);
  if (generation !== authGeneration || loggingOut) return;
  if (error || !data.user || data.user.id !== session.user.id) {
    privateJournal.lock(); privateMessage('Sign-in could not be verified. Please sign in again.'); return;
  }
  verifiedSession = { ...session, user: data.user };
  await privateJournal.open(verifiedSession);
}
async function bootPrivateJournal() {
  hidePrivateApp();
  const cfg = window.HJ_CONFIG;
  if (!cfg || !cfg.enabled) {
    privateMessage('Local review draft — cloud access is disabled. No live journal or database is being changed.');
    document.getElementById('googleSignIn').disabled = true;
    return;
  }
  try {
    const endpoint = new URL(cfg.supabaseUrl), redirect = new URL(cfg.redirectTo);
    if (!cfg.supabaseAnonKey || !cfg.legacyOwnerId || endpoint.protocol !== 'https:' || redirect.origin !== location.origin || redirect.search || redirect.hash) throw new Error('Configure a test project, exact redirect URL and verified legacy owner UUID first.');
    authClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, storageKey: `hj:private:auth:v1:${endpoint.hostname}:${redirect.pathname}` },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) }
    });
    privateJournal = new HJPrivate.Journal({
      storage: sessionStorage,
      legacyOwnerId: cfg.legacyOwnerId,
      createClient: token => window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        accessToken: async () => token,
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) }
      }),
      onState: showPrivateState, onLock: hidePrivateApp, onStatus: privateSyncStatus
    });
    authClient.auth.onAuthStateChange((event, session) => {
      if (loggingOut) return;
      const nextId = session?.user.id || null;
      // Lock synchronously, before any await. A new JS realm clears pending FileReader/import callbacks.
      if (observedAuthUser && observedAuthUser !== nextId) {
        observedAuthUser = nextId;
        ++authGeneration; privateJournal.lock(); location.reload(); return;
      }
      observedAuthUser = nextId;
      if (event === 'TOKEN_REFRESHED' && privateJournal.userId === nextId) {
        verifiedSession = session; privateJournal.refreshToken(session); return;
      }
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;
      // Supabase warns against awaiting another auth call inside this callback.
      if (event === 'SIGNED_IN' && privateJournal.userId === nextId) return;
      setTimeout(() => {
        if (!loggingOut && observedAuthUser === nextId) void acceptPrivateSession(session);
      }, 0);
    });
    // INITIAL_SESSION drives loading after PKCE callback processing; no competing getSession load.
    privateMessage('Checking sign-in…');
  } catch (error) { privateMessage('Draft configuration is incomplete: ' + error.message); }
}
async function signInPrivateJournal() {
  if (!authClient) return;
  const { error } = await authClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: HJ_CONFIG.redirectTo } });
  if (error) privateMessage('Google sign-in failed. Please try again.');
}
function exportPrivateDraft() {
  if (!verifiedSession || !privateJournal || verifiedSession.user.id !== privateJournal.userId) return;
  try {
    const draft = privateJournal.recoveryText();
    if (!draft) { privateMessage('No unsynced private recovery draft is stored in this tab.'); return; }
    // Preserve the exact bytes, even if a broken/partial recovery record cannot be parsed.
    const blob = new Blob([draft], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'hunters-journal-private-recovery.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) { privateMessage('Recovery export failed: ' + error.message); }
}
async function reloadPrivateCloud() {
  if (!privateJournal || !verifiedSession) return;
  if (!confirm('Discard this tab’s unsynced private draft and load your cloud version? Export the draft first if needed. This does not overwrite the cloud.')) return;
  await privateJournal.discardDraftAndReload(verifiedSession);
}
async function signOutPrivateJournal() {
  if (!authClient || loggingOut) return;
  let hasDraft = false;
  try { hasDraft = !!privateJournal?.recoveryText(); }
  catch (error) { hasDraft = true; }
  if (hasDraft && !confirm('There may be unsynced changes. Export your private draft first if needed. Sign out and remove this tab’s draft?')) return;
  loggingOut = true; ++authGeneration;
  const owner = privateJournal?.userId;
  try {
    if (privateJournal) privateJournal.clearOwnDraft();
    if (owner) {
      const prefix = `hj:private:v1:${owner}:`;
      for (const storage of [localStorage, sessionStorage]) {
        for (const key of Object.keys(storage)) if (key.startsWith(prefix)) storage.removeItem(key);
      }
    }
  } catch (error) { /* Storage failure must not prevent locking or revoking this sign-in. */ }
  if (privateJournal) privateJournal.lock();
  verifiedSession = null; hidePrivateApp(); privateMessage('Signing out…');
  const { error } = await authClient.auth.signOut({ scope: 'local' });
  if (error) { privateMessage('Sign-out could not be completed. The journal is locked; retry sign-out.'); loggingOut = false; return; }
  location.reload();
}
async function restorePrivateBackup() {
  if (!privateJournal || !confirm('Restore your separate private backup? Your current version will become the backup.')) return;
  try { await privateJournal.restoreBackup(); }
  catch (error) { showToast(error.message, 'error'); }
}
async function privateForceSync() {
  if (!privateJournal || privateJournal.mode !== 'ready') { showToast('Sign in and load your journal first.', 'error'); return; }
  const ok = await privateJournal.flush();
  showToast(ok ? 'Sync complete' : 'Sync not confirmed; check recovery.', ok ? 'success' : 'error');
}
