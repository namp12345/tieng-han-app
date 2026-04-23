const STORAGE_KEY = 'ktour-v6-progress';
const WORD_CACHE_KEY = 'ktour-v6-word-cache';
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
  wordCache: {},
  recording: { mediaRecorder: null, stream: null, chunks: [] }
};

const refs = {
  viewRoot: document.getElementById('viewRoot'),
  flashcardTemplate: document.getElementById('flashcardTemplate'),
  quizTemplate: document.getElementById('quizTemplate'),
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

const BASE_LEXICON = {
  오늘: { meaning_vi: 'hôm nay', root: '오늘', type: 'trạng từ thời gian', origin: 'thuần hàn', hanja: '' },
  함께해: { meaning_vi: 'cùng đồng hành', root: '함께하다', type: 'động từ', origin: 'thuần hàn', hanja: '' },
  주셔서: { meaning_vi: 'vì đã vui lòng...', root: '주시다', type: 'kính ngữ', origin: 'thuần hàn', hanja: '' },
  감사합니다: { meaning_vi: 'cảm ơn', root: '감사하다', type: 'động từ lịch sự', origin: 'hán hàn', hanja: '感謝' },
  처음: { meaning_vi: 'đầu tiên / lần đầu', root: '처음', type: 'danh từ', origin: 'thuần hàn', hanja: '' },
  뵙겠습니다: { meaning_vi: 'rất vui được gặp bạn', root: '뵙다', type: 'kính ngữ trang trọng', origin: 'thuần hàn', hanja: '' }
};

const ICON_POOL = ['👤','🧳','☂️','🙏','💬','👥','🚌','🏨','🏮','🗺️','🍜','⏰','📸','🛍️','🚨','✈️','🎫','🧭','🌧️','🌉'];

function hashIcon(id) {
  let n = 0;
  for (const c of id) n += c.charCodeAt(0);
  return ICON_POOL[n % ICON_POOL.length];
}

function toSentenceModel(topic, phrase) {
  return {
    id: phrase.id,
    topic: topic.name,
    topicId: topic.id,
    korean: phrase.ko,
    romanization: phrase.roman,
    vietnamese: phrase.vi,
    image: phrase.image || hashIcon(phrase.id),
    analysis: phrase.analysis || null,
    naturalMeaning: phrase.naturalMeaning || phrase.vi,
    usage: phrase.usage || phrase.note || 'Dùng trong giao tiếp tour thực tế.',
    similarPatterns: phrase.similarPatterns || [phrase.ko, '감사합니다', '천천히 말씀해 주세요']
  };
}

const SENTENCES = PHRASE_TOPICS.flatMap(topic => topic.phrases.map(phrase => toSentenceModel(topic, phrase)));

function init() {
  hydrateState();
  buildTopicFilter();
  bindEvents();
  render();
  registerServiceWorker();
}

function hydrateState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state.favorites = new Set(raw.favorites || []);
    state.hard = new Set(raw.hard || []);
    state.learned = new Set(raw.learned || []);
    state.wordCache = JSON.parse(localStorage.getItem(WORD_CACHE_KEY) || '{}');
  } catch {}
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    favorites: [...state.favorites], hard: [...state.hard], learned: [...state.learned]
  }));
  localStorage.setItem(WORD_CACHE_KEY, JSON.stringify(state.wordCache));
}

function buildTopicFilter() {
  refs.topicFilter.innerHTML = '<option value="all">Tất cả chủ đề</option>';
  PHRASE_TOPICS.forEach(t => {
    const op = document.createElement('option');
    op.value = t.id;
    op.textContent = `${t.name} (${t.phrases.length})`;
    refs.topicFilter.append(op);
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

function getFiltered() {
  let list = [...SENTENCES];
  if (state.topic !== 'all') list = list.filter(s => s.topicId === state.topic);
  if (state.mode === 'favorites') list = list.filter(s => state.favorites.has(s.id));
  if (state.mode === 'hard') list = list.filter(s => state.hard.has(s.id));
  if (state.query) list = list.filter(s => `${s.korean} ${s.vietnamese} ${s.romanization}`.toLowerCase().includes(state.query));
  if (state.random) list.sort(() => Math.random() - 0.5);
  return list;
}

function render() {
  const onlyLearn = state.view === 'learn';
  refs.controlPanel.classList.toggle('hidden', !onlyLearn);
  refs.progressPanel.classList.toggle('hidden', !onlyLearn);
  if (state.view === 'quiz') return renderQuiz();
  if (state.view === 'review') return renderReview();
  if (state.view === 'stats') return renderStats();
  return renderLearn();
}

function FlashcardSentence(sentence) {
  const node = refs.flashcardTemplate.content.firstElementChild.cloneNode(true);
  FlashcardFront(node, sentence);
  FlashcardBack(node, sentence);
  return node;
}

function FlashcardFront(node, s) {
  node.querySelector('[data-image]').textContent = SemanticImage(s);
  node.querySelector('[data-topic]').textContent = s.topic;
  node.querySelector('[data-korean]').textContent = s.korean;
  node.querySelector('[data-roman]').textContent = s.romanization;
  node.querySelector('[data-vietnamese]').textContent = s.vietnamese;
  node.querySelector('[data-front-audio]').addEventListener('click', e => { e.stopPropagation(); speak(s.korean, 1); });
  node.querySelector('[data-flip]').addEventListener('click', () => node.classList.add('flipped'));
  node.querySelector('[data-flip-btn]').addEventListener('click', e => { e.stopPropagation(); node.classList.add('flipped'); });
}

function FlashcardBack(node, s) {
  node.querySelector('[data-korean-back]').textContent = s.korean;
  node.querySelector('[data-natural]').textContent = s.naturalMeaning;
  node.querySelector('[data-usage]').textContent = s.usage;
  node.querySelector('[data-similar]').innerHTML = s.similarPatterns.slice(0, 3).map(x => `<li>${x}</li>`).join('');
  node.querySelector('[data-unflip]').addEventListener('click', () => node.classList.remove('flipped'));

  const analysisRoot = node.querySelector('[data-analysis]');
  renderAnalysis(analysisRoot, s);
  bindBackTabs(node);
  bindActionButtons(node, s);
}

function SemanticImage(s) {
  return s.image;
}

async function renderAnalysis(root, sentence) {
  root.innerHTML = '<p class="mini-loading">Đang phân tích từ...</p>';
  const analysis = sentence.analysis || await buildAnalysisAuto(sentence.korean);
  root.innerHTML = '';
  analysis.forEach(item => root.append(WordItem(item)));
}

function WordItem(item) {
  const origin = normalizeOrigin(item.origin);
  const chipClass = origin === 'thuần hàn' ? 'tag-native' : origin === 'hán hàn' ? 'tag-sino' : 'tag-unknown';

  const row = document.createElement('article');
  row.className = 'word-item';
  row.innerHTML = `
    <div class="word-head">
      <strong>${item.word}</strong>
      <button class="AudioButton">🔊</button>
    </div>
    <p>- nghĩa: ${item.meaning_vi}</p>
    ${item.root ? `<p>- gốc: ${item.root}</p>` : ''}
    <p>- loại: ${item.type || 'từ vựng'}</p>
    <div class="tag-row">
      <span class="origin-tag ${chipClass}">${origin === 'thuần hàn' ? 'Thuần Hàn' : origin === 'hán hàn' ? `Hán Hàn${item.hanja ? ` (${item.hanja})` : ''}` : 'Không xác định'}</span>
    </div>
  `;
  row.querySelector('.AudioButton').addEventListener('click', () => speak(item.word, 0.8));
  return row;
}

function bindActionButtons(node, s) {
  node.querySelector('[data-action="speak"]').addEventListener('click', () => speak(s.korean, 1));
  node.querySelector('[data-action="speak-slow"]').addEventListener('click', () => speak(s.korean, 0.75));
  node.querySelector('[data-action="learned"]').addEventListener('click', () => { state.learned.add(s.id); state.hard.delete(s.id); persistState(); updateProgress(); });
  node.querySelector('[data-action="hard"]').addEventListener('click', () => { toggleSet(state.hard, s.id); persistState(); updateProgress(); });
  bindRecording(node, s.id);
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

async function buildAnalysisAuto(sentence) {
  const words = sentence.split(/\s+/).filter(Boolean);
  const out = [];
  for (const w of words) {
    const base = BASE_LEXICON[w];
    if (base) {
      out.push({ word: w, ...base });
      continue;
    }
    const meaning_vi = await translateWord(w);
    out.push({
      word: w,
      meaning_vi,
      root: guessRoot(w),
      type: guessType(w),
      origin: guessOrigin(w),
      hanja: guessOrigin(w) === 'hán hàn' ? deriveHanja(w) : ''
    });
  }
  return out;
}

async function translateWord(word) {
  if (state.wordCache[word]) return state.wordCache[word];
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=vi&dt=t&q=${encodeURIComponent(word)}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.[0]?.map(x => x[0]).join('') || word;
    state.wordCache[word] = translated;
    persistState();
    return translated;
  } catch {
    const fallback = `từ ${word}`;
    state.wordCache[word] = fallback;
    persistState();
    return fallback;
  }
}

function guessRoot(word) {
  if (word.endsWith('습니다') || word.endsWith('겠습니다')) return `${word.replace(/습니다|겠습니다/g, '')}다`;
  if (word.endsWith('세요')) return `${word.replace(/세요/g, '')}다`;
  return word;
}

function guessType(word) {
  if (word.endsWith('습니다') || word.endsWith('겠습니다')) return 'đuôi lịch sự';
  if (word.endsWith('세요')) return 'mệnh lệnh lịch sự';
  return 'từ vựng';
}

function guessOrigin(word) {
  if (word.includes('감사') || word.includes('시간') || word.includes('여권') || word.includes('확인')) return 'hán hàn';
  return 'thuần hàn';
}

function deriveHanja(word) {
  if (word.includes('감사')) return '感謝';
  if (word.includes('시간')) return '時間';
  if (word.includes('여권')) return '旅券';
  if (word.includes('확인')) return '確認';
  return '';
}

function normalizeOrigin(v) {
  if (!v) return 'không xác định';
  const x = v.toLowerCase();
  if (x.includes('hán')) return 'hán hàn';
  if (x.includes('thuần')) return 'thuần hàn';
  return v;
}

function renderLearn() {
  refs.viewRoot.innerHTML = '';
  const list = getFiltered().slice(0, 70);
  if (!list.length) {
    refs.viewRoot.innerHTML = '<p class="empty">Không có cụm từ phù hợp.</p>';
    updateProgress();
    return;
  }
  list.forEach(s => refs.viewRoot.append(FlashcardSentence(s)));
  updateProgress();
}

function QuizCard(sentence, options) {
  const node = refs.quizTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector('[data-quiz-korean]').textContent = sentence.korean;
  node.querySelector('[data-quiz-audio]').addEventListener('click', () => speak(sentence.korean, 1));
  const optionWrap = node.querySelector('[data-quiz-options]');
  const result = node.querySelector('[data-quiz-result]');

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      const ok = opt === sentence.vietnamese;
      btn.classList.add(ok ? 'ok' : 'fail');
      result.textContent = ok ? '✅ Chính xác' : '❌ Chưa đúng';
      if (ok) state.quizScore += 1;
    });
    optionWrap.append(btn);
  });
  node.querySelector('[data-quiz-next]').addEventListener('click', () => {
    state.quizIndex += 1;
    renderQuiz();
  });
  return node;
}

function renderQuiz() {
  refs.viewRoot.innerHTML = '';
  const source = getFiltered();
  if (!source.length) return;
  const current = source[state.quizIndex % source.length];
  const wrong = source.filter(x => x.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3).map(x => x.vietnamese);
  const options = [current.vietnamese, ...wrong].sort(() => Math.random() - 0.5);
  refs.viewRoot.append(QuizCard(current, options));
}

function renderReview() {
  refs.viewRoot.innerHTML = '';
  const need = SENTENCES.filter(s => state.hard.has(s.id) || !state.learned.has(s.id));
  const panel = document.createElement('article');
  panel.className = 'simple-panel';
  panel.innerHTML = `<h3>Ôn tập nhanh</h3><p>${need.length} cụm từ cần ôn.</p>`;
  refs.viewRoot.append(panel);
}

function renderStats() {
  refs.viewRoot.innerHTML = '';
  const panel = document.createElement('article');
  panel.className = 'simple-panel';
  panel.innerHTML = `<h3>Thống kê</h3><p>Đã nhớ: ${state.learned.size}/${SENTENCES.length}</p><p>Từ khó: ${state.hard.size}</p>`;
  refs.viewRoot.append(panel);
}

function updateProgress() {
  const total = SENTENCES.length;
  const learned = state.learned.size;
  refs.progressText.textContent = `${learned}/${total} đã học`;
  refs.progressBar.style.width = `${Math.round((learned / total) * 100)}%`;
  refs.statsText.textContent = `Yêu thích: ${state.favorites.size} · Khó: ${state.hard.size}`;
}

function toggleSet(set, id) { set.has(id) ? set.delete(id) : set.add(id); }

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
    req.onupgradeneeded = () => !req.result.objectStoreNames.contains('recordings') && req.result.createObjectStore('recordings');
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
  const playBtn = node.querySelector('[data-action="play"]');
  const deleteBtn = node.querySelector('[data-action="delete"]');
  const status = node.querySelector('[data-record-status]');

  const existing = await getRecording(sentenceId).catch(() => null);
  deleteBtn.classList.toggle('hidden', !existing);

  recordBtn.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder || state.recording.mediaRecorder) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recording.stream = stream;
    state.recording.mediaRecorder = new MediaRecorder(stream);
    state.recording.chunks = [];
    state.recording.mediaRecorder.ondataavailable = e => e.data.size > 0 && state.recording.chunks.push(e.data);
    state.recording.mediaRecorder.onstop = async () => {
      await saveRecording(sentenceId, new Blob(state.recording.chunks, { type: 'audio/webm' }));
      deleteBtn.classList.remove('hidden');
      status.textContent = 'Đã lưu bản ghi âm.';
      stream.getTracks().forEach(t => t.stop());
      state.recording.mediaRecorder = null;
    };
    state.recording.mediaRecorder.start();
    status.textContent = 'Đang ghi âm...';
    setTimeout(() => state.recording.mediaRecorder?.stop(), 3200);
  });

  playBtn.addEventListener('click', async () => {
    const blob = await getRecording(sentenceId);
    if (!blob) return;
    new Audio(URL.createObjectURL(blob)).play();
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
