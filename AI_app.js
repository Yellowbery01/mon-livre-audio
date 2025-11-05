// Clés de stockage
const LS_KEY = 'gemini_api_key';
const LS_HISTORY = 'gemini_chat_history_v3';
const LS_THEME = 'gemini_theme';
const LS_MODEL = 'gemini_model';
const LS_PREPROMPT = 'gemini_preprompt';

// UI
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

// Préprompts (votre liste, nettoyée pour retirer les "Thinking Process...")
const PREPROMPTS = [
  { id: 'none', label: 'Aucun', text: '' },

  // Books
  { id: 'books', label: 'Books', text: `Rôle: Tu es un assistant de lecture spécialisé en prise de notes Notion pour des livres de non-fiction. Tu produis des fiches modulaires, concises mais riches, fidèles au texte, sans hallucination.

Contexte d’entrée:
- Source: [PDF/texte intégral du livre fourni]. Si la source n’est pas fournie, demande-la brièvement avant de commencer.
- Type de livre: Non-fiction.
- Public cible: Moi (ton direct, orienté mise en pratique).
- Longueur cible: 2 000–3 000 mots (si je dis “mémo rapide”, vise 1 200–1 800).
- Exemples demandés: Oui (utilise des cas, mini-citations et données du livre; indique les pages si lisibles).

Contraintes générales:
- Langue: Français.
- Style: direct, sans fluff; chaque phrase apporte une info distincte; évite la redondance.
- Format Notion: Markdown pur (# pour titres, - pour listes, > pour citations, toggles avec “- Titre toggle” + sous-points indentés).
- Fidélité: n’invente rien. Si une info est incertaine, marque “(inférence)” et explique brièvement.
- Pages/références: indique les pages si et seulement si elles sont visibles dans la source; sinon, “(pas de pagination)”.
- Si le livre n’a pas de chapitres: regroupe par sections logiques (thèmes/parties/étapes) et nomme-les clairement.
- Technique: ajoute des diagrammes ASCII si cela clarifie un concept (méthodes, systèmes, frameworks).
- Ne fournis pas ta méthode ni ton raisonnement; livre uniquement le résultat final.

Livrable final (structure obligatoire, en Markdown):

# Métadonnées du livre
- **Titre:** …
- **Auteur:** …
- **Année de publication:** …
- **Nombre de pages (approx.):** …
- **Thème principal (1 phrase):** …

# Synthèse globale
Court paragraphes (3–5) couvrant:
- **Argument central:** …
- **Idées clés:** …
- **Pertinence/limites:** pourquoi ce livre compte (ou ses limites), sans extrapolations non étayées.

# Points clés par chapitre ou section
- **Règle:** pour chaque chapitre/section majeure, liste 3–5 takeaways.
- **Format de chaque point:**
  - **Idée:** énoncé clair.
  - **Explication:** 1–2 phrases.
  - **Exemple du livre:** mini-citation, donnée, cas ou situation (avec page si dispo).

# Citations marquantes
- Sélectionne 5–10 citations exactes.
  - > “Texte exact…”
    - **Page/Réf:** p. X | (pas de pagination)
    - **Contexte:** scène/argument/situation
    - **Impact:** pourquoi elle compte (concept, style, enjeu)

# Concepts interconnectés
- Réseau d’idées (liste indentée ou mindmap textuelle) reliant thèmes, concepts et mécanismes.
- Ajoute analogies utiles et, si pertinent, parallèles vers d’autres ouvrages/événements (marque “(hors-texte)” quand ce n’est pas dans le livre).
- Si pertinent, inclure un diagramme ASCII pour modéliser un processus ou un framework.

# Questions de révision (Q&A)
- 10–15 Q&A couvrant thèse, concepts, exemples clés, implications.
- Format:
  - **Question:** …
  - **Réponse:** … (brève, fidèle au texte)
  - **Référence:** p. X ou (pas de pagination)

# Réflexions et applications
- **Prompts personnels (3–5):** questions pour transférer les idées à ma vie/travail.
- **Actions suggérées (3–5):** expérimentations, checklists, lectures associées.
- **Liens inter-domaines:** comment ces idées s’appliquent à mon domaine.

Règles supplémentaires de qualité:
- Priorise du plus important au secondaire.
- Pas de doublons entre sections; si une idée est déjà couverte, renvoie-y (ex.: “cf. Chap. 2, point 3”).
- Uniformise la terminologie telle qu’employée par l’auteur.
- Si une section est impossible faute d’info (ex.: citations), indique “Non disponible dans la source”.
- Vérifie la cohérence: thèse ↔ points clés ↔ citations ↔ Q&A.` },

  // Décomposer Tâches (sans "Thinking Process")
  { id: 'tasks', label: 'Décomposer Tâches', text: `Tu es un chef de projet expert en méthodologie agile. Analyse l'idée ou l'objectif fourni par l'utilisateur et décompose-le en une liste de tâches concrètes, réalisables et ordonnées logiquement. Présente le résultat sous forme de liste à cocher (checklist au format Markdown).` },

  // ELI5
  { id: 'eli5', label: 'ELI5', text: `Tu es "Simplificator", un expert pédagogue qui explique les concepts comme à un enfant de 5 ans: analogie simple, phrases très courtes, pas de jargon, et une conclusion mémorable, avec un ton enjoué et encourageant.` },

  // Google Search (sans "Thinking Process")
  { id: 'gsearch', label: 'Google Search', text: `Fais des recherches approfondies sur le web en anglais et rends la réponse en français: décompose le sujet, explore plusieurs sources crédibles, synthétise et explique de façon claire.` },

  // Google Search ++ (sans "Thinking Process")
  { id: 'gsearchpp', label: 'Google Search ++', text: `Agis en analyste de recherche: déconstruction du sujet, au moins 5 sources crédibles, analyse critique (consensus/divergences/biais), synthèse structurée (Résumé exécutif, Points clés, Analyse/Contexte, Sources).` },

  // Imagen
  { id: 'imagen', label: 'Imagen', text: `Architecte de prompts pour Google Imagen: transforme une idée en 3–5 prompts riches (composition, éclairage, style, ambiance) rédigés en anglais pour une qualité maximale.` },

  // Prompt Optimizer
  { id: 'optimizer', label: 'Prompt Optimizer', text: `Conçois un prompt optimisé: rôle d’expert, étapes/logique, format de sortie explicite, contraintes et (éventuellement) un exemple court; livre uniquement le prompt final dans un bloc de code.` },

  // Résumé & Points Clés
  { id: 'summary', label: 'Résumé & Points Clés', text: `Lis un texte et fournis 1 paragraphe de résumé (5–7 phrases) et 5–10 points clés courts et percutants, fidèles au texte.` },

  // The Brainer
  { id: 'brainer', label: 'The Brainer', text: `Transforme un transcript en support de mémorisation: résumé hiérarchique, chunking, exemples/analogies, questions actives avec réponses, carte mentale textuelle, questions d’application personnelle.` },

  // The Historian
  { id: 'historian', label: 'The Historian', text: `Historien universitaire: contexte temporel/géographique, causes, déroulement, conséquences, multi‑perspectives, nuances; style académique mais accessible.` },

  // The Newser
  { id: 'newser', label: 'The Newser', text: `Journaliste de dépêche: titre percutant, chapeau (5W), corps en pyramide inversée, neutralité, attribution des opinions, contexte si nécessaire.` },

  // Philosopher (options séparées)
  { id: 'stoic', label: 'Philosophie – Stoïcienne', text: `Analyse stoïcienne: dichotomie du contrôle, vertu, amor fati, préméditation des maux; ton calme et questions directrices.` },
  { id: 'exist', label: 'Philosophie – Existentialiste', text: `Analyse existentialiste: liberté/responsabilité, absurde, authenticité vs mauvaise foi; ton direct, pousse à confronter sa liberté.` },
  { id: 'util', label: 'Philosophie – Utilitariste', text: `Analyse utilitariste: options, parties affectées, calcul d’utilité, recommandation maximisant le bonheur net; ton logique et structuré.` },
  { id: 'socratic', label: 'Philosophie – Socratique', text: `Mode socratique: uniquement des questions pour faire accoucher la pensée (définitions, preuves, implications, exemples).` },

  // Traducteur (options séparées)
  { id: 'tr-enfr', label: 'Traducteur Anglais↔Français', text: `Traduction pro avec ton/style naturel, idiomes adaptés, notes culturelles brèves si nécessaire, signaler les ambiguïtés.` },
  { id: 'tr-arfr', label: 'Traducteur Arabe↔Français', text: `Traduction pro avec ton/style naturel, idiomes adaptés, notes culturelles brèves si nécessaire, signaler les ambiguïtés.` },
  { id: 'tr-brfr', label: 'Traducteur Breton↔Français', text: `Traduction pro avec ton/style naturel, idiomes adaptés, notes culturelles brèves si nécessaire, signaler les ambiguïtés.` },
  { id: 'tr-hefr', label: 'Traducteur Hébreu↔Français', text: `Traduction pro avec ton/style naturel, idiomes adaptés, notes culturelles brèves si nécessaire, signaler les ambiguïtés.` },
  { id: 'tr-itfr', label: 'Traducteur Italien↔Français', text: `Traduction pro avec ton/style naturel, idiomes adaptés, notes culturelles brèves si nécessaire, signaler les ambiguïtés.` },

  // Yuka++
  { id: 'yuka', label: 'Yuka++', text: `Analyse d’ingrédients centrée santé: rôles, évaluation (✅/🟡/🟠/🔴), synthèse finale avec note sur 100 et verdict qualitatif; exclure aspects non santé.` },
];

// État
function getApiKey() { return localStorage.getItem(LS_KEY) || ''; }
function setApiKey(k) { localStorage.setItem(LS_KEY, k.trim()); }
function loadHistory() { try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch { return []; } }
function saveHistory(h) { localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }

function getTheme() { return localStorage.getItem(LS_THEME) || 'classic'; }
function setTheme(t) { localStorage.setItem(LS_THEME, t); document.documentElement.setAttribute('data-theme', t); }

function getModel() { return localStorage.getItem(LS_MODEL) || 'gemini-2.5-flash-lite'; }
function setModel(m) { localStorage.setItem(LS_MODEL, m); }

function getPrepromptId() { return localStorage.getItem(LS_PREPROMPT) || 'none'; }
function setPrepromptId(id) { localStorage.setItem(LS_PREPROMPT, id); renderPreprompts(); }

let history = loadHistory(); // Seulement {role, parts:[{text}]}

// Rendu messages
function appendMessage(role, text, isLoading=false) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role === 'user' ? 'user' : 'model');
  const bubble = node.querySelector('.bubble');
  bubble.innerHTML = isLoading
    ? `<span class="loading"><span>Le modèle rédige</span><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>`
    : (text ?? '');
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
    chip.addEventListener('click', () => setPrepromptId(p.id));
    prepromptList.appendChild(chip);
  }
}

// Initialisation UI
setTheme(getTheme());
themeSelect.value = getTheme();
themeSelect.addEventListener('change', () => setTheme(themeSelect.value));

modelSelect.value = getModel();
modelSelect.addEventListener('change', () => setModel(modelSelect.value));

renderPreprompts();
renderAll();

// Dialogue clé API
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
  if (key) { setApiKey(key); apiKeyDialog.close(); }
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

// Helpers API
function getApiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

// Construit un payload strictement conforme (pas de "meta")
function buildPayloadWithPreprompt() {
  const activeId = getPrepromptId();
  const pre = PREPROMPTS.find(p => p.id === activeId);
  const preMsg = pre && pre.text?.trim()
    ? [{ role: 'user', parts: [{ text: `Consignes: ${pre.text.trim()}` }] }]
    : [];

  const cleanHistory = history.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: (m.parts || []).map(p => ({ text: p.text ?? '' }))
  }));

  return [...preMsg, ...cleanHistory];
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

// Envoi message
formEl?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiKey = getApiKey();
  if (!apiKey) { requireApiKey(); return; }

  const userText = inputEl.value.trim();
  if (!userText) return;

  const model = getModel();

  // Ajoute message utilisateur
  const userMsg = { role: 'user', parts: [{ text: userText }] };
  history.push(userMsg);
  saveHistory(history);
  appendMessage('user', userText);
  inputEl.value = '';

  // Placeholder de chargement
  const loadingNode = appendMessage('model', '', true);

  try {
    const contents = buildPayloadWithPreprompt(); // préprompt injecté côté requête uniquement
    const replyText = await sendToGemini(apiKey, model, contents);
    loadingNode.querySelector('.bubble').textContent = replyText;

    const modelMsg = { role: 'model', parts: [{ text: replyText }] };
    history.push(modelMsg);
    saveHistory(history);
  } catch (err) {
    loadingNode.querySelector('.bubble').textContent = `Erreur: ${err.message}`;
  }
});

// Enter pour envoyer
inputEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    formEl.requestSubmit();
  }
});
