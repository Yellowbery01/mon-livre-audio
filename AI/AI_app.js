// Constantes & stockage
const LS_KEY = 'gemini_api_key';
const LS_HISTORY = 'gemini_chat_history_v4';
const LS_THEME = 'gemini_theme';
const LS_MODEL = 'gemini_model';
const LS_PREPROMPT = 'gemini_preprompt';

// UI
const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('chatForm');
const inputEl = document.getElementById('userInput');
const clearBtn = document.getElementById('clearBtn');
const newChatBtn = document.getElementById('newChatBtn');
const changeKeyBtn = document.getElementById('changeKeyBtn');
const tpl = document.getElementById('messageTemplate');
const apiKeyDialog = document.getElementById('apiKeyDialog');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const themeSelect = document.getElementById('themeSelect');
const modelSelect = document.getElementById('modelSelect');
const prepromptList = document.getElementById('prepromptList');
const activePrepromptEl = document.getElementById('activePreprompt');
const toastEl = document.getElementById('toast');
const scrollBottomBtn = document.getElementById('scrollBottomBtn');

// Préprompts (votre liste nettoyée)
const PREPROMPTS = [
  { id: 'none', label: 'Aucun', text: '' },

  { id: 'books', label: 'Books', text: `Rôle: Tu es un assistant de lecture... (même contenu que fourni, sans les lignes “Thinking Process…”)` },

  { id: 'tasks', label: 'Décomposer Tâches', text: `Tu es un chef de projet expert en méthodologie agile... checklist en Markdown.` },

  { id: 'eli5', label: 'ELI5', text: `Explique comme à un enfant de 5 ans: analogie simple, phrases très courtes, sans jargon, conclusion mémorable.` },

  { id: 'gsearch', label: 'Google Search', text: `Recherche web approfondie en anglais, réponse en français: déconstruction, sources crédibles, synthèse claire.` },

  { id: 'gsearchpp', label: 'Google Search ++', text: `Analyste de recherche: 5+ sources crédibles, analyse critique, synthèse structurée (Résumé, Points clés, Analyse, Sources).` },

  { id: 'imagen', label: 'Imagen', text: `Architecte de prompts: 3–5 prompts riches, composition/éclairage/style/ambiance, rédigés en anglais.` },

  { id: 'optimizer', label: 'Prompt Optimizer', text: `Conçois un prompt optimisé (rôle, étapes, format de sortie, contraintes, éventuel exemple).` },

  { id: 'summary', label: 'Résumé & Points Clés', text: `1 paragraphe (5–7 phrases) + 5–10 points clés courts, fidèles au texte.` },

  { id: 'brainer', label: 'The Brainer', text: `Mémorisation: résumé hiérarchique, chunking, analogies, questions actives, carte mentale textuelle, questions d’application.` },

  { id: 'historian', label: 'The Historian', text: `Historien: contexte, causes, déroulement, conséquences, multi‑perspectives, nuance; style académique accessible.` },

  { id: 'newser', label: 'The Newser', text: `Dépêche: titre percutant, chapeau 5W, pyramide inversée, neutralité, attribution, contexte.` },

  { id: 'stoic', label: 'Philo – Stoïcienne', text: `Dichotomie du contrôle, vertu, amor fati, préméditation des maux; ton calme et questions directrices.` },
  { id: 'exist', label: 'Philo – Existentialiste', text: `Liberté et responsabilité, absurde, authenticité vs mauvaise foi; ton direct, responsabilisant.` },
  { id: 'util', label: 'Philo – Utilitariste', text: `Options, parties affectées, calcul d’utilité, recommandation maximisant le bonheur net.` },
  { id: 'socratic', label: 'Philo – Socratique', text: `Uniquement des questions (définitions, preuves, implications, exemples) pour faire accoucher la pensée.` },

  { id: 'tr-enfr', label: 'Traducteur Anglais↔Français', text: `Traduction pro: ton naturel, idiomes adaptés, notes brèves si besoin, signaler ambiguïtés.` },
  { id: 'tr-arfr', label: 'Traducteur Arabe↔Français', text: `Traduction pro: ton naturel, idiomes adaptés, notes brèves si besoin, signaler ambiguïtés.` },
  { id: 'tr-brfr', label: 'Traducteur Breton↔Français', text: `Traduction pro: ton naturel, idiomes adaptés, notes brèves si besoin, signaler ambiguïtés.` },
  { id: 'tr-hefr', label: 'Traducteur Hébreu↔Français', text: `Traduction pro: ton naturel, idiomes adaptés, notes brèves si besoin, signaler ambiguïtés.` },
  { id: 'tr-itfr', label: 'Traducteur Italien↔Français', text: `Traduction pro: ton naturel, idiomes adaptés, notes brèves si besoin, signaler ambiguïtés.` },

  { id: 'yuka', label: 'Yuka++', text: `Analyse ingrédients centrée santé: rôles, évaluation (✅/🟡/🟠/🔴), synthèse avec note/100 et verdict.` },
];

// Helpers stockage
const getApiKey = () => localStorage.getItem(LS_KEY) || '';
const setApiKey = (k) => localStorage.setItem(LS_KEY, k.trim());
const loadHistory = () => { try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch { return []; } };
const saveHistory = (h) => localStorage.setItem(LS_HISTORY, JSON.stringify(h));
const getTheme = () => localStorage.getItem(LS_THEME) || 'classic';
const setTheme = (t) => { localStorage.setItem(LS_THEME, t); document.documentElement.setAttribute('data-theme', t); };
const getModel = () => localStorage.getItem(LS_MODEL) || 'gemini-2.5-flash-lite';
const setModel = (m) => localStorage.setItem(LS_MODEL, m);
const getPrepromptId = () => localStorage.getItem(LS_PREPROMPT) || 'none';
const setPrepromptId = (id) => { localStorage.setItem(LS_PREPROMPT, id); renderPreprompts(); renderActivePreprompt(); };

// État
let history = loadHistory(); // [{role:'user'|'model', parts:[{text}]}]

// UI init
setTheme(getTheme());
themeSelect.value = getTheme();
themeSelect.addEventListener('change', () => setTheme(themeSelect.value));

modelSelect.value = getModel();
modelSelect.addEventListener('change', () => setModel(modelSelect.value));

function renderActivePreprompt() {
  const p = PREPROMPTS.find(x => x.id === getPrepromptId());
  activePrepromptEl.textContent = p && p.text ? `Consignes actives: ${p.label}` : '';
}
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
    chip.addEventListener('click', () => setPrepromptId(p.id));
    prepromptList.appendChild(chip);
  }
}
renderPreprompts();
renderActivePreprompt();

// Toast
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 1800);
}

// Messages
function appendMessage(role, text, {loading=false} = {}) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role === 'user' ? 'user' : 'model');
  const bubble = node.querySelector('.bubble');
  const actions = node.querySelector('.msg-actions');
  if (loading) {
    bubble.innerHTML = `<span class="loading"><span>Le modèle rédige</span><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>`;
    actions.hidden = true;
  } else {
    bubble.textContent = text;
  }
  // Actions: copy & regen (regen seulement si modèle)
  const copyBtn = node.querySelector('.copy');
  const regenBtn = node.querySelector('.regen');
  if (role === 'model') {
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text); showToast('Copié'); } catch { showToast('Copie impossible'); }
    });
    regenBtn.addEventListener('click', () => regenerateLast());
  } else {
    // Pas d’actions pour l’utilisateur
    actions.hidden = true;
  }
  messagesEl.appendChild(node);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return node;
}

function renderAll() {
  messagesEl.innerHTML = '';
  for (const msg of history) {
    const text = (msg.parts || []).map(p => p.text || '').join('');
    appendMessage(msg.role, text);
  }
}
renderAll();

// Textarea auto-resize
function autoResize() {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 180) + 'px';
}
inputEl.addEventListener('input', autoResize);
autoResize();

// Scroll-bottom bouton
messagesEl.addEventListener('scroll', () => {
  const nearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 120;
  scrollBottomBtn.hidden = nearBottom;
});
scrollBottomBtn.addEventListener('click', () => {
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

// Clé API
function requireApiKey() {
  if (!getApiKey()) { apiKeyInput.value = ''; apiKeyDialog.showModal(); }
}
requireApiKey();
saveKeyBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  const key = apiKeyInput.value.trim();
  if (key) { setApiKey(key); apiKeyDialog.close(); showToast('Clé enregistrée'); }
});
changeKeyBtn?.addEventListener('click', () => { apiKeyInput.value = getApiKey(); apiKeyDialog.showModal(); });

// Historique
function newChat() {
  history = [];
  saveHistory(history);
  renderAll();
  showToast('Nouvelle discussion');
}
newChatBtn?.addEventListener('click', newChat);

clearBtn?.addEventListener('click', () => {
  history = [];
  saveHistory(history);
  renderAll();
  appendMessage('model', 'Historique effacé.');
});

// API
function apiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

// Construit un payload strict + préprompt (injection requête seulement)
function buildPayloadWithPreprompt() {
  const active = PREPROMPTS.find(p => p.id === getPrepromptId());
  const preMsg = active && active.text?.trim()
    ? [{ role: 'user', parts: [{ text: `Consignes: ${active.text.trim()}` }] }]
    : [];
  const cleanHistory = history.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: (m.parts || []).map(p => ({ text: p.text ?? '' }))
  }));
  return [...preMsg, ...cleanHistory];
}

async function sendToGemini(apiKey, model, contents) {
  messagesEl.setAttribute('aria-busy', 'true');
  try {
    const res = await fetch(apiUrl(model), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents }),
    });
    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`;
      try { const err = await res.json(); if (err?.error?.message) detail = err.error.message; } catch {}
      throw new Error(detail);
    }
    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text || '').join('') || '(Réponse vide)';
    // Optionnel: afficher usage s’il existe
    const usage = data?.usageMetadata;
    if (usage) {
      // Ajout discret dans un toast
      showToast(`Tokens (approx.): prompt ${usage.promptTokenCount ?? '-'} / output ${usage.candidatesTokenCount ?? '-'}`);
    }
    return text;
  } finally {
    messagesEl.setAttribute('aria-busy', 'false');
  }
}

// Régénérer la dernière réponse
function regenerateLast() {
  // Supprime la dernière réponse modèle si elle suit un message user
  for (let i = history.length - 1; i >= 1; i--) {
    if (history[i].role === 'model' && history[i-1]?.role === 'user') {
      history.splice(i, 1); // retire la réponse
      break;
    }
  }
  saveHistory(history);
  renderAll();
  // Relancer l’envoi sur la base de l’historique
  doSend();
}

// Envoi message
formEl?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await doSend();
});

async function doSend() {
  const apiKey = getApiKey();
  if (!apiKey) { requireApiKey(); return; }

  const userText = inputEl.value.trim();
  if (userText) {
    const userMsg = { role: 'user', parts: [{ text: userText }] };
    history.push(userMsg);
    saveHistory(history);
    appendMessage('user', userText);
    inputEl.value = '';
    autoResize();
  }

  // Placeholders de chargement si le dernier est un user
  const last = history[history.length - 1];
  if (!last || last.role !== 'user') return;
  const loadingNode = appendMessage('model', '', { loading: true });

  try {
    const contents = buildPayloadWithPreprompt();
    const replyText = await sendToGemini(getApiKey(), getModel(), contents);
    loadingNode.querySelector('.bubble').textContent = replyText;

    const modelMsg = { role: 'model', parts: [{ text: replyText }] };
    history.push(modelMsg);
    saveHistory(history);
  } catch (err) {
    loadingNode.querySelector('.bubble').textContent = `Erreur: ${err.message}`;
  } finally {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}
