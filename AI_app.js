// Configuration
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Stockage local
const LS_KEY = 'gemini_api_key';
const LS_HISTORY = 'gemini_chat_history_v1';

// Éléments UI
const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('chatForm');
const inputEl = document.getElementById('userInput');
const clearBtn = document.getElementById('clearBtn');
const changeKeyBtn = document.getElementById('changeKeyBtn');
const tpl = document.getElementById('messageTemplate');

// Dialog clé API
const apiKeyDialog = document.getElementById('apiKeyDialog');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');

function getApiKey() {
  return localStorage.getItem(LS_KEY) || '';
}
function setApiKey(key) {
  localStorage.setItem(LS_KEY, key.trim());
}
function clearApiKey() {
  localStorage.removeItem(LS_KEY);
}
function loadHistory() {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveHistory(history) {
  localStorage.setItem(LS_HISTORY, JSON.stringify(history));
}

let history = loadHistory(); // format: [{role:'user'|'model', parts:[{text}]}]

function appendMessage(role, text, isLoading=false) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
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
    appendMessage(msg.role === 'user' ? 'user' : 'model', text);
  }
}
renderAll();

function requireApiKey() {
  if (!getApiKey()) {
    apiKeyInput.value = '';
    apiKeyDialog.showModal();
  }
}
requireApiKey();

// Gestion dialog clé
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
  messagesEl.innerHTML = '';
  appendMessage('model', 'Historique effacé.');
});

async function sendToGemini(apiKey, contents) {
  const body = {
    contents, // [{role, parts:[{text}]}...]
  };
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // Essaie de décoder l’erreur JSON standard { error: { message } }
    let detail = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err && err.error && err.error.message) detail = err.error.message;
    } catch {}
    throw new Error(detail);
  }
  const data = await res.json();
  // Récupération du texte (candidates[0].content.parts[].text)
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map(p => p.text || '').join('') || '(Réponse vide)';
  return text;
}

formEl?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiKey = getApiKey();
  if (!apiKey) {
    requireApiKey();
    return;
  }
  const userText = inputEl.value.trim();
  if (!userText) return;

  // Ajoute le message utilisateur
  const userMsg = { role: 'user', parts: [{ text: userText }] };
  history.push(userMsg);
  saveHistory(history);
  appendMessage('user', userText);
  inputEl.value = '';

  // Ajoute un placeholder de chargement
  const loadingNode = appendMessage('model', '', true);

  try {
    const replyText = await sendToGemini(apiKey, history);
    // Remplace le placeholder par la vraie réponse
    loadingNode.querySelector('.bubble').textContent = replyText;

    // Enregistre la réponse modèle
    const modelMsg = { role: 'model', parts: [{ text: replyText }] };
    history.push(modelMsg);
    saveHistory(history);
  } catch (err) {
    loadingNode.querySelector('.bubble').textContent = `Erreur: ${err.message}`;
  }
});

// Optionnel: Entrée rapide avec Shift+Enter pour nouvelle ligne, Enter pour envoyer
inputEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    formEl.requestSubmit();
  }
});
