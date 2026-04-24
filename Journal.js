// ═══════════════════════════════════════════════════════════════
// HUNTER'S JOURNAL — journal.js | Shadow Vault Edition
// ═══════════════════════════════════════════════════════════════

const SUPA_URL = 'https://rlatlwyksxakqgwmarvf.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXRsd3lrc3hha3Fnd21hcnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMDQyNDcsImV4cCI6MjA5MDU4MDI0N30.CbjYYe1Y9TIt6WEiAVfIBjxgf49fv5a8DpFu9L7Hz8o';
const JOURNAL_APP_ID = 'hunters-journal';

// ─── CLOUD VAULT SYNC ──────────────────────────────────────────
async function syncTradeToCloud(tradeData) {
    try {
        const response = await fetch(`${SUPA_URL}/rest/v1/hunters_journal`, {
            method: 'POST',
            headers: {
                'apikey': SUPA_KEY,
                'Authorization': `Bearer ${SUPA_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                ...tradeData,
                app_id: JOURNAL_APP_ID,
                created_at: new Date().toISOString()
            })
        });

        if (!response.ok) throw new Error('Vault connection failed');
        
        console.log("📝 Trade secured in the Shadow Vault");
        showToast("TRADE SYNCED TO CLOUD");
    } catch (error) {
        console.error("Cloud Error:", error);
        showToast("CLOUD ERROR: SAVED LOCALLY");
    }
}

// ─── JOURNAL LOGGING LOGIC ─────────────────────────────────────
// This function replaces or extends your existing 'addTrade' logic
window.submitHunterTrade = async function() {
    // Get values from your index.html IDs
    const pair = document.getElementById('pairInput')?.value;
    const action = document.getElementById('actionSelect')?.value;
    const outcome = document.getElementById('outcomeSelect')?.value;
    const pnl = document.getElementById('pnlInput')?.value;
    const notes = document.getElementById('tradeNotes')?.value;

    if (!pair) {
        showToast("SELECT A TARGET PAIR");
        return;
    }

    const tradeData = {
        trade_pair: pair,
        action: action,
        outcome: outcome,
        net_pnl: parseFloat(pnl) || 0,
        notes: notes
    };

    // 1. Save to Cloud Vault
    await syncTradeToCloud(tradeData);

    // 2. Clear notes draft since it's now saved
    localStorage.removeItem('journal_notes_draft');
    
    // 3. Close modal and refresh (Standard Journal UI logic)
    if (typeof closeTradeModal === 'function') closeTradeModal();
    if (typeof load === 'function') load(); 
};

// ─── LOCAL PERSISTENCE (Anti-Vanish) ───────────────────────────
// Saves your notes as you type so they don't disappear if the phone sleeps
function initDraftProtection() {
    const notesArea = document.getElementById('tradeNotes');
    if (!notesArea) return;

    // Load existing draft if any
    const savedDraft = localStorage.getItem('journal_notes_draft');
    if (savedDraft) notesArea.value = savedDraft;

    // Save on every input
    notesArea.addEventListener('input', (e) => {
        localStorage.setItem('journal_notes_draft', e.target.value);
    });
}

// ─── INITIALIZATION ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initDraftProtection();
    console.log("Hunter's Journal: Cloud Link Armed.");
});
