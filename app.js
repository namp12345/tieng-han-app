const STORAGE_KEY = 'ktour-v6-state';
const RECORDING_DB = 'ktour-v6-recordings';

const WORD_DICT = {
  오늘: { vi: 'hôm nay', type: 'Thuần Hàn' },
  함께해: { vi: 'cùng đồng hành / cùng làm', root: '함께하다', note: 'Thân thiện, tự nhiên', type: 'Thuần Hàn' },
  주셔서: { vi: 'vì đã vui lòng làm cho', root: '주시다', note: 'Dạng kính ngữ', type: 'Thuần Hàn' },
  감사합니다: { vi: 'cảm ơn', root: '감사하다', hanja: '感謝', type: 'Hán Hàn' }
};

const STUDY_SLOTS = ['07:00', '10:00', '14:00', '19:00'];

const state = {
  view: 'learn',
  topic: 'all',
  query: '',
  random: false,
  favorites: new Set(),
  hard: new Set(),
  learned: new Set(),
  quiz: { index: 0, score: 0 },
  recording: { mediaRecorder: null, stream: null, phraseId: null, chunks: [] }
};

const refs = {
  viewRoot: document.getElementById('viewRoot'),
  flashcardTemplate: document.getElementById('flashcardTemplate'),
  quizTemplate: document.getElementById('quizTemplate'),
  topicFilter: document.getElementById('topicFilter'),
  searchInput: document.getElementById('searchInput'),
  randomBtn: document.getElementById('randomBtn'),
  controlPanel: document.getElementById('controlPanel'),
  sessionPanel: document.getElementById('sessionPanel'),
  progressPanel: document.getElementById('progressPanel'),
  progressText: document.getElementById('progressText'),
  progressBar: document.getElementById('progressBar'),
  statsText: document.getElementById('statsText'),
  todayLearned: document.getElementById('todayLearned'),
  streakCount: document.getElementById('streakCount'),
  totalPoints: document.getElementById('totalPoints'),
  dailyGoal: document.getElementById('dailyGoal'),
  goalBar: document.getElementById('goalBar'),
  studySlots: document.getElementById('studySlots')
};

const flatPhrases = PHRASE_TOPICS.flatMap(topic =>
  topic.phrases.map(phrase => ({ ...normalizePhrase(phrase), topicId: topic.id, topicName: topic.name }))
);

function normalizePhrase(phrase) {
  const korean = phrase.korean || phrase.ko || '';
  const romanization = phrase.romanization || phrase.roman || '';
  const vietnamese = phrase.vietnamese || phrase.vi || '';
  const analysis = Array.isArray(phrase.analysis) && phrase.analysis.length ? phrase.analysis : fallbackAnalysis(korean);

  return {
    ...phrase,
    korean,
    romanization,
    vietnamese,
    image: phrase.image || '',
    analysis,
    naturalMeaning: phrase.naturalMeaning || vietnamese,
    similarPatterns: Array.isArray(phrase.similarPatterns) && phrase.similarPatterns.length
      ? phrase.similarPatterns.slice(0, 3)
      : ['한 번 더 말씀해 주세요', '천천히 말씀해 주세요', '도와드릴까요?'],
    ko: korean,
    roman: romanization,
    vi: vietnamese
  };
}

function fallbackAnalysis(sentence) {
  return (sentence || '').split(/\s+/).filter(Boolean).map(token => {
    const hit = WORD_DICT[token] || {};
    const type = normalizeWordType(hit.type);
    return {
      word: token,
      meaning: hit.vi || `Nghĩa theo ngữ cảnh của "${token}"`,
      root: hit.root || token,
      note: hit.note || '',
      type,
      hanja: hit.hanja || ''
    };
  });
}

function normalizeWordType(type) {
  if (!type) return 'Không xác định';
  if (type.includes('Hán Hàn')) return 'Hán Hàn';
  if (type.includes('Thuần Hàn')) return 'Thuần Hàn';
  return 'Không xác định';
}

const ICON_POOL = ['👤','🧳','☂️','🙏','💬','👥','🚌','🏨','🏮','🗺️','🍜','⏰','📸','🛍️','🚨','✈️','🎫','🧭','🌧️','🌉'];
const SENTENCES = buildSentences();

function buildSentences() {
  const rows = [];
  PHRASE_TOPICS.forEach(topic => {
    topic.phrases.forEach((p, idx) => {
      const sessionIndex = Math.floor(idx / 3);
      rows.push({
        id: p.id,
        topic: topic.name,
        topicId: topic.id,
        korean: p.ko,
        romanization: p.roman,
        vietnamese: p.vi,
        image: p.image || ICON_POOL[Math.abs(hash(p.id)) % ICON_POOL.length],
        analysis: p.analysis || null,
        naturalMeaning: p.naturalMeaning || p.vi,
        usage: p.usage || p.note || 'Dùng trong dẫn tour thực tế',
        similarPatterns: p.similarPatterns || [p.ko],
        sessionIndex,
        sessionTime: SESSION_TIMES[sessionIndex % SESSION_TIMES.length]
      });
    });
  });
  return rows;
}

function hash(s){ let h=0; for(const c of s) h=(h<<5)-h+c.charCodeAt(0); return h; }
function todayKey(){ return new Date().toISOString().slice(0,10); }

function ensureDaily() {
  const key = todayKey();
  if (!state.dailyStats[key]) {
    state.dailyStats[key] = { date: key, studiedCount: 0, completedCount: 0, listenCount: 0, slowListenCount: 0, recordCount: 0, selfPlayCount: 0, completedSessions: [], topicsStudied: [] };
  }
  return state.dailyStats[key];
}

function ensureProgress(id, sentence) {
  if (!state.progressById[id]) {
    state.progressById[id] = {
      id,
      topic: sentence.topic,
      korean: sentence.korean,
      romanization: sentence.romanization,
      vietnamese: sentence.vietnamese,
      image: sentence.image,
      analysis: sentence.analysis || [],
      isCompleted: false,
      completedAt: null,
      reviewBucket: false,
      listenCount: 0,
      slowListenCount: 0,
      recordCount: 0,
      selfPlayCount: 0,
      sessionTime: sentence.sessionTime,
      sessionIndex: sentence.sessionIndex,
      unlocked: sentence.sessionIndex === 0
    };
  }
  return state.progressById[id];
}

function init() {
  hydrate();
  SENTENCES.forEach(s => ensureProgress(s.id, s));
  bindEvents();
  startClock();
  renderDashboard();
  renderStudySlots();
  render();
  registerServiceWorker();
}

function startClock() {
  const badge = document.getElementById('clockBadge');
  const tick = () => {
    const now = new Date();
    badge.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  tick();
  setInterval(tick, 30000);
}

function hydrateState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state.favorites = new Set(parsed.favorites || []);
    state.hard = new Set(parsed.hard || []);
    state.learned = new Set(parsed.learned || []);
  } catch (_error) {}
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
  refs.topicFilter.value = 'all';
}

function bindEvents() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.view = tab.dataset.view || 'learn';
      document.querySelectorAll('.tab').forEach(other => other.classList.toggle('active', other === tab));
      render();
    });
  });

  refs.topicFilter.addEventListener('change', e => { state.topic = e.target.value; render(); });
  refs.searchInput.addEventListener('input', e => { state.query = e.target.value.toLowerCase().trim(); render(); });
  refs.randomBtn.addEventListener('click', () => { state.random = !state.random; refs.randomBtn.classList.toggle('active', state.random); render(); });
  refs.allBtn.addEventListener('click', () => setMode('all'));
  refs.favoriteBtn.addEventListener('click', () => setMode('favorites'));
  refs.hardBtn.addEventListener('click', () => setMode('hard'));
}

function buildTopicFilter() {
  refs.topicFilter.innerHTML = '<option value="all">Tất cả chủ đề</option>';
  PHRASE_TOPICS.forEach(t => {
    const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; refs.topicFilter.append(o);
  });
}

function getFilteredPhrases() {
  let list = [...flatPhrases];
  if (state.topic !== 'all') list = list.filter(x => x.topicId === state.topic);
  if (state.mode === 'favorites') list = list.filter(x => state.favorites.has(x.id));
  if (state.mode === 'hard') list = list.filter(x => state.hard.has(x.id));
  if (state.query) list = list.filter(item => [item.korean, item.vietnamese, item.romanization, item.naturalMeaning].join(' ').toLowerCase().includes(state.query));
  if (state.random) list.sort(() => Math.random() - 0.5);
  return list;
}

function render() {
  renderDashboard();
  renderStudySlots();
  if (state.view === 'quiz') return renderQuizView();
  if (state.view === 'review') return renderReviewView();
  if (state.view === 'stats') return renderStatsView();
  return renderLearnView();
}

function renderDashboard() {
  const learnedToday = Math.min(state.learned.size, 20);
  const streak = Math.max(1, Math.floor(state.learned.size / 8));
  const points = (state.learned.size * 10) + (state.favorites.size * 2);
  const goalPercent = Math.min(100, Math.round((learnedToday / 20) * 100));

  refs.todayLearned.textContent = `${learnedToday} từ`;
  refs.streakCount.textContent = `${streak} ngày`;
  refs.totalPoints.textContent = `${points} điểm`;
  refs.dailyGoal.textContent = `${goalPercent}%`;
  refs.goalBar.style.width = `${goalPercent}%`;
}

function renderStudySlots() {
  const currentHour = new Date().getHours();
  refs.studySlots.innerHTML = '';
  STUDY_SLOTS.forEach((slot, index) => {
    const [hour] = slot.split(':').map(Number);
    let status = 'locked';
    let label = 'Bị khóa';

    if (currentHour >= hour) {
      status = 'pending';
      label = 'Chưa học';
    }
    if (currentHour >= hour && currentHour < hour + 2) {
      status = 'active';
      label = 'Đang học';
    }
    if (state.learned.size >= (index + 1) * 5) {
      status = 'done';
      label = 'Đã hoàn thành';
    }

    const item = document.createElement('article');
    item.className = `slot-task ${status}`;
    item.innerHTML = `<div class="left"><span class="time">${slot}</span><small>Nhiệm vụ ôn cụm từ</small></div><span class="state">${label}</span>`;
    refs.studySlots.append(item);
  });
}

function renderLearnView() {
  const data = getFilteredPhrases();
  refs.flashcardList.innerHTML = '';
  if (!data.length) {
    refs.flashcardList.innerHTML = '<p class="empty">Không có thẻ phù hợp với bộ lọc hiện tại.</p>';
    updateProgress();
    return;
  }

  data.slice(0, 80).forEach((item, index) => refs.flashcardList.append(createFlashcardSentence(item, index)));
  updateProgress();
}

function createFlashcardSentence(item, index) {
  const node = refs.template.content.firstElementChild.cloneNode(true);
  node.querySelector('.topic-pill').textContent = item.topicName;
  bindFavorite(node, item);
  renderFlashcardFront(node, item);
  renderFlashcardBack(node, item);
  wireFlip(node);
  bindStateActions(node, item);
  bindRecordingActions(node, item.id);

  const statusBadge = node.querySelector('.card-status-badge');
  if (state.learned.has(item.id)) {
    node.classList.add('learned');
    statusBadge.textContent = '✔ Đã học';
  } else if (index === 0) {
    node.classList.add('current');
    statusBadge.textContent = '⏳ Đang học';
  } else if (index > 24) {
    node.classList.add('locked');
    statusBadge.textContent = '🔒 Khóa';
  } else {
    statusBadge.textContent = 'Mới';
  }

  return node;
}

function renderFlashcardFront(node, item) {
  node.querySelector('.ko').textContent = item.korean;
  node.querySelector('.roman').textContent = item.romanization;
  node.querySelector('.vi').textContent = item.vietnamese;
  renderSemanticImage(node.querySelector('.semantic-image'), item);
}

function renderFlashcardBack(node, item) {
  renderAnalysisList(node.querySelector('.analysis-list'), item.analysis);
  node.querySelector('.natural-meaning').textContent = `Nghĩa tự nhiên: ${item.naturalMeaning}`;
  const similar = node.querySelector('.similar-list');
  similar.innerHTML = '';
  item.similarPatterns.slice(0, 3).forEach(x => {
    const li = document.createElement('li');
    li.textContent = x;
    similar.append(li);
  });
}

function renderSemanticImage(container, item) {
  const text = `${item.korean} ${item.vietnamese}`.toLowerCase();
  const map = [
    { keys: ['우산', 'mưa', 'ô'], icon: '☔ Ô / mưa' },
    { keys: ['수하물', '짐', 'hành lý', 'vali'], icon: '🧳 Khu hành lý' },
    { keys: ['감사', 'cảm ơn', 'tạm biệt'], icon: '🙇 Cảm ơn khách' },
    { keys: ['모이', '집합', 'tập trung'], icon: '👥 Tập trung đoàn' },
    { keys: ['공항', 'sân bay'], icon: '🛬 Sân bay' },
    { keys: ['버스', 'xe'], icon: '🚌 Di chuyển xe' },
    { keys: ['호텔', 'khách sạn'], icon: '🏨 Khách sạn' },
    { keys: ['식사', 'ăn', 'menu'], icon: '🍱 Ăn uống' }
  ];
  const hit = map.find(m => m.keys.some(k => text.includes(k))) || { icon: '🧭 Ngữ cảnh tour' };
  container.textContent = hit.icon;
}

function renderAnalysisList(container, analysis) {
  container.innerHTML = '';
  (analysis || []).forEach(word => {
    const type = normalizeWordType(word.type);
    const item = document.createElement('article');
    item.className = 'analysis-item';
    item.innerHTML = `
      <div class="analysis-word">${word.word}</div>
      <div class="analysis-mean">${word.meaning || 'Không có nghĩa chi tiết'}</div>
      <div class="meta-row">
        <span class="chip ${type === 'Hán Hàn' ? 'sino' : type === 'Thuần Hàn' ? 'native' : ''}">${type}${type === 'Hán Hàn' && word.hanja ? ` (${word.hanja})` : ''}</span>
        <span class="chip">Gốc: ${word.root || '—'}</span>
        ${word.note ? `<span class="chip">${word.note}</span>` : ''}
      </div>
    `;
    container.append(item);
  });
}

function wireFlip(node) {
  const shell = node.querySelector('.flip-shell');
  const toggle = ev => {
    if (ev.target.closest('.speak-btn, .record-btn, .play-record-btn, .delete-record-btn, .stop-record-btn, .learned-btn, .hard-btn, .favorite-toggle')) return;
    shell.classList.toggle('flipped');
  };
  shell.addEventListener('click', toggle);
  shell.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      shell.classList.toggle('flipped');
    }
  });
  node.querySelectorAll('.flip-btn').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    shell.classList.toggle('flipped');
  }));
}

function bindFavorite(node, item) {
  const favoriteBtn = node.querySelector('.favorite-toggle');
  favoriteBtn.textContent = state.favorites.has(item.id) ? '★' : '☆';
  favoriteBtn.classList.toggle('active', state.favorites.has(item.id));
  favoriteBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggleSet(state.favorites, item.id);
    favoriteBtn.textContent = state.favorites.has(item.id) ? '★' : '☆';
    favoriteBtn.classList.toggle('active', state.favorites.has(item.id));
    persistState();
    updateProgress();
    renderDashboard();
  });

function bindStateActions(node, item) {
  node.querySelectorAll('.speak-btn').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    speakKorean(item.korean, Number(btn.dataset.rate || 1));
  }));

  node.querySelector('.learned-btn').addEventListener('click', e => {
    e.stopPropagation();
    state.learned.add(item.id);
    state.hard.delete(item.id);
    persistState();
    node.classList.add('learned');
    node.classList.remove('hard');
    node.querySelector('.card-status-badge').textContent = '✔ Đã học';
    updateProgress();
    renderDashboard();
    renderStudySlots();
  });

  node.querySelector('.hard-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleSet(state.hard, item.id);
    persistState();
    node.classList.toggle('hard', state.hard.has(item.id));
    updateProgress();
  });
}

function toggleSet(set, value) { if (set.has(value)) set.delete(value); else set.add(value); }

function updateProgress() {
  const total = flatPhrases.length;
  const learned = state.learned.size;
  const percent = total ? Math.round((learned / total) * 100) : 0;
  refs.progressText.textContent = `${learned}/${total} đã nhớ (${percent}%)`;
  refs.progressBar.style.width = `${percent}%`;
  refs.statsText.textContent = `Yêu thích: ${state.favorites.size} · Khó: ${state.hard.size}`;
}

function renderQuizView() {
  refs.flashcardList.innerHTML = '';
  const data = getFilteredPhrases();
  if (!data.length) return;
  const current = data[state.quiz.index % data.length];
  const options = [current, ...data.filter(x => x.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
  const panel = document.createElement('section');
  panel.className = 'quiz-panel';
  panel.innerHTML = `<h3>Quiz</h3><p><strong>${current.vietnamese}</strong></p><div class="quiz-options"></div><button class="quiz-next">Tiếp</button>`;
  const wrap = panel.querySelector('.quiz-options');
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt.korean;
    btn.onclick = () => btn.classList.add(opt.id === current.id ? 'correct' : 'wrong');
    wrap.append(btn);
  });
  panel.querySelector('.quiz-next').onclick = () => { state.quiz.index += 1; renderQuizView(); };
  refs.flashcardList.append(panel);
}

function renderReviewView() {
  refs.flashcardList.innerHTML = '';
  const list = flatPhrases.filter(x => state.hard.has(x.id) || !state.learned.has(x.id)).slice(0, 100);
  if (!list.length) {
    refs.flashcardList.innerHTML = '<p class="empty">Bạn đã học hết phần ôn tập.</p>';
    return;
  }
  list.forEach(item => {
    const node = document.createElement('article');
    node.className = 'review-item';
    node.innerHTML = `<p class="review-ko">${item.korean}</p><p class="review-vi">${item.vietnamese}</p><div class="review-actions"><button class="quick-speak">Nghe</button><button class="quick-known">Đã nhớ</button></div>`;
    node.querySelector('.quick-speak').onclick = () => speakKorean(item.korean, 0.85);
    node.querySelector('.quick-known').onclick = () => { state.learned.add(item.id); state.hard.delete(item.id); persistState(); renderReviewView(); updateProgress(); renderDashboard(); };
    refs.flashcardList.append(node);
  });
}

function renderStatsView() {
  refs.flashcardList.innerHTML = '';
  const panel = document.createElement('section');
  panel.className = 'stats-panel';
  panel.innerHTML = `<h3>Thống kê</h3><p>Đã nhớ: ${state.learned.size}/${flatPhrases.length}</p>`;
  refs.flashcardList.append(panel);
}

function speakKorean(text, rate = 1) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = rate;
  const voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('ko'));
  if (voice) utterance.voice = voice;
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

async function bindRecordingActions(node, phraseId) {
  const recordBtn = node.querySelector('.record-btn');
  const stopBtn = node.querySelector('.stop-record-btn');
  const playBtn = node.querySelector('.play-record-btn');
  const deleteBtn = node.querySelector('.delete-record-btn');
  const status = node.querySelector('.record-status');

  const setDeleteState = blob => deleteBtn.classList.toggle('hidden', !blob);
  const existing = await getRecording(phraseId).catch(() => null);
  status.textContent = existing ? 'Đã có bản ghi âm cá nhân.' : 'Chưa có bản ghi âm cá nhân.';
  setDeleteState(existing);

  recordBtn.onclick = async e => {
    e.stopPropagation();
    if (!navigator.mediaDevices || !window.MediaRecorder || state.recording.mediaRecorder) return;
    try {
      state.recording.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.recording.mediaRecorder = new MediaRecorder(state.recording.stream);
      state.recording.chunks = [];
      state.recording.phraseId = phraseId;
      state.recording.mediaRecorder.ondataavailable = ev => ev.data.size && state.recording.chunks.push(ev.data);
      state.recording.mediaRecorder.onstop = async () => {
        const blob = new Blob(state.recording.chunks, { type: 'audio/webm' });
        await saveRecording(phraseId, blob);
        status.textContent = 'Đã lưu bản ghi âm của bạn.';
        setDeleteState(blob);
        cleanupRecorder();
      };
      state.recording.mediaRecorder.start();
      stopBtn.disabled = false;
      status.textContent = 'Đang ghi âm...';
    } catch (_error) {
      cleanupRecorder();
    }
  };

  stopBtn.onclick = e => {
    e.stopPropagation();
    if (state.recording.mediaRecorder && state.recording.phraseId === phraseId) {
      state.recording.mediaRecorder.stop();
      stopBtn.disabled = true;
    }
  };

  playBtn.onclick = async e => {
    e.stopPropagation();
    const blob = await getRecording(phraseId);
    if (!blob) {
      status.textContent = 'Chưa có bản ghi để phát.';
      return;
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
    status.textContent = 'Đang phát bản ghi âm của bạn...';
  };

  deleteBtn.onclick = async e => {
    e.stopPropagation();
    await deleteRecording(phraseId);
    status.textContent = 'Đã xóa bản ghi âm cá nhân.';
    setDeleteState(null);
  };
}

function cleanupRecorder() {
  if (state.recording.stream) state.recording.stream.getTracks().forEach(t => t.stop());
  state.recording.mediaRecorder = null;
  state.recording.stream = null;
  state.recording.phraseId = null;
  state.recording.chunks = [];
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}

window.addEventListener('DOMContentLoaded', init);
