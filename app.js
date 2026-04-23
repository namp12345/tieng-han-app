const STORAGE_KEY = 'ktour-v6-progress';
const RECORDING_DB = 'ktour-v6-recordings';

const state = {
  view: 'learn',
  topic: 'all',
  mode: 'all',
  query: '',
  random: false,
  favorites: new Set(),
  hard: new Set(),
  learned: new Set(),
  quizIndex: 0,
  quizScore: 0,
  recording: { mediaRecorder: null, stream: null, phraseId: null, chunks: [] }
};

const refs = {
  viewRoot: document.getElementById('viewRoot'),
  template: document.getElementById('flashcardTemplate'),
  topicFilter: document.getElementById('topicFilter'),
  searchInput: document.getElementById('searchInput'),
  randomBtn: document.getElementById('randomBtn'),
  allBtn: document.getElementById('allBtn'),
  favoriteBtn: document.getElementById('favoriteBtn'),
  hardBtn: document.getElementById('hardBtn'),
  controlPanel: document.getElementById('controlPanel'),
  progressPanel: document.getElementById('progressPanel'),
  progressText: document.getElementById('progressText'),
  progressBar: document.getElementById('progressBar'),
  statsText: document.getElementById('statsText')
};

const LEXICON = {
  오늘: { meaning: 'hôm nay', type: 'Thuần Hàn' },
  함께해: { meaning: 'cùng đồng hành', root: '함께하다', note: 'thân thiện', type: 'Thuần Hàn' },
  주셔서: { meaning: 'vì đã vui lòng...', root: '주시다', type: 'Thuần Hàn', note: 'kính ngữ' },
  감사합니다: { meaning: 'cảm ơn', root: '감사하다', type: 'Hán Hàn', hanja: '感謝' },
  처음: { meaning: 'đầu tiên / lần đầu', type: 'Thuần Hàn' },
  뵙겠습니다: { meaning: 'rất vui được gặp bạn', root: '뵙다', type: 'Thuần Hàn', note: 'kính ngữ trang trọng' }
};

const TOPIC_ICON = {
  'chao-hoi': '👋', 'san-bay': '🧳', 'lich-trinh': '🗺️', 'nhac-gio': '⏰', 'len-xe': '🚌',
  'an-uong': '🍜', 'khach-san': '🏨', 'hoi-an': '🏮', 'bana': '🏔️', 'linh-ung': '🙏',
  'mua-sam': '🛍️', 'tinh-huong': '🚨', 'tam-biet': '👋'
};

function toSentenceModel(topic, phrase) {
  return {
    id: phrase.id,
    topic: topic.name,
    topicId: topic.id,
    korean: phrase.ko,
    romanization: phrase.roman,
    vietnamese: phrase.vi,
    image: phrase.image || TOPIC_ICON[topic.id] || '🧭',
    analysis: phrase.analysis || buildFallbackAnalysis(phrase.ko),
    naturalMeaning: phrase.naturalMeaning || phrase.vi,
    usage: phrase.usage || phrase.note || 'Dùng trong bối cảnh dẫn tour thực tế.',
    similarPatterns: phrase.similarPatterns || [phrase.ko, '천천히 말씀해 주세요', '감사합니다'],
    memoryHint: phrase.memoryHint || 'Nhìn ảnh -> nhớ nghĩa -> lật thẻ để học sâu.'
  };
}

const SENTENCES = PHRASE_TOPICS.flatMap(topic => topic.phrases.map(phrase => toSentenceModel(topic, phrase)));

function buildFallbackAnalysis(koreanSentence) {
  return koreanSentence.split(/\s+/).filter(Boolean).map(word => {
    const data = LEXICON[word] || {};
    return {
      word,
      meaning: data.meaning || `Nghĩa theo ngữ cảnh: ${word}`,
      root: data.root || '',
      note: data.note || '',
      type: data.type || 'Không xác định',
      hanja: data.hanja || ''
    };
  });
}

function init() {
  hydrateState();
  buildTopicFilter();
  bindEvents();
  render();
  registerServiceWorker();
}

function hydrateState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.favorites = new Set(parsed.favorites || []);
    state.hard = new Set(parsed.hard || []);
    state.learned = new Set(parsed.learned || []);
  } catch {}
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    favorites: [...state.favorites],
    hard: [...state.hard],
    learned: [...state.learned]
  }));
}

function buildTopicFilter() {
  refs.topicFilter.innerHTML = '<option value="all">Tất cả chủ đề</option>';
  PHRASE_TOPICS.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic.id;
    option.textContent = `${topic.name} (${topic.phrases.length})`;
    refs.topicFilter.append(option);
  });
}

function bindEvents() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.view = tab.dataset.view;
      document.querySelectorAll('.nav-tab').forEach(x => x.classList.toggle('active', x === tab));
      render();
    });
  });

  refs.topicFilter.addEventListener('change', e => { state.topic = e.target.value; render(); });
  refs.searchInput.addEventListener('input', e => { state.query = e.target.value.toLowerCase(); render(); });
  refs.randomBtn.addEventListener('click', () => { state.random = !state.random; render(); });
  refs.allBtn.addEventListener('click', () => setMode('all'));
  refs.favoriteBtn.addEventListener('click', () => setMode('favorites'));
  refs.hardBtn.addEventListener('click', () => setMode('hard'));
}

function setMode(mode) {
  state.mode = mode;
  refs.allBtn.classList.toggle('active', mode === 'all');
  refs.favoriteBtn.classList.toggle('active', mode === 'favorites');
  refs.hardBtn.classList.toggle('active', mode === 'hard');
  render();
}

function filteredSentences() {
  let list = [...SENTENCES];
  if (state.topic !== 'all') list = list.filter(s => s.topicId === state.topic);
  if (state.mode === 'favorites') list = list.filter(s => state.favorites.has(s.id));
  if (state.mode === 'hard') list = list.filter(s => state.hard.has(s.id));
  if (state.query) list = list.filter(s => `${s.korean} ${s.vietnamese} ${s.romanization}`.toLowerCase().includes(state.query));
  if (state.random) list.sort(() => Math.random() - 0.5);
  return list;
}

function render() {
  refs.controlPanel.classList.toggle('hidden', state.view !== 'learn');
  refs.progressPanel.classList.toggle('hidden', state.view !== 'learn');
  if (state.view === 'quiz') return renderQuiz();
  if (state.view === 'review') return renderReview();
  if (state.view === 'stats') return renderStats();
  return renderLearn();
}

function FlashcardSentence(sentence) {
  const node = refs.template.content.firstElementChild.cloneNode(true);
  FlashcardFront(node, sentence);
  FlashcardBack(node, sentence);
  return node;
}

function FlashcardFront(node, sentence) {
  node.querySelector('[data-image]').textContent = SemanticImage(sentence.image);
  node.querySelector('[data-topic]').textContent = sentence.topic;
  node.querySelector('[data-korean]').textContent = sentence.korean;
  node.querySelector('[data-roman]').textContent = sentence.romanization;
  node.querySelector('[data-vietnamese]').textContent = sentence.vietnamese;
  node.querySelectorAll('[data-flip]').forEach(btn => btn.addEventListener('click', () => node.classList.toggle('flipped')));
  node.querySelector('.FlashcardFront').addEventListener('click', () => node.classList.toggle('flipped'));
}

function FlashcardBack(node, sentence) {
  node.querySelector('[data-korean-back]').textContent = sentence.korean;
  node.querySelector('[data-natural]').textContent = sentence.naturalMeaning;
  node.querySelector('[data-usage]').textContent = sentence.usage;
  node.querySelector('[data-memory]').textContent = sentence.memoryHint;

  const analysisRoot = node.querySelector('[data-analysis]');
  AnalysisList(analysisRoot, sentence.analysis);

  const similarRoot = node.querySelector('[data-similar]');
  similarRoot.innerHTML = sentence.similarPatterns.slice(0, 3).map(p => `<li>${p}</li>`).join('');

  bindBackTabs(node);
  ActionButtonGrid(node, sentence);
}

function SemanticImage(imageValue) {
  return imageValue || '🧭';
}

function AnalysisList(root, analysis) {
  root.innerHTML = '';
  (analysis || []).forEach(item => {
    const chip = document.createElement('article');
    chip.className = 'analysis-item';
    const typeClass = item.type?.includes('Thuần') ? 'chip-native' : item.type?.includes('Hán') ? 'chip-sino' : 'chip-unknown';
    chip.innerHTML = `
      <p class="a-word">${item.word}</p>
      <p class="a-meaning">${item.meaning}</p>
      ${item.root ? `<p class="a-root">Gốc: ${item.root}</p>` : ''}
      <div class="chip-row">
        <span class="word-chip ${typeClass}">${item.type || 'Không xác định'}${item.hanja ? ` (${item.hanja})` : ''}</span>
        ${item.note ? `<span class="word-chip chip-note">${item.note}</span>` : ''}
      </div>
    `;
    root.append(chip);
  });
}

function ActionButtonGrid(node, sentence) {
  node.querySelector('[data-action="speak-normal"]').addEventListener('click', () => speak(sentence.korean, 1));
  node.querySelector('[data-action="speak-slow"]').addEventListener('click', () => speak(sentence.korean, 0.75));
  node.querySelector('[data-action="learned"]').addEventListener('click', () => { state.learned.add(sentence.id); state.hard.delete(sentence.id); persistState(); updateProgress(); });
  node.querySelector('[data-action="hard"]').addEventListener('click', () => { toggleSet(state.hard, sentence.id); persistState(); updateProgress(); });
  bindRecording(node, sentence.id);
}

function bindBackTabs(node) {
  node.querySelectorAll('.mini-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.tab;
      node.querySelectorAll('.mini-tab').forEach(x => x.classList.toggle('active', x === tab));
      node.querySelectorAll('.tab-body').forEach(panel => panel.classList.toggle('hidden', panel.dataset.panel !== key));
    });
  });
}

function renderLearn() {
  refs.viewRoot.innerHTML = '';
  const list = filteredSentences().slice(0, 80);
  if (!list.length) {
    refs.viewRoot.innerHTML = '<p class="empty">Không tìm thấy cụm từ phù hợp.</p>';
    updateProgress();
    return;
  }
  list.forEach(item => refs.viewRoot.append(FlashcardSentence(item)));
  updateProgress();
}

function renderQuiz() {
  refs.viewRoot.innerHTML = '';
  const list = filteredSentences();
  if (!list.length) return;
  const current = list[state.quizIndex % list.length];
  const panel = document.createElement('section');
  panel.className = 'simple-panel';
  panel.innerHTML = `<h3>Quiz</h3><p>${current.vietnamese}</p><p><strong>${current.korean}</strong></p>`;
  refs.viewRoot.append(panel);
}

function renderReview() {
  refs.viewRoot.innerHTML = '';
  const list = SENTENCES.filter(s => state.hard.has(s.id) || !state.learned.has(s.id));
  const panel = document.createElement('section');
  panel.className = 'simple-panel';
  panel.innerHTML = `<h3>Ôn tập</h3><p>${list.length} cụm từ cần ôn.</p>`;
  refs.viewRoot.append(panel);
}

function renderStats() {
  refs.viewRoot.innerHTML = '';
  const panel = document.createElement('section');
  panel.className = 'simple-panel';
  panel.innerHTML = `<h3>Thống kê</h3><p>Đã nhớ: ${state.learned.size}/${SENTENCES.length}</p>`;
  refs.viewRoot.append(panel);
}

function updateProgress() {
  const total = SENTENCES.length;
  const learned = state.learned.size;
  refs.progressText.textContent = `${learned}/${total} đã học`;
  refs.progressBar.style.width = `${total ? Math.round((learned / total) * 100) : 0}%`;
  refs.statsText.textContent = `Yêu thích: ${state.favorites.size} · Khó: ${state.hard.size}`;
}

function toggleSet(set, value) { set.has(value) ? set.delete(value) : set.add(value); }

function speak(text, rate = 1) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = rate;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function openRecordingDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(RECORDING_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('recordings')) db.createObjectStore('recordings');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveRecording(id, blob) {
  const db = await openRecordingDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readwrite');
    tx.objectStore('recordings').put(blob, id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getRecording(id) {
  const db = await openRecordingDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readonly');
    const req = tx.objectStore('recordings').get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteRecording(id) {
  const db = await openRecordingDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readwrite');
    tx.objectStore('recordings').delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function bindRecording(node, sentenceId) {
  const recordBtn = node.querySelector('[data-action="record"]');
  const playBtn = node.querySelector('[data-action="play-record"]');
  const deleteBtn = node.querySelector('[data-action="delete-record"]');
  const status = node.querySelector('[data-record-status]');

  const existing = await getRecording(sentenceId).catch(() => null);
  deleteBtn.classList.toggle('hidden', !existing);

  recordBtn.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) return;
    if (state.recording.mediaRecorder) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recording.stream = stream;
    state.recording.mediaRecorder = new MediaRecorder(stream);
    state.recording.chunks = [];
    state.recording.mediaRecorder.ondataavailable = e => e.data.size > 0 && state.recording.chunks.push(e.data);
    state.recording.mediaRecorder.onstop = async () => {
      const blob = new Blob(state.recording.chunks, { type: 'audio/webm' });
      await saveRecording(sentenceId, blob);
      deleteBtn.classList.remove('hidden');
      status.textContent = 'Đã lưu bản ghi âm.';
      stream.getTracks().forEach(t => t.stop());
      state.recording.mediaRecorder = null;
    };
    state.recording.mediaRecorder.start();
    setTimeout(() => state.recording.mediaRecorder?.stop(), 3500);
    status.textContent = 'Đang ghi âm 3.5 giây...';
  });

  playBtn.addEventListener('click', async () => {
    const blob = await getRecording(sentenceId);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  });

  deleteBtn.addEventListener('click', async () => {
    await deleteRecording(sentenceId);
    deleteBtn.classList.add('hidden');
    status.textContent = 'Đã xóa bản ghi âm.';
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}

window.addEventListener('DOMContentLoaded', init);
