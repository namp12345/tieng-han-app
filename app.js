const STORAGE_KEY = 'ktour-v6-progress';

const state = {
  topic: 'all',
  query: '',
  mode: 'all',
  random: false,
  favorites: new Set(),
  hard: new Set(),
  learned: new Set()
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
    option.textContent = topic.name;
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

  if (state.topic !== 'all') {
    list = list.filter(item => item.topicId === state.topic);
  }

  if (state.mode === 'favorites') {
    list = list.filter(item => state.favorites.has(item.id));
  }

  if (state.mode === 'hard') {
    list = list.filter(item => state.hard.has(item.id));
  }

  if (state.query) {
    list = list.filter(item => {
      const haystack = [item.ko, item.vi, item.roman, item.breakdown, item.root, item.note]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(state.query);
    });
  }

  if (state.random) {
    list.sort(() => Math.random() - 0.5);
  }

  return list;
}

function render() {
  const data = getFilteredPhrases();
  refs.flashcardList.innerHTML = '';

  if (!data.length) {
    refs.flashcardList.innerHTML = '<p class="empty">Không tìm thấy cụm từ phù hợp. Hãy đổi bộ lọc hoặc từ khóa.</p>';
    updateProgress();
    return;
  }

  data.forEach(item => {
    const node = refs.template.content.firstElementChild.cloneNode(true);
    const topicPill = node.querySelector('.topic-pill');
    const favoriteBtn = node.querySelector('.favorite-toggle');
    const front = node.querySelector('.front');
    const back = node.querySelector('.back');

    topicPill.textContent = item.topicName;
    node.querySelector('.ko').textContent = item.ko;
    node.querySelector('.vi').textContent = item.vi;
    node.querySelector('.roman').textContent = item.roman;

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
    });

    node.querySelector('.hard-btn').addEventListener('click', () => {
      toggleSet(state.hard, item.id);
      persistState();
      updateProgress();
      node.classList.toggle('hard', state.hard.has(item.id));
    });

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
  if (collection.has(value)) {
    collection.delete(value);
    return;
  }
  collection.add(value);
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
    alert('Thiết bị chưa hỗ trợ Web Speech API. Bạn có thể thêm file audio thật theo cấu trúc /audio/<topic>/<phrase-id>.mp3');
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

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(error => {
      console.warn('SW register fail:', error);
    });
  });
}

window.addEventListener('DOMContentLoaded', init);
