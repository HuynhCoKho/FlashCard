(function () {
  var config = window.FLASHCARD_CONFIG || {};
  var endpoint = String(config.APPS_SCRIPT_WEB_APP_URL || '').trim();
  var fallbackPlayerName = config.DEFAULT_PLAYER_NAME || 'Nguoi hoc';
  var pointsCorrect = Number(config.POINTS_CORRECT || 10);
  var pointsWrong = Number(config.POINTS_WRONG || -4);
  var recentWindow = Number(config.RECENT_WINDOW || 6);

  var els = {
    playerName: document.getElementById('playerName'),
    refreshButton: document.getElementById('refreshButton'),
    sheetList: document.getElementById('sheetList'),
    totalPlayers: document.getElementById('totalPlayers'),
    totalPlays: document.getElementById('totalPlays'),
    leaderboard: document.getElementById('leaderboard'),
    connectionStatus: document.getElementById('connectionStatus'),
    activeSheetLabel: document.getElementById('activeSheetLabel'),
    gameTitle: document.getElementById('gameTitle'),
    scoreValue: document.getElementById('scoreValue'),
    correctCount: document.getElementById('correctCount'),
    wrongCount: document.getElementById('wrongCount'),
    streakCount: document.getElementById('streakCount'),
    flashcard: document.getElementById('flashcard'),
    cardHint: document.getElementById('cardHint'),
    vietnameseText: document.getElementById('vietnameseText'),
    noteText: document.getElementById('noteText'),
    answerForm: document.getElementById('answerForm'),
    answerInput: document.getElementById('answerInput'),
    submitButton: document.getElementById('submitButton'),
    feedback: document.getElementById('feedback')
  };

  var state = {
    sheets: [],
    activeSheet: '',
    words: [],
    current: null,
    recentIds: [],
    score: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    requestId: 0,
    bestSubmittedScore: 0
  };

  function setStatus(text, mode) {
    els.connectionStatus.textContent = text;
    els.connectionStatus.dataset.mode = mode || '';
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u0111/g, 'd')
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
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
  }

  function loadPlayerName() {
    try {
      els.playerName.value = localStorage.getItem('flashcardPlayerName') || '';
    } catch (err) {}
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
      return;
    }

    state.sheets.forEach(function (sheet) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'sheet-button';
      button.dataset.active = sheet.name === state.activeSheet ? 'true' : 'false';
      button.innerHTML = '<span>' + escapeHtml(sheet.name) + '</span><strong>' + Number(sheet.count || 0) + '</strong>';
      button.addEventListener('click', function () {
        selectSheet(sheet.name);
      });
      els.sheetList.appendChild(button);
    });
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
    items.slice(0, 10).forEach(function (item) {
      var row = document.createElement('li');
      var name = document.createElement('span');
      var score = document.createElement('strong');
      name.textContent = item.player || fallbackPlayerName;
      score.textContent = Number(item.score || 0).toLocaleString('vi-VN');
      row.appendChild(name);
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
    state.score = 0;
    state.correct = 0;
    state.wrong = 0;
    state.streak = 0;
    state.bestSubmittedScore = 0;
    els.answerInput.value = '';
    els.feedback.textContent = '';
    updateScoreboard();
  }

  function selectSheet(sheetName) {
    resetRound(sheetName);
    renderSheets();
    setStatus('Đang tải ' + sheetName, 'pending');
    els.activeSheetLabel.textContent = sheetName;
    els.gameTitle.textContent = 'Bộ từ ' + sheetName;
    els.cardHint.textContent = 'Đang chuẩn bị thẻ';
    els.vietnameseText.textContent = '...';
    els.noteText.hidden = true;
    els.answerInput.disabled = true;
    els.submitButton.disabled = true;

    api({ action: 'words', sheet: sheetName }, 240000)
      .then(function (payload) {
        state.words = (payload.words || []).filter(function (word) {
          return word && word.vi && word.answer;
        });
        if (!state.words.length) {
          throw new Error('Sheet này chưa có đủ cột tiếng Việt và từ ngoại ngữ.');
        }
        setStatus('Đã sẵn sàng', 'ok');
        els.answerInput.disabled = false;
        els.submitButton.disabled = false;
        recordPlayStart();
        nextCard();
      })
      .catch(function (err) {
        setStatus('Cần kiểm tra dữ liệu', 'error');
        els.cardHint.textContent = 'Không tải được bộ từ';
        els.vietnameseText.textContent = err.message;
      });
  }

  function nextCard() {
    if (!state.words.length) return;
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

  function renderCard(word) {
    els.flashcard.classList.remove('is-wrong', 'is-correct');
    els.cardHint.textContent = 'Dịch sang ngoại ngữ';
    els.vietnameseText.textContent = word.vi;
    if (word.note) {
      els.noteText.textContent = '(' + word.note + ')';
      els.noteText.hidden = false;
    } else {
      els.noteText.hidden = true;
    }
    els.answerInput.value = '';
    els.answerInput.focus();
  }

  function submitAnswer() {
    if (!state.current) return;
    var answer = compactSpaces(els.answerInput.value);
    if (!answer) return;

    var accepted = [state.current.answer].concat(state.current.aliases || [])
      .map(normalize)
      .filter(Boolean);
    var isCorrect = accepted.indexOf(normalize(answer)) >= 0;

    if (isCorrect) {
      state.score += pointsCorrect;
      state.correct += 1;
      state.streak += 1;
      els.feedback.textContent = 'Đúng: ' + state.current.answer;
      els.flashcard.classList.add('is-correct');
      speak(state.current.answer);
      updateScoreboard();
      submitScoreIfNeeded();
      window.setTimeout(nextCard, 520);
    } else {
      state.score += pointsWrong;
      state.wrong += 1;
      state.streak = 0;
      els.feedback.textContent = 'Sai rồi. Đáp án đúng: ' + state.current.answer;
      els.flashcard.classList.remove('is-wrong');
      void els.flashcard.offsetWidth;
      els.flashcard.classList.add('is-wrong');
      updateScoreboard();
      submitScoreIfNeeded();
    }
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = guessLanguage(state.activeSheet, text);
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    } catch (err) {}
  }

  function guessLanguage(sheetName, text) {
    var name = normalize(sheetName);
    if (name.indexOf('english') >= 0 || name.indexOf('anh') >= 0) return 'en-US';
    if (name.indexOf('japan') >= 0 || name.indexOf('nhat') >= 0) return 'ja-JP';
    if (name.indexOf('korea') >= 0 || name.indexOf('han') >= 0) return 'ko-KR';
    if (name.indexOf('china') >= 0 || name.indexOf('trung') >= 0) return 'zh-CN';
    if (name.indexOf('french') >= 0 || name.indexOf('phap') >= 0) return 'fr-FR';
    if (name.indexOf('german') >= 0 || name.indexOf('duc') >= 0) return 'de-DE';
    if (name.indexOf('spanish') >= 0 || name.indexOf('tay ban nha') >= 0) return 'es-ES';
    return /[a-z]/i.test(text) ? 'en-US' : 'vi-VN';
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
        renderStats(payload.stats || {});
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
        renderStats(payload.stats || {});
      })
      .catch(function () {});
  }

  function loadHome() {
    setStatus('Đang tải dữ liệu', 'pending');
    api({ action: 'bootstrap' }, 240000)
      .then(function (payload) {
        state.sheets = payload.sheets || [];
        renderSheets();
        renderStats(payload.stats || {});
        setStatus('Đã kết nối', 'ok');
        if (state.sheets.length) selectSheet(state.sheets[0].name);
      })
      .catch(function (err) {
        setStatus('Cần tải lại dữ liệu', 'error');
        els.sheetList.innerHTML = '<p class="empty-state">' + escapeHtml(err.message) + '</p>';
        renderStats({ leaderboard: [] });
      });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  els.answerForm.addEventListener('submit', function (event) {
    event.preventDefault();
    submitAnswer();
  });

  els.refreshButton.addEventListener('click', loadHome);
  els.playerName.addEventListener('change', savePlayerName);
  els.playerName.addEventListener('blur', savePlayerName);

  loadPlayerName();
  updateScoreboard();
  loadHome();
})();
