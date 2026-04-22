const STORAGE_KEY = 'ktour-v6-progress';
const RECORDING_DB = 'ktour-v6-recordings';

const WORD_DICT = {
  안녕하세요: { vi: 'xin chào', type: 'Thuần Hàn', root: '안녕하다' },
  감사합니다: { vi: 'cảm ơn', type: 'Hán Hàn', root: '感謝 + 하다' },
  죄송합니다: { vi: 'xin lỗi', type: 'Hán Hàn', root: '罪悚 + 하다' },
  부탁드립니다: { vi: 'xin nhờ / mong giúp đỡ', type: 'Hán Hàn', root: '付託 + 드리다' },
  안내: { vi: 'hướng dẫn', type: 'Hán Hàn', root: '案內' },
  안내드리겠습니다: { vi: 'xin được hướng dẫn', type: 'Hán Hàn', root: '안내드리다' },
  이동: { vi: 'di chuyển', type: 'Hán Hàn', root: '移動' },
  이동하겠습니다: { vi: 'sẽ di chuyển', type: 'Hán Hàn', root: '이동하다' },
  출발합니다: { vi: 'xuất phát', type: 'Hán Hàn', root: '出發하다' },
  도착합니다: { vi: 'đến nơi', type: 'Hán Hàn', root: '到着하다' },
  도착했습니다: { vi: 'đã đến nơi', type: 'Hán Hàn', root: '到着하다' },
  시간: { vi: 'thời gian', type: 'Hán Hàn', root: '時間' },
  오늘: { vi: 'hôm nay', type: 'Thuần Hàn' },
  내일: { vi: 'ngày mai', type: 'Thuần Hàn' },
  여기: { vi: 'ở đây', type: 'Thuần Hàn' },
  저쪽: { vi: 'phía kia', type: 'Thuần Hàn' },
  와주세요: { vi: 'hãy đến', type: 'Thuần Hàn', root: '오다' },
  따라오세요: { vi: 'hãy đi theo', type: 'Thuần Hàn', root: '따라오다' },
  말씀해: { vi: 'nói (kính ngữ)', type: 'Thuần Hàn', root: '말씀하다' },
  주세요: { vi: 'xin vui lòng', type: 'Thuần Hàn', root: '주다' },
  여권: { vi: 'hộ chiếu', type: 'Hán Hàn', root: '旅券' },
  짐: { vi: 'hành lý', type: 'Thuần Hàn' },
  수하물: { vi: 'hành lý ký gửi', type: 'Hán Hàn', root: '手荷物' },
  공항: { vi: 'sân bay', type: 'Hán Hàn', root: '空港' },
  호텔: { vi: 'khách sạn', type: 'Borrowed' },
  객실: { vi: 'phòng khách sạn', type: 'Hán Hàn', root: '客室' },
  체크인: { vi: 'check-in', type: 'Borrowed' },
  체크아웃: { vi: 'check-out', type: 'Borrowed' },
  식사: { vi: 'bữa ăn', type: 'Hán Hàn', root: '食事' },
  메뉴: { vi: 'thực đơn', type: 'Borrowed' },
  추천: { vi: 'đề xuất', type: 'Hán Hàn', root: '推薦' },
  알레르기: { vi: 'dị ứng', type: 'Borrowed' },
  가격: { vi: 'giá cả', type: 'Hán Hàn', root: '價格' },
  확인: { vi: 'kiểm tra', type: 'Hán Hàn', root: '確認' },
  영수증: { vi: 'hóa đơn', type: 'Hán Hàn', root: '領收證' },
  안전: { vi: 'an toàn', type: 'Hán Hàn', root: '安全' },
  안전벨트: { vi: 'dây an toàn', type: 'Hán Hàn + Borrowed', root: '安全 + belt' },
  버스: { vi: 'xe buýt', type: 'Borrowed' },
  기사님: { vi: 'tài xế (kính ngữ)', type: 'Thuần Hàn' },
  사진: { vi: 'hình ảnh', type: 'Hán Hàn', root: '寫眞' },
  사찰: { vi: 'chùa', type: 'Hán Hàn', root: '寺刹' },
  조용히: { vi: 'yên lặng', type: 'Thuần Hàn', root: '조용하다' },
  기도: { vi: 'cầu nguyện', type: 'Hán Hàn', root: '祈禱' },
  쇼핑: { vi: 'mua sắm', type: 'Borrowed' },
  긴급: { vi: 'khẩn cấp', type: 'Hán Hàn', root: '緊急' },
  상황: { vi: 'tình huống', type: 'Hán Hàn', root: '狀況' },
  병원: { vi: 'bệnh viện', type: 'Hán Hàn', root: '病院' },
  경찰서: { vi: 'đồn cảnh sát', type: 'Hán Hàn', root: '警察署' }
};

const ENDING_RULES = [
  { suffix: '하겠습니다', rootSuffix: '하다', meaning: 'sẽ làm (kính ngữ trang trọng)' },
  { suffix: '드립니다', rootSuffix: '드리다', meaning: 'xin gửi/làm cho (kính ngữ)' },
  { suffix: '했습니다', rootSuffix: '하다', meaning: 'đã làm' },
  { suffix: '합니다', rootSuffix: '하다', meaning: 'làm (trang trọng)' },
  { suffix: '해 주세요', rootSuffix: '하다', meaning: 'xin hãy làm' },
  { suffix: '주세요', rootSuffix: '주다', meaning: 'xin vui lòng' },
  { suffix: '세요', rootSuffix: '다', meaning: 'đuôi mệnh lệnh lịch sự' },
  { suffix: '입니다', rootSuffix: '이다', meaning: 'là (trang trọng)' }
];

const PARTICLE_RULES = [
  { suffix: '에서는', meaning: 'tại/ở (nhấn mạnh chủ điểm)' },
  { suffix: '으로', meaning: 'đến/về phía; bằng (phương hướng/cách thức)' },
  { suffix: '에서', meaning: 'tại/ở (địa điểm hành động)' },
  { suffix: '에게', meaning: 'cho/đến (người nhận)' },
  { suffix: '부터', meaning: 'từ (mốc bắt đầu)' },
  { suffix: '까지', meaning: 'đến (mốc kết thúc)' },
  { suffix: '으로', meaning: 'hướng/về phía' },
  { suffix: '로', meaning: 'hướng/về phía' },
  { suffix: '를', meaning: 'tiểu từ tân ngữ' },
  { suffix: '을', meaning: 'tiểu từ tân ngữ' },
  { suffix: '는', meaning: 'tiểu từ chủ đề' },
  { suffix: '은', meaning: 'tiểu từ chủ đề' },
  { suffix: '이', meaning: 'tiểu từ chủ ngữ' },
  { suffix: '가', meaning: 'tiểu từ chủ ngữ' },
  { suffix: '에', meaning: 'tại/đến (vị trí, thời điểm)' },
  { suffix: '와', meaning: 'và/cùng với' },
  { suffix: '과', meaning: 'và/cùng với' },
  { suffix: '도', meaning: 'cũng' },
  { suffix: '만', meaning: 'chỉ' }
];

const SYLLABLE_DICT = {
  안: 'bình an', 녕: 'yên ổn', 하: 'làm/thực hiện', 세: 'đuôi kính ngữ', 요: 'đuôi lịch sự',
  감: 'cảm', 사: 'ơn/cảm tạ', 부: 'phó/nhờ', 탁: 'gửi gắm', 드: 'kính gửi', 림: 'hành động kính',
  이: 'chủ ngữ/người', 동: 'di chuyển', 출: 'ra', 발: 'khởi hành', 도: 'đến/cũng', 착: 'đến nơi',
  시: 'giờ', 간: 'khoảng/thời', 오: 'đến', 늘: 'hôm nay', 내: 'bên trong/ngày mai', 일: 'ngày',
  여: 'nơi này', 권: 'quyển/giấy', 짐: 'hành lý', 공: 'công/công cộng', 항: 'cảng', 호: 'số/hồ',
  텔: 'hotel (mượn)', 객: 'khách', 실: 'phòng', 체: 'check', 크: 'check', 인: 'vào', 아: 'ra',
  웃: 'out (mượn)', 식: 'ăn', 메: 'menu (mượn)', 뉴: 'menu (mượn)', 추: 'đẩy/cử', 천: 'đề cử',
  가: 'đi/chủ ngữ', 격: 'mức/khung', 확: 'chắc', 영: 'lãnh/nhận', 수: 'thu/nhận', 증: 'chứng',
  안: 'an', 전: 'toàn', 벨: 'belt (mượn)', 트: 'belt (mượn)', 버: 'bus (mượn)', 스: 'bus (mượn)',
  기: 'khí/cơ', 사: 'sự việc', 진: 'ảnh', 찰: 'chùa/quan sát', 조: 'điều hòa', 용: 'dùng/yên',
  긴: 'gấp', 급: 'khẩn', 상: 'trạng', 황: 'hoàn cảnh', 병: 'bệnh', 원: 'viện', 경: 'cảnh', 서: 'sở'
};

const state = {
  view: 'learn',
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
  },
  quiz: {
    index: 0,
    score: 0,
    selected: null
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
  startClock();
  render();
  registerServiceWorker();
}

function startClock() {
  const badge = document.getElementById('clockBadge');
  if (!badge) return;
  const tick = () => {
    const now = new Date();
    badge.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  tick();
  setInterval(tick, 30000);
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
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.view = tab.dataset.view || 'learn';
      document.querySelectorAll('.tab').forEach(other => other.classList.toggle('active', other === tab));
      render();
    });
  });

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
  if (state.view === 'quiz') return renderQuizView();
  if (state.view === 'review') return renderReviewView();
  if (state.view === 'stats') return renderStatsView();
  return renderLearnView();
}

function renderLearnView() {
  const data = getFilteredPhrases();
  const MAX_RENDER = 80;
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
    note.textContent = `Đang hiển thị ${MAX_RENDER}/${data.length} cụm từ để học mượt trên điện thoại. Hãy lọc theo chủ đề/từ khóa để học sâu.`;
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
    renderWordAnalysis(node, item.ko);

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

function renderQuizView() {
  refs.flashcardList.innerHTML = '';
  const data = getFilteredPhrases();
  if (!data.length) {
    refs.flashcardList.innerHTML = '<p class="empty">Không có dữ liệu để làm quiz.</p>';
    return;
  }

  const current = data[state.quiz.index % data.length];
  const options = pickQuizOptions(data, current);
  const card = document.createElement('section');
  card.className = 'quiz-panel';
  card.innerHTML = `
    <h3>Quiz ${state.quiz.index + 1}/${data.length}</h3>
    <p><strong>Nghĩa tiếng Việt:</strong> ${current.vi}</p>
    <p><strong>Chọn cụm tiếng Hàn đúng:</strong></p>
    <div class="quiz-options"></div>
    <p class="quiz-score">Điểm: ${state.quiz.score}</p>
    <button class="quiz-next" type="button">Câu tiếp theo</button>
  `;
  const optionWrap = card.querySelector('.quiz-options');
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = option.ko;
    btn.addEventListener('click', () => {
      const correct = option.id === current.id;
      btn.classList.add(correct ? 'correct' : 'wrong');
      if (correct) state.quiz.score += 1;
      state.quiz.selected = option.id;
    });
    optionWrap.append(btn);
  });

  card.querySelector('.quiz-next').addEventListener('click', () => {
    state.quiz.index += 1;
    state.quiz.selected = null;
    renderQuizView();
  });

  refs.flashcardList.append(card);
}

function pickQuizOptions(data, current) {
  const pool = [...data].filter(item => item.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3);
  return [current, ...pool].sort(() => Math.random() - 0.5);
}

function renderReviewView() {
  refs.flashcardList.innerHTML = '';
  const reviewSet = flatPhrases.filter(item => state.hard.has(item.id) || !state.learned.has(item.id));
  if (!reviewSet.length) {
    refs.flashcardList.innerHTML = '<p class="empty">Bạn đã thuộc hết rồi! Tuyệt vời 🎉</p>';
    return;
  }

  const intro = document.createElement('p');
  intro.className = 'empty';
  intro.textContent = `Ôn tập: ${reviewSet.length} cụm từ (từ khó + chưa học).`;
  refs.flashcardList.append(intro);

  reviewSet.slice(0, 100).forEach(item => {
    const line = document.createElement('article');
    line.className = 'review-item';
    line.innerHTML = `
      <p class="review-ko">${item.ko}</p>
      <p class="review-vi">${item.vi}</p>
      <div class="review-actions">
        <button type="button" class="quick-speak">🔊 Nghe</button>
        <button type="button" class="quick-known">✔ Đã nhớ</button>
      </div>
    `;
    line.querySelector('.quick-speak').addEventListener('click', () => speakKorean(item.ko, 0.85));
    line.querySelector('.quick-known').addEventListener('click', () => {
      state.learned.add(item.id);
      state.hard.delete(item.id);
      persistState();
      renderReviewView();
      updateProgress();
    });
    refs.flashcardList.append(line);
  });
}

function renderStatsView() {
  refs.flashcardList.innerHTML = '';
  const panel = document.createElement('section');
  panel.className = 'stats-panel';
  const rows = PHRASE_TOPICS.map(topic => {
    const learned = topic.phrases.filter(p => state.learned.has(p.id)).length;
    return `<tr><td>${topic.name}</td><td>${learned}/${topic.phrases.length}</td><td>${Math.round((learned / topic.phrases.length) * 100)}%</td></tr>`;
  }).join('');

  panel.innerHTML = `
    <h3>Thống kê học tập</h3>
    <p>Tổng đã học: ${state.learned.size}/${flatPhrases.length}</p>
    <p>Yêu thích: ${state.favorites.size} · Từ khó: ${state.hard.size}</p>
    <table class="stats-table">
      <thead><tr><th>Chủ đề</th><th>Tiến độ</th><th>%</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  refs.flashcardList.append(panel);
}

function renderWordAnalysis(node, sentence) {
  const container = node.querySelector('.word-analysis-list');
  container.innerHTML = '';
  const words = analyzeWords(sentence);

  words.forEach(word => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'word-chip';
    chip.innerHTML = `
      <span class="word-ko">🔊 ${word.token}</span>
      <span class="word-vi">${word.meaning}</span>
      <span class="word-meta-row">
        <span class="word-badge type">${word.type}</span>
        ${word.root ? `<span class="word-badge root">Gốc: ${word.root}</span>` : '<span class="word-badge root">Gốc: —</span>'}
      </span>
    `;
    chip.addEventListener('click', () => speakKorean(word.token, 0.8));
    container.append(chip);
  });
}

function analyzeWords(sentence) {
  const normalized = sentence
    .replace(/[.,!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return [];

  return normalized.split(' ').map(token => {
    const dict = WORD_DICT[token];
    if (dict) {
      return {
        token,
        meaning: dict.vi,
        type: dict.type,
        root: dict.root || ''
      };
    }

    const particleMatch = detectParticleToken(token);
    if (particleMatch) {
      return particleMatch;
    }

    const endingMatch = detectEnding(token);
    if (endingMatch) {
      return {
        token,
        meaning: endingMatch.meaning,
        type: 'Động từ chia đuôi',
        root: endingMatch.root
      };
    }

    return {
      token,
      meaning: explainUnknownToken(token),
      type: guessWordType(token),
      root: inferRoot(token)
    };
  });
}

function explainUnknownToken(token) {
  const parts = splitKnownParts(token);
  if (parts.length) return parts.map(part => `${part.text}: ${part.meaning}`).join(' · ');
  const syllables = [...token];
  return syllables.map(char => `${char}: ${SYLLABLE_DICT[char] || `thành phần của "${token}"`}`).join(' · ');
}

function inferRoot(token) {
  const particle = detectParticleToken(token);
  if (particle?.root) return particle.root;
  const ending = detectEnding(token);
  if (ending?.root) return ending.root;
  return token;
}

function splitKnownParts(token) {
  const keys = Object.keys(WORD_DICT).sort((a, b) => b.length - a.length);
  const parts = [];
  let rest = token;

  while (rest.length > 0) {
    const hit = keys.find(key => rest.startsWith(key));
    if (!hit) break;
    parts.push({ text: hit, meaning: WORD_DICT[hit].vi });
    rest = rest.slice(hit.length);
  }

  if (parts.length && rest.length === 0) return parts;
  return [];
}

function detectParticleToken(token) {
  for (const particle of PARTICLE_RULES) {
    if (!token.endsWith(particle.suffix) || token.length <= particle.suffix.length) continue;
    const stem = token.slice(0, token.length - particle.suffix.length);
    const baseInfo = WORD_DICT[stem];
    if (!baseInfo) continue;

    return {
      token,
      meaning: `${baseInfo.vi} + ${particle.meaning}`,
      type: `${baseInfo.type} + ngữ pháp`,
      root: baseInfo.root || stem
    };
  }
  return null;
}

function detectEnding(token) {
  for (const rule of ENDING_RULES) {
    if (token.endsWith(rule.suffix)) {
      const stem = token.slice(0, token.length - rule.suffix.length);
      const root = stem ? `${stem}${rule.rootSuffix}` : rule.rootSuffix;
      return { root, meaning: rule.meaning };
    }
  }
  return null;
}

function guessWordType(token) {
  if (/[A-Za-z]/.test(token) || token.includes('카') || token.includes('버스')) return 'Borrowed';
  if (token.endsWith('합니다') || token.endsWith('하다') || token.endsWith('시간') || token.endsWith('권')) return 'Hán Hàn';
  return 'Thuần Hàn / chưa gắn nhãn';
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
    alert('Thiết bị chưa hỗ trợ Web Speech API.');
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
      if (!db.objectStoreNames.contains('recordings')) db.createObjectStore('recordings');
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
  if (state.recording.stream) state.recording.stream.getTracks().forEach(track => track.stop());
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
