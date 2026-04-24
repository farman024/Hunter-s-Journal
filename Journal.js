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
        if (window.showToast) showToast("TRADE SYNCED TO CLOUD");
    } catch (error) {
        console.error("Cloud Error:", error);
        if (window.showToast) showToast("CLOUD ERROR: SAVED LOCALLY");
    }
}

// ─── JOURNAL LOGGING LOGIC ─────────────────────────────────────
// This overrides the internal addTrade logic to include the Cloud Sync
window.submitHunterTrade = async function() {
    // 1. Get values from your HTML inputs
    const pair = document.getElementById('pairInput')?.value;
    const action = document.getElementById('actionSelect')?.value;
    const outcome = document.getElementById('outcomeSelect')?.value;
    const pnl = document.getElementById('pnlInput')?.value;
    const notes = document.getElementById('tradeNotes')?.value;

    // Validation
    if (!pair || pair === "") {
        if (window.showToast) showToast("SELECT A TARGET PAIR");
        return;
    }

    const tradeData = {
        trade_pair: pair,
        action: action,
        outcome: outcome,
        net_pnl: parseFloat(pnl) || 0,
        notes: notes
    };

    // 2. Immediate Cloud Push
    await syncTradeToCloud(tradeData);

    // 3. Trigger the UI internal save (the 'addTrade' logic in your HTML)
    // We call the original function if it exists, or refresh the UI
    if (typeof addTrade === 'function') {
        addTrade(); 
    } else {
        // Fallback: Clear notes and close modal manually
        localStorage.removeItem('journal_notes_draft');
        if (window.closeTradeModal) closeTradeModal();
        if (window.load) load();
    }
};

// ─── LOCAL PERSISTENCE (Anti-Vanish) ───────────────────────────
// Saves your notes as you type so they don't disappear if the phone sleeps
function initDraftProtection() {
    const notesArea = document.getElementById('tradeNotes');
    if (!notesArea) return;

    // Load existing draft if any
    const savedDraft = localStorage.getItem('journal_notes_draft');
    if (savedDraft) notesArea.value = savedDraft;

    // Save on every input (keystroke)
    notesArea.addEventListener('input', (e) => {
        localStorage.setItem('journal_notes_draft', e.target.value);
    });
}

// ─── INITIALIZATION ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initDraftProtection();
    console.log("Hunter's Journal: Cloud Link Armed.");
    
    // Optional: Re-bind the Submit button in the modal to our new function
    const submitBtn = document.querySelector('.modal-footer .btn-primary');
    if (submitBtn) {
        submitBtn.setAttribute('onclick', 'submitHunterTrade()');
    }
});
