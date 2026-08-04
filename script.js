(function () {
  var config = window.FLASHCARD_CONFIG || {};
  var endpoint = String(config.APPS_SCRIPT_WEB_APP_URL || '').trim();
  var fallbackPlayerName = config.DEFAULT_PLAYER_NAME || 'Nguoi hoc';
  var pointsCorrect = Number(config.POINTS_CORRECT || 10);
  var pointsWrong = Number(config.POINTS_WRONG || -4);
  var recentWindow = Number(config.RECENT_WINDOW || 6);
  var cacheVersion = 'v2';
  var cacheMaxAge = 24 * 60 * 60 * 1000;

  var els = {
    pages: {
      home: document.getElementById('pageHome'),
      game: document.getElementById('pageGame'),
      board: document.getElementById('pageBoard')
    },
    playerName: document.getElementById('playerName'),
    exitButton: document.getElementById('exitButton'),
    playerAvatar: document.getElementById('playerAvatar'),
    refreshButton: document.getElementById('refreshButton'),
    sheetList: document.getElementById('sheetList'),
    startButton: document.getElementById('startButton'),
    connectionStatus: document.getElementById('connectionStatus'),
    leaderboardButton: document.getElementById('leaderboardButton'),
    totalPlayers: document.getElementById('totalPlayers'),
    totalPlays: document.getElementById('totalPlays'),
    leaderboard: document.getElementById('leaderboard'),
    activeSheetLabel: document.getElementById('activeSheetLabel'),
    gameTitle: document.getElementById('gameTitle'),
    scoreValue: document.getElementById('scoreValue'),
    correctCount: document.getElementById('correctCount'),
    wrongCount: document.getElementById('wrongCount'),
    streakCount: document.getElementById('streakCount'),
    cardShell: document.getElementById('cardShell'),
    flashcard: document.getElementById('flashcard'),
    answerForm: document.getElementById('answerForm'),
    answerInput: document.getElementById('answerInput'),
    submitButton: document.getElementById('submitButton'),
    feedback: document.getElementById('feedback')
  };

  var faces = Array.prototype.slice.call(els.flashcard.querySelectorAll('.card-face')).map(function (face) {
    return {
      root: face,
      kicker: face.querySelector('.card-kicker'),
      vietnamese: face.querySelector('.vietnamese-text'),
      pronunciation: face.querySelector('.pronunciation-text'),
      note: face.querySelector('.note-text')
    };
  });

  var state = {
    page: 'home',
    sheets: [],
    pendingSheet: '',
    activeSheet: '',
    words: [],
    current: null,
    recentIds: [],
    loadingMore: false,
    score: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    requestId: 0,
    bestSubmittedScore: 0,
    selectionToken: 0,
    backgroundTimer: 0,
    faceIndex: 0,
    voiceWarned: false
  };

  var SHEET_ICON_RULES = [
    { keys: ['starter', 'beginner', 'co ban', 'vo long'], icon: '⭐' },
    { keys: ['mover'], icon: '🚀' },
    { keys: ['flyer'], icon: '✈️' },
    { keys: ['sat'], icon: '🎓' },
    { keys: ['ielts'], icon: '📖' },
    { keys: ['toeic', 'toefl'], icon: '🧭' },
    { keys: ['bank', 'ngan hang', 'tai chinh'], icon: '🏛️' },
    { keys: ['ai', 'tri tue nhan tao', 'machine learning'], icon: '🤖' },
    { keys: ['english', 'tieng anh'], icon: '🔤' },
    { keys: ['japanese', 'tieng nhat', 'nhat'], icon: '🗾' },
    { keys: ['korean', 'tieng han', 'han quoc'], icon: '🇰🇷' },
    { keys: ['chinese', 'tieng trung', 'trung quoc', 'hoa'], icon: '🀄' },
    { keys: ['thai', 'thai lan'], icon: '🐘' },
    { keys: ['deutsch', 'german', 'tieng duc'], icon: '🥨' },
    { keys: ['french', 'phap'], icon: '🥐' },
    { keys: ['medical', 'y khoa', 'suc khoe'], icon: '🩺' },
    { keys: ['business', 'kinh doanh', 'thuong mai'], icon: '💼' },
    { keys: ['travel', 'du lich'], icon: '🧳' },
    { keys: ['kid', 'tre em', 'thieu nhi'], icon: '🧸' }
  ];

  var FALLBACK_ICONS = ['📘', '🌟', '🍀', '🎯', '🧩', '🎨', '🔔', '🌈', '🧠', '🦉', '🐳', '🚂'];
  var AVATARS = ['👦', '👧', '🧒', '👨‍🎓', '👩‍🎓', '🧑', '👨‍🏫', '👩‍🏫', '🧑‍🎓', '👱‍♀️', '👱', '🧑‍🏫'];
  var RANK_BADGES = ['🥇', '🥈', '🥉'];

  function hashOf(value) {
    var text = String(value || '');
    var hash = 0;
    for (var i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) % 100000;
    }
    return hash;
  }

  /** Khớp theo từ trong tên sheet: "Starters" vẫn nhận icon của "starter". */
  function matchesKey(words, key) {
    var keyWords = key.split(' ');
    for (var i = 0; i + keyWords.length <= words.length; i += 1) {
      var hit = true;
      for (var j = 0; j < keyWords.length; j += 1) {
        var word = words[i + j];
        var part = keyWords[j];
        var last = j === keyWords.length - 1;
        if (word !== part && !(last && part.length >= 4 && word.indexOf(part) === 0)) {
          hit = false;
          break;
        }
      }
      if (hit) return true;
    }
    return false;
  }

  function sheetIcon(name) {
    var normalized = normalize(name);
    var words = normalized.split(' ').filter(Boolean);
    for (var i = 0; i < SHEET_ICON_RULES.length; i += 1) {
      for (var j = 0; j < SHEET_ICON_RULES[i].keys.length; j += 1) {
        if (matchesKey(words, SHEET_ICON_RULES[i].keys[j])) return SHEET_ICON_RULES[i].icon;
      }
    }
    return FALLBACK_ICONS[hashOf(normalized) % FALLBACK_ICONS.length];
  }

  function avatarFor(name) {
    return AVATARS[hashOf(normalize(name)) % AVATARS.length];
  }

  function cacheKey(type, name) {
    return 'flashcard-' + cacheVersion + '-' + type + (name ? '-' + encodeURIComponent(name) : '');
  }

  function readCache(type, name, maxAge) {
    try {
      var cached = JSON.parse(localStorage.getItem(cacheKey(type, name)) || 'null');
      if (!cached || !cached.savedAt || Date.now() - cached.savedAt > (maxAge || cacheMaxAge)) return null;
      return cached.value;
    } catch (err) {
      return null;
    }
  }

  function writeCache(type, name, value) {
    try {
      localStorage.setItem(cacheKey(type, name), JSON.stringify({ savedAt: Date.now(), value: value }));
    } catch (err) {}
  }

  function setStatus(text, mode) {
    els.connectionStatus.textContent = text;
    els.connectionStatus.dataset.mode = mode || '';
  }

  function normalize(value) {
    var text = String(value || '')
      .toLocaleLowerCase()
      .normalize('NFKC')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u0111/g, 'd')
      .replace(/[\u2019']/g, '');

    try {
      return text.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    } catch (err) {
      return text.replace(/[^\w\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]+/g, ' ').trim();
    }
  }

  function withoutOptionalAbbreviation(value) {
    var text = compactSpaces(value);
    var match = text.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    if (!match) return text;
    var abbreviation = compactSpaces(match[2]);
    if (!abbreviation || abbreviation.length > 16 || abbreviation.split(' ').length > 2) return text;
    if (/[,;:!?()[\]{}]/.test(abbreviation)) return text;
    var uppercaseCount = (abbreviation.match(/[A-Z]/g) || []).length;
    if (uppercaseCount < 2 && !/[0-9.]/.test(abbreviation)) return text;
    return compactSpaces(match[1]) || text;
  }

  function acceptedAnswerVariants(values) {
    var seen = {};
    var variants = [];
    (values || []).forEach(function (value) {
      [value, withoutOptionalAbbreviation(value)].forEach(function (candidate) {
        var normalized = normalize(candidate);
        if (normalized && !seen[normalized]) {
          seen[normalized] = true;
          variants.push(normalized);
        }
      });
    });
    return variants;
  }

  function compactSpaces(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function getPlayerName() {
    return compactSpaces(els.playerName.value) || fallbackPlayerName;
  }

  function savePlayerName() {
    try {
      localStorage.setItem('flashcardPlayerName', getPlayerName());
    } catch (err) {}
    updatePlayerAvatar();
  }

  function loadPlayerName() {
    try {
      els.playerName.value = localStorage.getItem('flashcardPlayerName') || '';
    } catch (err) {}
    updatePlayerAvatar();
  }

  function updatePlayerAvatar() {
    var typed = compactSpaces(els.playerName.value);
    els.playerAvatar.textContent = typed ? avatarFor(typed) : '🤖';
  }

  function showPage(name) {
    if (!els.pages[name]) return;
    state.page = name;
    document.body.dataset.page = name;
    Object.keys(els.pages).forEach(function (key) {
      els.pages[key].hidden = key !== name;
    });
    try {
      window.scrollTo(0, 0);
    } catch (err) {}
    if (name === 'game' && !els.answerInput.disabled) els.answerInput.focus();
  }

  function api(params, timeoutMs) {
    return new Promise(function (resolve, reject) {
      if (!endpoint) {
        reject(new Error('Chưa cấu hình Apps Script.'));
        return;
      }

      state.requestId += 1;
      var callbackName = 'flashcardCallback_' + Date.now() + '_' + state.requestId;
      var script = document.createElement('script');
      var timer = window.setTimeout(function () {
        cleanup();
        reject(new Error('Apps Script phản hồi quá chậm. Vui lòng bấm tải lại hoặc thử lại sau ít phút.'));
      }, timeoutMs || 240000);

      function cleanup() {
        window.clearTimeout(timer);
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = function (payload) {
        cleanup();
        if (payload && payload.ok === false) reject(new Error(payload.error || 'Apps Script báo lỗi.'));
        else resolve(payload || {});
      };

      var query = Object.keys(params || {}).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      });
      query.push('callback=' + encodeURIComponent(callbackName));
      script.src = endpoint + (endpoint.indexOf('?') === -1 ? '?' : '&') + query.join('&');
      script.onerror = function () {
        cleanup();
        reject(new Error('Không kết nối được Apps Script.'));
      };
      document.body.appendChild(script);
    });
  }

  function renderSheets() {
    els.sheetList.textContent = '';
    if (!state.sheets.length) {
      var empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Chưa có sheet từ vựng.';
      els.sheetList.appendChild(empty);
      updateStartButton();
      return;
    }

    state.sheets.forEach(function (sheet) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'sheet-button';
      button.dataset.active = sheet.name === state.pendingSheet ? 'true' : 'false';

      var icon = document.createElement('span');
      icon.className = 'sheet-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = sheetIcon(sheet.name);

      var label = document.createElement('span');
      label.className = 'sheet-name';
      label.textContent = sheet.name;

      var count = document.createElement('span');
      count.className = 'sheet-count';
      count.textContent = Number(sheet.count || 0);

      button.appendChild(icon);
      button.appendChild(label);
      button.appendChild(count);
      button.addEventListener('click', function () {
        pickSheet(sheet.name);
      });
      els.sheetList.appendChild(button);
    });

    updateStartButton();
  }

  function pickSheet(sheetName) {
    state.pendingSheet = sheetName;
    renderSheets();
  }

  function updateStartButton() {
    els.startButton.disabled = !state.pendingSheet;
  }

  function renderStats(stats) {
    stats = stats || {};
    els.totalPlayers.textContent = Number(stats.totalPlayers || 0).toLocaleString('vi-VN');
    els.totalPlays.textContent = Number(stats.totalPlays || 0).toLocaleString('vi-VN');
    renderLeaderboard(stats.leaderboard || []);
  }

  function renderLeaderboard(items) {
    els.leaderboard.textContent = '';
    if (!items.length) {
      var empty = document.createElement('li');
      empty.className = 'muted-row';
      empty.textContent = 'Chưa có điểm.';
      els.leaderboard.appendChild(empty);
      return;
    }

    items.slice(0, 10).forEach(function (item, index) {
      var name = item.player || fallbackPlayerName;
      var row = document.createElement('li');

      var rank = document.createElement('span');
      rank.className = 'rank-badge';
      rank.dataset.top = index < 3 ? 'true' : 'false';
      rank.textContent = index < 3 ? RANK_BADGES[index] : String(index + 1);

      var avatar = document.createElement('span');
      avatar.className = 'player-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = avatarFor(name);

      var label = document.createElement('span');
      label.className = 'player-name';
      label.textContent = name;

      var score = document.createElement('strong');
      score.className = 'player-score';
      score.textContent = Number(item.score || 0).toLocaleString('vi-VN');

      row.appendChild(rank);
      row.appendChild(avatar);
      row.appendChild(label);
      row.appendChild(score);
      els.leaderboard.appendChild(row);
    });
  }

  function updateScoreboard() {
    els.scoreValue.textContent = state.score.toLocaleString('vi-VN');
    els.correctCount.textContent = state.correct + ' đúng';
    els.wrongCount.textContent = state.wrong + ' sai';
    els.streakCount.textContent = 'Chuỗi ' + state.streak;
  }

  function resetRound(sheetName) {
    state.activeSheet = sheetName;
    state.words = [];
    state.current = null;
    state.recentIds = [];
    state.loadingMore = false;
    state.score = 0;
    state.correct = 0;
    state.wrong = 0;
    state.streak = 0;
    state.bestSubmittedScore = 0;
    els.answerInput.value = '';
    setFeedback('', '');
    updateScoreboard();
  }

  function selectSheet(sheetName) {
    state.selectionToken += 1;
    var selectionToken = state.selectionToken;
    window.clearTimeout(state.backgroundTimer);
    resetRound(sheetName);
    renderSheets();
    setStatus('Đang tải ' + sheetName, 'pending');
    els.activeSheetLabel.textContent = sheetName;
    els.gameTitle.textContent = 'Bộ từ ' + sheetName;
    writeFace(visibleFace(), {
      kicker: 'Đang chuẩn bị thẻ',
      vi: '…'
    });
    setCardState('');
    els.answerInput.disabled = true;
    els.submitButton.disabled = true;

    var cachedWords = readCache('words', sheetName, cacheMaxAge);
    if (cachedWords && cachedWords.length) {
      activateWords(sheetName, cachedWords, selectionToken, true);
    }

    loadWords(sheetName)
      .then(function (payload) {
        if (selectionToken !== state.selectionToken) return;
        var words = validWords(payload.words || []);
        if (!words.length) {
          throw new Error('Sheet này chưa có đủ cột tiếng Việt và từ ngoại ngữ.');
        }
        writeCache('words', sheetName, words);
        if (!cachedWords || !state.current) activateWords(sheetName, words, selectionToken, false);
        else {
          state.words = mergeWords(state.words, words);
          setStatus('Đã cập nhật dữ liệu mới', 'ok');
        }
      })
      .catch(function (err) {
        if (selectionToken !== state.selectionToken) return;
        if (state.current) {
          setStatus('Đang dùng dữ liệu đã lưu', 'ok');
          return;
        }
        setStatus('Cần kiểm tra dữ liệu', 'error');
        writeFace(visibleFace(), {
          kicker: 'Không tải được bộ từ',
          vi: err.message
        });
      });
  }

  function validWords(words) {
    return (words || []).filter(function (word) {
      return word && word.vi && word.answer;
    });
  }

  function mergeWords(existingWords, newWords) {
    var byId = {};
    (existingWords || []).concat(newWords || []).forEach(function (word) {
      if (word && word.id) byId[word.id] = word;
    });
    return Object.keys(byId).map(function (id) { return byId[id]; });
  }

  function activateWords(sheetName, words, selectionToken, fromCache) {
    if (selectionToken !== state.selectionToken || sheetName !== state.activeSheet) return;
    state.words = validWords(words);
    if (!state.words.length) return;
    setStatus(fromCache ? 'Sẵn sàng từ dữ liệu đã lưu' : 'Đã sẵn sàng', 'ok');
    els.answerInput.disabled = false;
    els.submitButton.disabled = false;
    if (!state.current) {
      recordPlayStart();
      nextCard();
    }
  }

  function nextCard() {
    if (!state.words.length) return;
    var answered = state.correct + state.wrong;
    if ((state.words.length < 12 || (answered > 0 && answered % 20 === 0)) && !state.loadingMore) {
      fetchMoreWords();
    }
    var candidates = state.words.filter(function (word) {
      return state.recentIds.indexOf(word.id) === -1;
    });
    if (!candidates.length) candidates = state.words.slice();
    var chosen = candidates[Math.floor(Math.random() * candidates.length)];
    state.current = chosen;
    state.recentIds.push(chosen.id);
    while (state.recentIds.length > Math.min(recentWindow, Math.max(1, state.words.length - 1))) {
      state.recentIds.shift();
    }
    renderCard(chosen);
  }

  function loadWords(sheetName) {
    return api({ action: 'batch', sheet: sheetName, limit: 50 }, 90000)
      .catch(function () {
        return api({ action: 'words', sheet: sheetName }, 240000);
      });
  }

  function fetchMoreWords() {
    if (!state.activeSheet) return;
    state.loadingMore = true;
    api({ action: 'batch', sheet: state.activeSheet, limit: 40 }, 90000)
      .then(function (payload) {
        var existing = {};
        state.words.forEach(function (word) {
          existing[word.id] = true;
        });
        (payload.words || []).forEach(function (word) {
          if (word && word.vi && word.answer && !existing[word.id]) {
            state.words.push(word);
            existing[word.id] = true;
          }
        });
      })
      .catch(function () {})
      .finally(function () {
        state.loadingMore = false;
      });
  }

  function visibleFace() {
    return faces[state.faceIndex];
  }

  function hiddenFace() {
    return faces[1 - state.faceIndex];
  }

  function writeFace(face, content) {
    face.kicker.textContent = content.kicker || 'Dịch sang ngoại ngữ';
    face.vietnamese.textContent = content.vi || '';
    if (content.pronunciation) {
      face.pronunciation.textContent = content.pronunciation;
      face.pronunciation.hidden = false;
    } else {
      face.pronunciation.hidden = true;
    }
    if (content.note) {
      face.note.textContent = '(' + content.note + ')';
      face.note.hidden = false;
    } else {
      face.note.hidden = true;
    }
  }

  function setCardState(mode) {
    faces.forEach(function (face) {
      face.root.classList.remove('is-correct', 'is-wrong');
    });
    if (mode) visibleFace().root.classList.add(mode);
  }

  /** Thẻ lật sang mặt kia mỗi khi chuyển từ mới, đúng kiểu flashcard. */
  function renderCard(word) {
    var target = hiddenFace();
    writeFace(target, {
      kicker: 'Dịch sang ngoại ngữ',
      vi: word.vi,
      pronunciation: word.pronunciation,
      note: word.note
    });
    target.root.classList.remove('is-correct', 'is-wrong');
    state.faceIndex = 1 - state.faceIndex;
    els.flashcard.classList.toggle('is-flipped', state.faceIndex === 1);
    els.answerInput.value = '';
    if (state.page === 'game') els.answerInput.focus();
  }

  function setFeedback(text, mode) {
    els.feedback.textContent = text;
    els.feedback.dataset.mode = mode || '';
  }

  function submitAnswer() {
    if (!state.current) return;
    var answer = compactSpaces(els.answerInput.value);
    if (!answer) return;

    var accepted = acceptedAnswerVariants([state.current.answer].concat(state.current.aliases || []));
    var isCorrect = accepted.indexOf(normalize(answer)) >= 0;

    if (isCorrect) {
      state.score += pointsCorrect;
      state.correct += 1;
      state.streak += 1;
      setFeedback('Đúng: ' + state.current.answer, 'correct');
      setCardState('is-correct');
      speak(state.current.answer);
      updateScoreboard();
      submitScoreIfNeeded();
      window.setTimeout(nextCard, 520);
    } else {
      state.score += pointsWrong;
      state.wrong += 1;
      state.streak = 0;
      setFeedback('Sai rồi. Đáp án đúng: ' + state.current.answer, 'wrong');
      setCardState('is-wrong');
      els.cardShell.classList.remove('is-shaking');
      void els.cardShell.offsetWidth;
      els.cardShell.classList.add('is-shaking');
      updateScoreboard();
      submitScoreIfNeeded();
    }
  }

  function speak(text, forcedLangs) {
    var candidates = forcedLangs && forcedLangs.length
      ? forcedLangs
      : guessLanguageCandidates(state.activeSheet, text);
    var nativePlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativeTextToSpeech;
    if (nativePlugin && typeof nativePlugin.speak === 'function') {
      nativePlugin.speak({ text: text, lang: candidates[0], langs: candidates.join(','), rate: 0.92 })
        .catch(function () { speakInBrowser(text, candidates); });
      return;
    }
    speakInBrowser(text, candidates);
  }

  /** Im lặng vì thiếu giọng đọc rất khó hiểu, nên nói rõ một lần cho người chơi biết. */
  function warnMissingVoice() {
    if (state.voiceWarned) return;
    state.voiceWarned = true;
    var hint = document.createElement('span');
    hint.className = 'feedback-hint';
    hint.textContent = ' — Thiết bị chưa cài giọng đọc cho ngôn ngữ này.';
    els.feedback.appendChild(hint);
  }

  function speakInBrowser(text, candidates) {
    if (!('speechSynthesis' in window)) {
      warnMissingVoice();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      speakWithVoices(text, candidates, 0);
    } catch (err) {}
  }

  function speakWithVoices(text, candidates, attempt) {
    var utterance = new SpeechSynthesisUtterance(text);
    var voice = pickVoice(candidates);
    utterance.voice = voice;
    utterance.lang = voice ? voice.lang : candidates[0];
    utterance.rate = 0.92;

    if (!voice && attempt < 8 && window.speechSynthesis.getVoices().length === 0) {
      window.setTimeout(function () {
        speakWithVoices(text, candidates, attempt + 1);
      }, 160);
      return;
    }

    if (!voice) warnMissingVoice();
    window.speechSynthesis.speak(utterance);
  }

  function pickVoice(candidates) {
    if (!window.speechSynthesis || !window.speechSynthesis.getVoices) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    candidates = candidates || ['en-US'];

    for (var i = 0; i < candidates.length; i += 1) {
      var lang = String(candidates[i] || '').toLowerCase();
      var exact = voices.find(function (voice) {
        return String(voice.lang || '').toLowerCase() === lang;
      });
      if (exact) return exact;
    }

    for (var j = 0; j < candidates.length; j += 1) {
      var base = String(candidates[j] || '').split('-')[0].toLowerCase();
      var close = voices.find(function (voice) {
        return String(voice.lang || '').toLowerCase().indexOf(base) === 0;
      });
      if (close) return close;
    }

    return null;
  }

  /**
   * Chữ Hán dùng chung cho tiếng Trung, Nhật, Hàn nên chỉ nhìn mặt chữ là chưa đủ.
   * Khi tên bộ từ chỉ ra một ngôn ngữ hợp với hệ chữ đang thấy thì tên bộ từ được ưu tiên.
   */
  function guessLanguageCandidates(sheetName, text) {
    var value = String(text || '');
    var fromName = detectLanguageFromName(normalize(sheetName));
    var script = detectScript(value);
    var fromText = script ? script.langs : [];

    if (fromName.length && script && script.bases.indexOf(baseLanguage(fromName[0])) >= 0) {
      return dedupeLanguages(fromName.concat(fromText));
    }
    if (fromText.length) return dedupeLanguages(fromText.concat(fromName));
    if (fromName.length) return fromName;
    return /[a-z]/i.test(value) ? ['en-US'] : ['vi-VN'];
  }

  function baseLanguage(tag) {
    return String(tag || '').split('-')[0].toLowerCase();
  }

  function dedupeLanguages(tags) {
    var seen = {};
    return tags.filter(function (tag) {
      if (!tag || seen[tag]) return false;
      seen[tag] = true;
      return true;
    });
  }

  function detectScript(value) {
    var rules = [
      { test: /[\u0e00-\u0e7f]/, langs: ['th-TH'], bases: ['th'] },
      { test: /[\u0900-\u097f]/, langs: ['hi-IN', 'sa-IN'], bases: ['hi', 'sa', 'mr', 'ne'] },
      { test: /[\u3040-\u30ff]/, langs: ['ja-JP'], bases: ['ja'] },
      { test: /[\uac00-\ud7af]/, langs: ['ko-KR'], bases: ['ko'] },
      { test: /[\u3400-\u9fff]/, langs: ['zh-CN', 'zh-TW', 'zh-HK'], bases: ['zh', 'ja', 'ko'] },
      { test: /[\u0400-\u04ff]/, langs: ['ru-RU'], bases: ['ru', 'uk', 'bg', 'sr'] },
      { test: /[\u0370-\u03ff]/, langs: ['el-GR'], bases: ['el'] },
      { test: /[\u0590-\u05ff]/, langs: ['he-IL'], bases: ['he'] },
      { test: /[\u0600-\u06ff]/, langs: ['ar-SA', 'ar'], bases: ['ar', 'fa', 'ur'] }
    ];

    for (var i = 0; i < rules.length; i += 1) {
      if (rules[i].test.test(value)) return rules[i];
    }
    return null;
  }

  function detectLanguageFromName(name) {
    var rules = [
      { keys: ['english', 'tieng anh', 'anh'], langs: ['en-US', 'en-GB'] },
      { keys: ['japanese', 'japan', 'tieng nhat', 'nhat'], langs: ['ja-JP'] },
      { keys: ['korean', 'korea', 'tieng han', 'han quoc', 'han'], langs: ['ko-KR'] },
      { keys: ['chinese', 'china', 'mandarin', 'tieng trung', 'trung quoc', 'trung', 'hoa'], langs: ['zh-CN', 'zh-TW', 'zh-HK'] },
      { keys: ['thai', 'thailand', 'tieng thai', 'thai lan'], langs: ['th-TH'] },
      { keys: ['german', 'deutsch', 'deutsche', 'tieng duc', 'duc'], langs: ['de-DE'] },
      { keys: ['french', 'francais', 'tieng phap', 'phap'], langs: ['fr-FR'] },
      { keys: ['spanish', 'espanol', 'tieng tay ban nha', 'tay ban nha'], langs: ['es-ES', 'es-MX'] },
      { keys: ['sanskrit', 'phan', 'tieng phan'], langs: ['sa-IN', 'hi-IN'] },
      { keys: ['hindi', 'tieng hindi'], langs: ['hi-IN'] },
      { keys: ['russian', 'tieng nga', 'nga'], langs: ['ru-RU'] },
      { keys: ['greek', 'tieng hy lap', 'hy lap'], langs: ['el-GR'] },
      { keys: ['arabic', 'tieng a rap', 'a rap'], langs: ['ar-SA', 'ar'] }
    ];

    for (var i = 0; i < rules.length; i += 1) {
      if (rules[i].keys.some(function (key) { return name.indexOf(key) >= 0; })) {
        return rules[i].langs;
      }
    }
    return [];
  }

  function submitScoreIfNeeded() {
    if (state.score <= state.bestSubmittedScore) return;
    state.bestSubmittedScore = state.score;
    api({
      action: 'score',
      player: getPlayerName(),
      sheet: state.activeSheet,
      score: state.score,
      correct: state.correct,
      wrong: state.wrong
    }, 12000)
      .then(function (payload) {
        var stats = payload.stats || {};
        writeCache('stats', '', stats);
        renderStats(stats);
      })
      .catch(function () {});
  }

  function recordPlayStart() {
    api({
      action: 'start',
      player: getPlayerName(),
      sheet: state.activeSheet
    }, 12000)
      .then(function (payload) {
        var stats = payload.stats || {};
        writeCache('stats', '', stats);
        renderStats(stats);
      })
      .catch(function () {});
  }

  function loadHome() {
    var cachedSheets = readCache('sheets');
    var cachedStats = readCache('stats', '', 10 * 60 * 1000);
    if (!state.sheets.length && cachedSheets && cachedSheets.length) {
      state.sheets = cachedSheets;
      renderSheets();
      setStatus('Sẵn sàng', 'ok');
    } else if (!state.sheets.length && Array.isArray(config.FALLBACK_SHEETS) && config.FALLBACK_SHEETS.length) {
      state.sheets = config.FALLBACK_SHEETS.slice();
      renderSheets();
      setStatus('Sẵn sàng', 'ok');
    } else {
      setStatus('Đang tải dữ liệu', 'pending');
    }

    if (cachedStats) renderStats(cachedStats);

    api({ action: 'sheets' }, 60000)
      .then(function (payload) {
        state.sheets = payload.sheets || [];
        writeCache('sheets', '', state.sheets);
        if (state.pendingSheet && !state.sheets.some(function (sheet) { return sheet.name === state.pendingSheet; })) {
          state.pendingSheet = '';
        }
        renderSheets();
        setStatus('Đã kết nối', 'ok');
        scheduleBackgroundLoad();
      })
      .catch(function (err) {
        if (!state.sheets.length) {
          els.sheetList.textContent = '';
          var message = document.createElement('p');
          message.className = 'empty-state';
          message.textContent = err.message;
          els.sheetList.appendChild(message);
          setStatus('Cần tải lại dữ liệu', 'error');
        } else {
          setStatus('Dùng danh sách đã lưu', 'ok');
        }
        if (!cachedStats) renderStats({ leaderboard: [] });
      });
  }

  function refreshStats() {
    return api({ action: 'stats' }, 60000)
      .then(function (payload) {
        var stats = payload.stats || {};
        writeCache('stats', '', stats);
        renderStats(stats);
      })
      .catch(function () {
        // Tương thích với bản Apps Script cũ trong lúc chưa tạo deployment mới.
        return api({ action: 'bootstrap' }, 120000).then(function (payload) {
          var stats = payload.stats || {};
          writeCache('stats', '', stats);
          renderStats(stats);
        }).catch(function () {});
      });
  }

  function scheduleBackgroundLoad() {
    window.clearTimeout(state.backgroundTimer);
    state.backgroundTimer = window.setTimeout(refreshStats, state.activeSheet ? 2500 : 500);
  }

  els.answerForm.addEventListener('submit', function (event) {
    event.preventDefault();
    submitAnswer();
  });

  els.startButton.addEventListener('click', function () {
    if (!state.pendingSheet) return;
    savePlayerName();
    showPage('game');
    selectSheet(state.pendingSheet);
  });

  els.leaderboardButton.addEventListener('click', function () {
    showPage('board');
    refreshStats();
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (button) {
    button.addEventListener('click', function () {
      showPage(button.dataset.nav);
    });
  });

  // Nút thoát chỉ hiện trong ứng dụng Android, trang web không có gì để đóng.
  var appControl = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppControl;
  if (appControl && typeof appControl.exitApp === 'function') {
    els.exitButton.hidden = false;
    els.exitButton.addEventListener('click', function () {
      appControl.exitApp().catch(function () {});
    });
  }

  els.refreshButton.addEventListener('click', loadHome);
  els.playerName.addEventListener('input', updatePlayerAvatar);
  els.playerName.addEventListener('change', savePlayerName);
  els.playerName.addEventListener('blur', savePlayerName);

  loadPlayerName();
  updateScoreboard();
  showPage('home');
  loadHome();

  window.FLASHCARD_TEST = {
    normalize: normalize,
    withoutOptionalAbbreviation: withoutOptionalAbbreviation,
    acceptedAnswerVariants: acceptedAnswerVariants,
    guessLanguageCandidates: guessLanguageCandidates,
    sheetIcon: sheetIcon,
    avatarFor: avatarFor
  };
})();
