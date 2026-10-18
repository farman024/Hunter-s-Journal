/* Hunter's Journal private sync — local review draft, no embedded credentials. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HJPrivate = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const emptyState = () => ({ accounts: [], activeAccount: null, theme: 'dark', hunterName: '', hunterAvatar: '' });
  function normalize(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !Array.isArray(value.accounts)) throw new Error('Invalid journal; original data has not been replaced.');
    const next = copy(value);
    next.accounts.forEach(a => {
      if (!a || typeof a !== 'object' || a.id == null) throw new Error('Invalid profile.');
      for (const field of ['trades', 'sessions']) {
        if (a[field] == null) a[field] = [];
        if (!Array.isArray(a[field])) throw new Error('Invalid profile collection.');
      }
      if (a.rules == null) a.rules = {};
      if (a.checklists == null) a.checklists = { pre: [], post: [] };
      a.trades.forEach(t => {
        if (!t || typeof t !== 'object') throw new Error('Invalid trade.');
        if (t.timestamp == null) t.timestamp = t.id || 0;
      });
    });
    next.theme = next.theme || 'dark';
    next.hunterName = next.hunterName || '';
    next.hunterAvatar = next.hunterAvatar || '';
    if (next.activeAccount == null) next.activeAccount = null;
    return next;
  }
  function checkRow(row) {
    if (!row || row.schema_version !== 1 || !Number.isSafeInteger(Number(row.revision)) || Number(row.revision) < 1) throw new Error('Unsupported journal version or revision.');
    return { data: normalize(row.data), revision: Number(row.revision) };
  }
  class Journal {
    constructor({ storage, createClient, onState = () => {}, onLock = () => {}, onStatus = () => {}, legacyOwnerId = '' }) {
      Object.assign(this, { storage, createClient, onState, onLock, onStatus, legacyOwnerId });
      this.epoch = 0; this.userId = null; this.client = null; this.mode = 'locked';
      this.revision = 0; this.pending = null; this.activeWrite = null; this.sequence = 0;
    }
    key(id = this.userId) { return `hj:private:v1:${id}:draft`; }
    active(epoch) { return epoch === this.epoch && !!this.userId; }
    readDraft() {
      const text = this.storage.getItem(this.key());
      if (!text) return null;
      const draft = JSON.parse(text);
      if (draft.userId !== this.userId || !Number.isSafeInteger(draft.baseRevision) || draft.baseRevision < 0) throw new Error('Invalid private recovery draft.');
      draft.data = normalize(draft.data);
      return draft;
    }
    remember(data, baseRevision = this.revision) {
      this.storage.setItem(this.key(), JSON.stringify({ userId: this.userId, baseRevision, data, savedAt: new Date().toISOString() }));
    }
    lock() {
      ++this.epoch; this.userId = null; this.client = null; this.mode = 'locked';
      this.pending = null; this.activeWrite = null; this.revision = 0;
      this.onLock();
    }
    clearOwnDraft() { if (this.userId) this.storage.removeItem(this.key()); }
    async open(session) {
      this.lock();
      if (!session || !session.user || !session.access_token) return false;
      const epoch = this.epoch;
      this.userId = session.user.id;
      this.client = this.createClient(session.access_token); // Immutable bearer per request generation.
      this.mode = 'loading'; this.onStatus('loading');
      try {
        const result = await this.client.from('journal_states').select('data,revision,schema_version').eq('user_id', this.userId).eq('slot', 'current').maybeSingle();
        if (!this.active(epoch)) return false;
        if (result.error) throw result.error; // Never turn a permission/network failure into an empty journal.
        const row = result.data ? checkRow(result.data) : null;
        if (!row && this.userId === this.legacyOwnerId) throw new Error('Your existing journal migration is not ready. No empty journal will be created.');
        this.revision = row ? row.revision : 0;
        const draft = this.readDraft(); // Only this verified user's session-scoped data; never legacy keys.
        if (draft && draft.baseRevision !== this.revision) {
          this.mode = 'conflict'; this.onStatus('conflict'); return false;
        }
        this.mode = 'ready';
        this.onState(draft ? draft.data : (row ? row.data : emptyState()));
        if (draft) { this.pending = { data: copy(draft.data), sequence: ++this.sequence }; this.onStatus('pending'); }
        else this.onStatus('ok');
        // New accounts have no row until their first explicit edit. Recovery requires explicit retry.
        return true;
      } catch (error) {
        if (this.active(epoch)) { this.mode = 'error'; this.onStatus('error', error.message || 'Private journal could not be loaded.'); }
        return false;
      }
    }
    refreshToken(session) {
      if (session && session.user.id === this.userId) this.client = this.createClient(session.access_token);
    }
    save(value) {
      if (this.mode !== 'ready' || !this.userId) throw new Error('Sign in and load your private journal before saving.');
      const data = normalize(value);
      this.remember(data); // Fail visibly if recovery storage cannot persist; do not pretend synced.
      this.pending = { data, sequence: ++this.sequence };
      this.onStatus('pending');
      return this.flush();
    }
    flush() {
      if (this.activeWrite) return this.activeWrite;
      if (this.mode !== 'ready' || !this.pending) return Promise.resolve(this.mode === 'ready');
      const epoch = this.epoch;
      const work = this.drain(epoch);
      this.activeWrite = work;
      work.finally(() => { if (this.active(epoch) && this.activeWrite === work) this.activeWrite = null; });
      return work;
    }
    async drain(epoch) {
      while (this.active(epoch) && this.mode === 'ready' && this.pending) {
        const job = this.pending;
        const client = this.client; // Captured token-bound client; never send A's data using B's bearer.
        this.onStatus('syncing');
        try {
          const { data, error } = await client.rpc('save_journal_state', { p_expected_revision: this.revision, p_data: job.data });
          if (!this.active(epoch)) return false;
          if (error) throw error;
          const row = checkRow(Array.isArray(data) ? data[0] : data);
          this.revision = row.revision;
          if (this.pending.sequence === job.sequence) {
            this.pending = null; this.storage.removeItem(this.key());
          } else this.remember(this.pending.data);
          this.onStatus(this.pending ? 'pending' : 'ok');
        } catch (error) {
          if (!this.active(epoch)) return false;
          // Unknown outcomes (including lost successful responses) are not retried automatically.
          // Reload re-reads the server revision and preserves this draft as a recoverable conflict.
          if (error.code === 'PT409' || error.code === '40001' || error.code === '23505') {
            this.mode = 'conflict'; this.onLock(); this.onStatus('conflict');
          } else this.onStatus('error', 'Save not confirmed. Your private draft is retained. Reload to reconcile before retrying.');
          // Lock further writes until a fresh authenticated read establishes server state.
          if (this.mode !== 'conflict') { this.mode = 'error'; this.onLock(); }
          return false;
        }
      }
      return this.active(epoch) && this.mode === 'ready';
    }
    async restoreBackup() {
      if (this.mode !== 'ready' || this.pending || this.activeWrite || this.revision < 1) throw new Error('Finish or recover pending changes before restoring a backup.');
      const epoch = this.epoch, client = this.client;
      this.mode = 'restoring'; this.onLock(); this.onStatus('syncing');
      try {
        const found = await client.from('journal_states').select('data,revision,schema_version').eq('user_id', this.userId).eq('slot', 'backup').maybeSingle();
        if (!this.active(epoch)) return false;
        if (found.error) throw found.error;
        if (!found.data) throw new Error('No private backup exists yet.');
        const backup = checkRow(found.data);
        // Server verifies both revisions and swaps current/backup atomically.
        const { data, error } = await client.rpc('restore_journal_backup', { p_expected_revision: this.revision, p_backup_revision: backup.revision });
        if (!this.active(epoch)) return false;
        if (error) throw error;
        const row = checkRow(Array.isArray(data) ? data[0] : data);
        this.revision = row.revision; this.mode = 'ready'; this.onState(row.data); this.onStatus('ok'); return true;
      } catch (error) {
        if (this.active(epoch)) { this.mode = error.code === 'PT409' || error.code === '40001' ? 'conflict' : 'error'; this.onStatus(this.mode, error.message); }
        return false;
      }
    }
    recovery() { return this.userId ? this.readDraft() : null; }
    recoveryText() { return this.userId ? this.storage.getItem(this.key()) : null; }
    async discardDraftAndReload(session) {
      // Caller must explicitly confirm local discard; this never overwrites the remote row.
      this.clearOwnDraft();
      return this.open(session);
    }
  }
  return { Journal, emptyState, normalize, checkRow };
});
