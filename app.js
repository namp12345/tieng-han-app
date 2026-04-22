const STORAGE_KEY = 'ktour-v6-progress';
const RECORDING_DB = 'ktour-v6-recordings';

const state = {
  topic: 'chao-hoi',
  query: '',
  mode: 'all',
  random: false,
  favorites: new Set(),
  hard: new Set(),
  learned: new Set(),
  recording: {
    mediaRecorder: null,
    stream: null,
    phraseId: null,
    chunks: []
  }
};

const flatPhrases = PHRASE_TOPICS.flatMap(topic =>
  topic.phrases.map(phrase => ({ ...phrase, topicId: topic.id, topicName: topic.name }))
);

const refs = {
  topicFilter: document.getElementById('topicFilter'),
  searchInput: document.getElementById('searchInput'),
  flashcardList: document.getElementById('flashcardList'),
  template: document.getElementById('cardTemplate'),
  randomBtn: document.getElementById('randomBtn'),
  allBtn: document.getElementById('allBtn'),
  favoriteBtn: document.getElementById('favoriteBtn'),
  hardBtn: document.getElementById('hardBtn'),
  progressText: document.getElementById('progressText'),
  progressBar: document.getElementById('progressBar'),
  statsText: document.getElementById('statsText')
};

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
  } catch (error) {
    console.warn('Không đọc được dữ liệu cũ:', error);
  }
}

function persistState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      favorites: [...state.favorites],
      hard: [...state.hard],
      learned: [...state.learned]
    })
  );
}

function buildTopicFilter() {
  refs.topicFilter.innerHTML = '<option value="all">Tất cả chủ đề</option>';
  PHRASE_TOPICS.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic.id;
    option.textContent = `${topic.name} (${topic.phrases.length})`;
    refs.topicFilter.append(option);
  });
  refs.topicFilter.value = state.topic;
}

function bindEvents() {
  refs.topicFilter.addEventListener('change', event => {
    state.topic = event.target.value;
    state.random = false;
    refs.randomBtn.classList.remove('active');
    render();
  });

  refs.searchInput.addEventListener('input', event => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });

  refs.randomBtn.addEventListener('click', () => {
    state.random = !state.random;
    refs.randomBtn.classList.toggle('active', state.random);
    render();
  });

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

function getFilteredPhrases() {
  let list = [...flatPhrases];

  if (state.topic !== 'all') list = list.filter(item => item.topicId === state.topic);
  if (state.mode === 'favorites') list = list.filter(item => state.favorites.has(item.id));
  if (state.mode === 'hard') list = list.filter(item => state.hard.has(item.id));

  if (state.query) {
    list = list.filter(item => {
      const haystack = [item.ko, item.vi, item.roman, item.breakdown, item.root, item.note]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(state.query);
    });
  }

  if (state.random) list.sort(() => Math.random() - 0.5);
  return list;
}

function render() {
  const data = getFilteredPhrases();
  const MAX_RENDER = 120;
  const visibleData = data.slice(0, MAX_RENDER);
  refs.flashcardList.innerHTML = '';

  if (!data.length) {
    refs.flashcardList.innerHTML = '<p class="empty">Không tìm thấy cụm từ phù hợp. Hãy đổi bộ lọc hoặc từ khóa.</p>';
    updateProgress();
    return;
  }

  if (data.length > MAX_RENDER) {
    const note = document.createElement('p');
    note.className = 'empty';
    note.textContent = `Đang hiển thị ${MAX_RENDER}/${data.length} cụm từ để app chạy mượt trên điện thoại. Hãy lọc theo chủ đề/từ khóa để học sâu.`;
    refs.flashcardList.append(note);
  }

  visibleData.forEach(item => {
    const node = refs.template.content.firstElementChild.cloneNode(true);
    const favoriteBtn = node.querySelector('.favorite-toggle');
    const front = node.querySelector('.front');
    const back = node.querySelector('.back');

    node.querySelector('.topic-pill').textContent = item.topicName;
    node.querySelector('.ko').textContent = item.ko;
    node.querySelector('.vi').textContent = item.vi;
    node.querySelector('.roman').textContent = item.roman || 'Đang cập nhật';

    bindOptionalText(node, '.breakdown-row', '.breakdown', item.breakdown);
    bindOptionalText(node, '.root-row', '.root', item.root);
    bindOptionalText(node, '.note-row', '.note', item.note);

    favoriteBtn.textContent = state.favorites.has(item.id) ? '★' : '☆';
    favoriteBtn.classList.toggle('active', state.favorites.has(item.id));
    favoriteBtn.addEventListener('click', () => {
      toggleSet(state.favorites, item.id);
      favoriteBtn.textContent = state.favorites.has(item.id) ? '★' : '☆';
      favoriteBtn.classList.toggle('active', state.favorites.has(item.id));
      persistState();
      updateProgress();
    });

    front.addEventListener('click', () => back.classList.toggle('hidden'));

    node.querySelectorAll('.speak-btn').forEach(btn => {
      btn.addEventListener('click', () => speakKorean(item.ko, Number(btn.dataset.rate || 1)));
    });

    node.querySelector('.learned-btn').addEventListener('click', () => {
      state.learned.add(item.id);
      state.hard.delete(item.id);
      persistState();
      updateProgress();
      node.classList.add('learned');
      node.classList.remove('hard');
    });

    node.querySelector('.hard-btn').addEventListener('click', () => {
      toggleSet(state.hard, item.id);
      persistState();
      updateProgress();
      node.classList.toggle('hard', state.hard.has(item.id));
    });

    bindRecordingActions(node, item.id);

    node.classList.toggle('learned', state.learned.has(item.id));
    node.classList.toggle('hard', state.hard.has(item.id));
    refs.flashcardList.append(node);
  });

  updateProgress();
}

function bindOptionalText(root, rowSelector, textSelector, value) {
  const row = root.querySelector(rowSelector);
  if (!value) {
    row.classList.add('hidden');
    return;
  }
  row.classList.remove('hidden');
  row.querySelector(textSelector).textContent = value;
}

function toggleSet(collection, value) {
  if (collection.has(value)) collection.delete(value);
  else collection.add(value);
}

function updateProgress() {
  const total = flatPhrases.length;
  const learned = state.learned.size;
  const favorites = state.favorites.size;
  const hard = state.hard.size;
  const percent = total ? Math.round((learned / total) * 100) : 0;

  refs.progressText.textContent = `${learned}/${total} đã học (${percent}%)`;
  refs.progressBar.style.width = `${percent}%`;
  refs.statsText.textContent = `Yêu thích: ${favorites} · Khó: ${hard}`;
}

function speakKorean(text, rate = 1) {
  if (!('speechSynthesis' in window)) {
    alert('Thiết bị chưa hỗ trợ Web Speech API. Bạn có thể dùng bản ghi âm của bạn trong từng thẻ học.');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = rate;
  utterance.pitch = 1;

  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(voice => voice.lang.toLowerCase().startsWith('ko'));
  if (preferred) utterance.voice = preferred;

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function openRecordingDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RECORDING_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('recordings')) {
        db.createObjectStore('recordings');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveRecording(phraseId, blob) {
  const db = await openRecordingDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readwrite');
    tx.objectStore('recordings').put(blob, phraseId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getRecording(phraseId) {
  const db = await openRecordingDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readonly');
    const req = tx.objectStore('recordings').get(phraseId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteRecording(phraseId) {
  const db = await openRecordingDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readwrite');
    tx.objectStore('recordings').delete(phraseId);
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

  const existingBlob = await getRecording(phraseId).catch(() => null);
  status.textContent = existingBlob ? 'Đã có bản ghi âm cá nhân.' : 'Chưa có bản ghi âm cá nhân.';

  recordBtn.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert('Thiết bị chưa hỗ trợ ghi âm trên trình duyệt này.');
      return;
    }

    if (state.recording.mediaRecorder) {
      alert('Đang có một bản ghi khác. Hãy dừng trước khi ghi tiếp.');
      return;
    }

    try {
      state.recording.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.recording.mediaRecorder = new MediaRecorder(state.recording.stream);
      state.recording.phraseId = phraseId;
      state.recording.chunks = [];

      state.recording.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) state.recording.chunks.push(event.data);
      };

      state.recording.mediaRecorder.onstop = async () => {
        const blob = new Blob(state.recording.chunks, { type: 'audio/webm' });
        await saveRecording(phraseId, blob);
        status.textContent = 'Đã lưu bản ghi âm của bạn.';
        cleanupRecorder();
        stopBtn.disabled = true;
      };

      state.recording.mediaRecorder.start();
      status.textContent = 'Đang ghi âm...';
      stopBtn.disabled = false;
    } catch (error) {
      alert('Không thể truy cập micro. Vui lòng cấp quyền micro cho trang.');
      console.error(error);
      cleanupRecorder();
    }
  });

  stopBtn.addEventListener('click', () => {
    if (state.recording.mediaRecorder && state.recording.phraseId === phraseId) {
      state.recording.mediaRecorder.stop();
      stopBtn.disabled = true;
    }
  });

  playBtn.addEventListener('click', async () => {
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
  });

  deleteBtn.addEventListener('click', async () => {
    await deleteRecording(phraseId);
    status.textContent = 'Đã xóa bản ghi âm cá nhân.';
  });
}

function cleanupRecorder() {
  if (state.recording.stream) {
    state.recording.stream.getTracks().forEach(track => track.stop());
  }
  state.recording.mediaRecorder = null;
  state.recording.stream = null;
  state.recording.phraseId = null;
  state.recording.chunks = [];
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(error => {
      console.warn('SW register fail:', error);
    });
  });
}

window.addEventListener('DOMContentLoaded', init);
