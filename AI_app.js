// Constantes et clés de stockage
const LS_KEY = 'gemini_api_key';
const LS_HISTORY = 'gemini_chat_history_v2';
const LS_THEME = 'gemini_theme';
const LS_MODEL = 'gemini_model';
const LS_PREPROMPT = 'gemini_preprompt';

// Éléments UI
const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('chatForm');
const inputEl = document.getElementById('userInput');
const clearBtn = document.getElementById('clearBtn');
const changeKeyBtn = document.getElementById('changeKeyBtn');
const tpl = document.getElementById('messageTemplate');
const apiKeyDialog = document.getElementById('apiKeyDialog');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const themeSelect = document.getElementById('themeSelect');
const modelSelect = document.getElementById('modelSelect');
const prepromptList = document.getElementById('prepromptList');

// Préprompts (sélection unique)
const PREPROMPTS = [
  { id: 'none', label: 'Aucun', text: '' },
  { id: 'concise', label: 'Assistant concis', text: 'Réponds de manière concise et précise, sans digressions inutiles.' },
  { id: 'step', label: 'Pas à pas', text: 'Explique ta démarche étape par étape de façon pédagogique.' },
  { id: 'teach', label: 'Professeur', text: 'Agis comme un excellent professeur: clair, structuré, avec des exemples.' },
  { id: 'code', label: 'Code commenté', text: 'Fournis du code propre et bien commenté, avec des explications succinctes.' },
  { id: 'brain', label: 'Brainstorming', text: 'Propose plusieurs pistes créatives, classées par intérêt et faisabilité.' }
];

// Chargement / Sauvegarde localStorage
function getApiKey() { return localStorage.getItem(LS_KEY) || ''; }
function setApiKey(k) { localStorage.setItem(LS_KEY, k.trim()); }
function clearApiKey() { localStorage.removeItem(LS_KEY); }

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch { return []; }
}
function saveHistory(h) { localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }

function getTheme() { return localStorage.getItem(LS_THEME) || 'classic'; }
function setTheme(t) { localStorage.setItem(LS_THEME, t); document.documentElement.setAttribute('data-theme', t); }

function getModel() { return localStorage.getItem(LS_MODEL) || 'gemini-2.5-flash-lite'; }
function setModel(m) { localStorage.setItem(LS_MODEL, m); }

function getPrepromptId() { return localStorage.getItem(LS_PREPROMPT) || 'none'; }
function setPrepromptId(id) { localStorage.setItem(LS_PREPROMPT, id); }

// État
let history = loadHistory(); // [{role:'user'|'model', parts:[{text}], meta?:true}]
let currentPrepromptId = getPrepromptId();

// Rendu des messages
function appendMessage(role, text, isLoading=false) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role === 'user' ? 'user' : 'model');
  const bubble = node.querySelector('.bubble');
  if (isLoading) {
    bubble.innerHTML = `
      <span class="loading">
        <span>Le modèle rédige</span>
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </span>
    `;
  } else {
    bubble.textContent = text;
  }
  messagesEl.appendChild(node);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return node;
}

function renderAll() {
  messagesEl.innerHTML = '';
  for (const msg of history) {
    const text = (msg.parts || []).map(p => p.text || '').join('');
    // On n’affiche pas la bulle des "consignes" meta pour garder un fil visuel propre
    if (msg.meta) continue;
    appendMessage(msg.role, text);
  }
}

// Préprompts UI
function renderPreprompts() {
  prepromptList.innerHTML = '';
  const activeId = getPrepromptId();
  for (const p of PREPROMPTS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (p.id === activeId ? ' active' : '');
    chip.textContent = p.label;
    chip.setAttribute('role', 'option');
    chip.setAttribute('aria-selected', p.id === activeId ? 'true' : 'false');
    chip.addEventListener('click', () => {
      setPrepromptId(p.id);
      renderPreprompts();
    });
    prepromptList.appendChild(chip);
  }
}

// Initialisations UI
setTheme(getTheme());
themeSelect.value = getTheme();
themeSelect.addEventListener('change', () => setTheme(themeSelect.value));

modelSelect.value = getModel();
modelSelect.addEventListener('change', () => setModel(modelSelect.value));

renderPreprompts();
renderAll();

// Gestion clé API
function requireApiKey() {
  if (!getApiKey()) {
    apiKeyInput.value = '';
    apiKeyDialog.showModal();
  }
}
requireApiKey();

saveKeyBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  const key = apiKeyInput.value.trim();
  if (key) {
    setApiKey(key);
    apiKeyDialog.close();
  }
});
changeKeyBtn?.addEventListener('click', () => {
  apiKeyInput.value = getApiKey();
  apiKeyDialog.showModal();
});

// Effacer historique
clearBtn?.addEventListener('click', () => {
  history = [];
  saveHistory(history);
  renderAll();
  appendMessage('model', 'Historique effacé.');
});

// Construction de l’URL REST pour generateContent (v1beta)
function getApiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

// Appel REST generateContent
async function sendToGemini(apiKey, model, contents) {
  const res = await fetch(getApiUrl(model), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({ contents }),
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err?.error?.message) detail = err.error.message;
    } catch {}
    throw new Error(detail);
  }
  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map(p => p.text || '').join('') || '(Réponse vide)';
  return text;
}

// Injection des consignes (préprompt) en tête de conversation
function maybeInjectPreprompt() {
  const id = getPrepromptId();
  const def = PREPROMPTS.find(p => p.id === id);
  const txt = def?.text?.trim();
  if (!txt) return;
  const hasMeta = history.some(m => m.meta === true);
  if (!hasMeta) {
    history.push({ role: 'user', parts: [{ text: `Consignes: ${txt}` }], meta: true });
  }
}

// Envoi message
formEl?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiKey = getApiKey();
  if (!apiKey) { requireApiKey(); return; }

  const userText = inputEl.value.trim();
  if (!userText) return;

  const model = getModel();

  // Ajoute message utilisateur visible
  const userMsg = { role: 'user', parts: [{ text: userText }] };
  history.push(userMsg);
  saveHistory(history);
  appendMessage('user', userText);
  inputEl.value = '';

  // Placeholder chargement
  const loadingNode = appendMessage('model', '', true);

  try {
    // Injecter préprompt si nécessaire (au début)
    maybeInjectPreprompt();

    // Appeler l’API avec tout l’historique (y compris meta)
    const replyText = await sendToGemini(apiKey, model, history);

    // Remplacer le placeholder
    loadingNode.querySelector('.bubble').textContent = replyText;

    // Enregistrer la réponse modèle
    const modelMsg = { role: 'model', parts: [{ text: replyText }] };
    history.push(modelMsg);
    saveHistory(history);
  } catch (err) {
    loadingNode.querySelector('.bubble').textContent = `Erreur: ${err.message}`;
  }
});

// Entrée rapide: Enter pour envoyer
inputEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    formEl.requestSubmit();
  }
});

