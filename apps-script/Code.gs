var SPREADSHEET_ID = '1MDt7HLzuhndU30Ln2uW7Ibd9O1M2FRqTtpGw3dRw_wM';
var SCORE_SHEET_NAME = 'LEADERBOARD';
var CACHE_TTL_SECONDS = 120;
var SYSTEM_SHEETS = {
  LEADERBOARD: true,
  STATS: true,
  LOG: true,
  LINKS: true,
  CONFIG: true
};

function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = String(params.action || 'bootstrap').toLowerCase();
  var callback = String(params.callback || '').trim();

  try {
    if (action === 'bootstrap') {
      return output_(callback, {
        ok: true,
        sheets: listVocabularySheets_(),
        stats: getStats_()
      });
    }

    if (action === 'sheets') {
      return output_(callback, { ok: true, sheets: listVocabularySheets_() });
    }

    if (action === 'stats') {
      return output_(callback, { ok: true, stats: getStats_() });
    }

    if (action === 'words') {
      return output_(callback, {
        ok: true,
        sheet: params.sheet || '',
        words: readWords_(String(params.sheet || ''))
      });
    }

    if (action === 'batch') {
      return output_(callback, {
        ok: true,
        sheet: params.sheet || '',
        words: readWordBatch_(String(params.sheet || ''), Number(params.limit || 40))
      });
    }

    if (action === 'start') {
      appendPlay_(params, 'START');
      return output_(callback, { ok: true, stats: getStats_(true) });
    }

    if (action === 'score') {
      appendPlay_(params, 'SCORE');
      return output_(callback, { ok: true, stats: getStats_(true) });
    }

    if (action === 'speak') {
      return output_(callback, speakPayload_(params));
    }

    return output_(callback, { ok: false, error: 'Action không hợp lệ.' });
  } catch (err) {
    return output_(callback, { ok: false, error: errorMessage_(err) });
  }
}

function setupAuthorization() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ensureScoreSheet_(ss);
  listVocabularySheets_(true);
  return 'Đã kết nối Google Sheet và sẵn sàng cho FlashCard.';
}

/**
 * Trả về phiên âm IPA của từ tiếng Anh.
 *
 * Dùng trong Google Sheets:
 * =IPA(B2)
 * =IPA(B2:B20)
 */
function IPA(value) {
  if (Array.isArray(value)) {
    return value.map(function (row) {
      return row.map(function (cell) {
        return lookupIpa_(cell);
      });
    });
  }

  return lookupIpa_(value);
}

function lookupIpa_(value) {
  var word = clean_(value);
  if (!word) return '';

  var cache = CacheService.getScriptCache();
  var cacheKey = 'ipa-v1-' + normalizeHeader_(word).slice(0, 180);
  var cached = cache.get(cacheKey);
  if (cached !== null) return cached;

  var ipa = '';
  try {
    var url = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word);
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) {
      ipa = extractIpa_(JSON.parse(response.getContentText()));
    }
  } catch (err) {
    ipa = '';
  }

  try {
    cache.put(cacheKey, ipa, 21600);
  } catch (err2) {}

  return ipa;
}

/* ============================ ĐỌC TỪ TRÊN MÁY CHỦ ============================
 *
 * Máy Huawei không có dịch vụ Google nên chỉ có bộ phát âm của hãng, thiếu hẳn
 * tiếng Trung, Thái, Đức, và khoá luôn phần tải thêm giọng. Nhiều máy giá rẻ khác
 * cũng vậy. Khi máy không đọc được, ứng dụng hỏi xuống đây và nhận về file MP3.
 *
 * Cần đặt trước khoá API trong Tệp > Thuộc tính dự án > Thuộc tính tập lệnh:
 *   TTS_API_KEY = khoá của Google Cloud Text-to-Speech
 * ========================================================================== */

var TTS_MAX_TEXT_LENGTH = 200;
var TTS_CACHE_TTL_SECONDS = 21600;
var TTS_CACHE_MAX_BYTES = 95000;

/** Cloud TTS gọi tiếng Quan Thoại là cmn chứ không phải zh, gọi tiếng Ả Rập là ar-XA. */
var TTS_LANGUAGE_ALIASES = {
  'zh': 'cmn-CN',
  'zh-cn': 'cmn-CN',
  'zh-tw': 'cmn-TW',
  'zh-hk': 'yue-HK',
  'ar': 'ar-XA',
  'ar-sa': 'ar-XA',
  'iw': 'he-IL',
  'iw-il': 'he-IL',
  'sa': 'hi-IN',
  'sa-in': 'hi-IN'
};

/**
 * Chạy hàm này trong trình soạn thảo để tự kiểm tra giọng đọc máy chủ.
 *
 * Lần chạy đầu Google sẽ hỏi cấp quyền gọi ra Internet — phải bấm đồng ý, không có
 * quyền đó thì UrlFetchApp bị chặn và ứng dụng câm dù khoá API hoàn toàn đúng.
 */
function kiemTraGiongDoc() {
  // Gọi trần, cố ý không bọc try/catch. synthesizeSpeech_ bắt mọi lỗi nên nếu gọi
  // qua nó, lỗi thiếu quyền bị nuốt mất và Google không bao giờ hiện hộp thoại
  // xin cấp quyền. Dòng này để lỗi ném thẳng ra ngoài.
  UrlFetchApp.fetch('https://texttospeech.googleapis.com/v1/voices', { muteHttpExceptions: true });

  var result = synthesizeSpeech_('你好', 'cmn-CN');
  if (result.audio) {
    Logger.log('OK — nhận được ' + result.audio.length + ' ký tự âm thanh.');
  } else {
    Logger.log('HỎNG — ' + result.error);
  }
  return result.error || 'OK';
}

function speakPayload_(params) {
  var text = clean_(params.text);
  var language = ttsLanguage_(clean_(params.lang));

  if (!text) return { ok: false, error: 'Thiếu nội dung cần đọc.' };
  if (text.length > TTS_MAX_TEXT_LENGTH) return { ok: false, error: 'Nội dung quá dài.' };

  var result = synthesizeSpeech_(text, language);
  if (!result.audio) return { ok: false, error: result.error || 'Máy chủ chưa tạo được âm thanh.' };

  return { ok: true, mime: 'audio/mpeg', lang: language, audio: result.audio };
}

function ttsLanguage_(tag) {
  var value = String(tag || '').trim();
  if (!value) return 'en-US';
  var alias = TTS_LANGUAGE_ALIASES[value.toLowerCase()];
  return alias || value;
}

/**
 * Trả về { audio, error }. Nói rõ lỗi thay vì im lặng, vì hỏng ở đây thì người dùng
 * chỉ thấy ứng dụng câm và không ai đoán được là thiếu khoá, sai mã ngôn ngữ hay
 * chưa bật API.
 */
function synthesizeSpeech_(text, language) {
  var cache = CacheService.getScriptCache();
  var digest = Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, text, Utilities.Charset.UTF_8)
  );
  var cacheKey = 'tts-v1-' + language + '-' + digest;

  var cached = cache.get(cacheKey);
  if (cached) return { audio: cached, error: '' };

  var apiKey = PropertiesService.getScriptProperties().getProperty('TTS_API_KEY');
  if (!apiKey) return { audio: '', error: 'Chưa đặt TTS_API_KEY trong Script Properties.' };

  var audio = '';
  var error = '';

  try {
    var response = UrlFetchApp.fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(apiKey),
      {
        method: 'post',
        contentType: 'application/json',
        muteHttpExceptions: true,
        payload: JSON.stringify({
          input: { text: text },
          // Không chỉ định tên giọng để Google tự chọn giọng Standard, nằm trong mức miễn phí.
          voice: { languageCode: language },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.92 }
        })
      }
    );

    var code = response.getResponseCode();
    var body = response.getContentText();

    if (code === 200) {
      audio = JSON.parse(body).audioContent || '';
      if (!audio) error = 'Cloud TTS trả về rỗng.';
    } else {
      error = 'Cloud TTS ' + code + ': ' + hideApiKey_(upstreamMessage_(body));
    }
  } catch (err) {
    error = 'Không gọi được Cloud TTS: ' + hideApiKey_(errorMessage_(err));
  }

  if (audio && audio.length <= TTS_CACHE_MAX_BYTES) {
    try {
      cache.put(cacheKey, audio, TTS_CACHE_TTL_SECONDS);
    } catch (err2) {}
  }

  return { audio: audio, error: error };
}

function upstreamMessage_(body) {
  try {
    var parsed = JSON.parse(body);
    if (parsed && parsed.error && parsed.error.message) return parsed.error.message;
  } catch (err) {}
  return String(body || '').slice(0, 300);
}

/** Google không lộ khoá trong thông báo lỗi, nhưng chặn sẵn cho chắc. */
function hideApiKey_(message) {
  return String(message || '').replace(/AIza[0-9A-Za-z_\-]{10,}/g, '<khoá đã ẩn>');
}

function extractIpa_(data) {
  if (!data || !data[0]) return '';
  if (data[0].phonetic) return normalizeIpaDisplay_(data[0].phonetic);

  var phonetics = data[0].phonetics || [];
  for (var i = 0; i < phonetics.length; i += 1) {
    if (phonetics[i] && phonetics[i].text) {
      return normalizeIpaDisplay_(phonetics[i].text);
    }
  }

  return '';
}

function normalizeIpaDisplay_(value) {
  return clean_(value).replace(/\u0279/g, 'r');
}

function listVocabularySheets_(forceRefresh) {
  var cache = CacheService.getScriptCache();
  var cacheKey = 'flashcard-sheets-v1';
  if (!forceRefresh) {
    var cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets().filter(function (sheet) {
    return !SYSTEM_SHEETS[String(sheet.getName()).toUpperCase()];
  }).map(function (sheet) {
    return {
      name: sheet.getName(),
      count: countVocabularyRows_(sheet)
    };
  }).filter(function (item) {
    return item.count > 0;
  });

  cache.put(cacheKey, JSON.stringify(sheets), CACHE_TTL_SECONDS);
  return sheets;
}

function countVocabularyRows_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 2) return 0;
  return Math.max(0, lastRow - 1);
}

function readWords_(sheetName) {
  sheetName = String(sheetName || '').trim();
  if (!sheetName) throw new Error('Thiếu tên sheet.');
  if (SYSTEM_SHEETS[sheetName.toUpperCase()]) throw new Error('Sheet này không phải bộ từ vựng.');

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Không tìm thấy sheet "' + sheetName + '".');

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 2) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  var headers = values[0];
  var columns = detectColumns_(headers);

  return values.slice(1).map(function (row, index) {
    var vi = clean_(row[columns.vi]);
    var answer = clean_(row[columns.answer]);
    if (!vi || !answer) return null;
    return {
      id: sheetName + '-' + (index + 2),
      vi: vi,
      answer: answer,
      aliases: splitAliases_(row[columns.aliases]),
      pronunciation: clean_(row[columns.pronunciation]),
      note: clean_(row[columns.note])
    };
  }).filter(Boolean);
}

function readWordBatch_(sheetName, limit) {
  sheetName = String(sheetName || '').trim();
  limit = Math.max(1, Math.min(80, Number(limit || 40)));
  if (!sheetName) throw new Error('Thiếu tên sheet.');
  if (SYSTEM_SHEETS[sheetName.toUpperCase()]) throw new Error('Sheet này không phải bộ từ vựng.');

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Không tìm thấy sheet "' + sheetName + '".');

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 2) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  var columns = detectColumns_(headers);
  // Một lần đọc duy nhất nhanh hơn nhiều so với gọi getRange cho từng dòng.
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();
  var rowNumbers = pickRandomRows_(lastRow, limit);
  var words = [];

  for (var i = 0; i < rowNumbers.length && words.length < limit; i += 1) {
    var rowNumber = rowNumbers[i];
    var row = values[rowNumber - 2];
    var vi = clean_(row[columns.vi]);
    var answer = clean_(row[columns.answer]);
    if (!vi || !answer) continue;
    words.push({
      id: sheetName + '-' + rowNumber,
      vi: vi,
      answer: answer,
      aliases: splitAliases_(row[columns.aliases]),
      pronunciation: clean_(row[columns.pronunciation]),
      note: clean_(row[columns.note])
    });
  }

  return words;
}

function pickRandomRows_(lastRow, limit) {
  var maxDataRows = Math.max(0, lastRow - 1);
  var target = Math.min(maxDataRows, limit * 3);
  var seen = {};
  var rows = [];
  while (rows.length < target) {
    var rowNumber = 2 + Math.floor(Math.random() * maxDataRows);
    if (seen[rowNumber]) continue;
    seen[rowNumber] = true;
    rows.push(rowNumber);
  }
  return rows;
}

function detectColumns_(headers) {
  var normalized = headers.map(normalizeHeader_);
  var vi = findHeader_(normalized, [
    'vietnamese', 'viet nam', 'tieng viet', 'nghia tieng viet', 'nghia', 'meaning', 'vi'
  ]);
  var answer = findHeader_(normalized, [
    'foreign', 'tu ngoai ngu', 'ngoai ngu', 'answer', 'dap an', 'tu', 'word',
    'english', 'tieng anh', 'japanese', 'tieng nhat', 'korean', 'tieng han',
    'chinese', 'tieng trung', 'french', 'tieng phap', 'german', 'tieng duc',
    'spanish', 'tieng tay ban nha'
  ]);
  var aliases = findHeader_(normalized, ['aliases', 'alias', 'tu dong nghia', 'chap nhan', 'dap an khac']);
  var pronunciation = findHeader_(normalized, [
    'pronunciation', 'phonetic', 'transcription', 'ipa', 'pinyin', 'romaji',
    'phien am', 'phat am', 'cach doc'
  ]);
  var note = findHeader_(normalized, ['note', 'notes', 'ghi chu', 'giai thich']);

  if (vi < 0) vi = 0;
  if (answer < 0 || answer === vi) answer = vi === 0 ? 1 : 0;
  if (pronunciation < 0 && headers.length >= 5) pronunciation = 4;
  return {
    vi: vi,
    answer: answer,
    aliases: aliases,
    pronunciation: pronunciation,
    note: note
  };
}

function findHeader_(headers, names) {
  for (var i = 0; i < names.length; i += 1) {
    var target = normalizeHeader_(names[i]);
    for (var j = 0; j < headers.length; j += 1) {
      if (headers[j] === target || headers[j].indexOf(target) >= 0) return j;
    }
  }
  return -1;
}

function appendPlay_(params, type) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ensureScoreSheet_(ss);
  var score = Math.max(0, Number(params.score || 0));
  var correct = Math.max(0, Number(params.correct || 0));
  var wrong = Math.max(0, Number(params.wrong || 0));
  sheet.appendRow([
    new Date(),
    clean_(params.player) || 'Người học',
    clean_(params.sheet),
    type,
    score,
    correct,
    wrong
  ]);
  CacheService.getScriptCache().remove('flashcard-stats-v1');
}

function ensureScoreSheet_(ss) {
  var sheet = ss.getSheetByName(SCORE_SHEET_NAME) || ss.insertSheet(SCORE_SHEET_NAME);
  var headers = ['TIME', 'PLAYER', 'SHEET', 'TYPE', 'SCORE', 'CORRECT', 'WRONG'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return sheet;
  }
  var current = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  var needsHeader = headers.some(function (header, index) {
    return current[index] !== header;
  });
  if (needsHeader) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function getStats_(forceRefresh) {
  var cache = CacheService.getScriptCache();
  var cacheKey = 'flashcard-stats-v1';
  if (!forceRefresh) {
    var cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ensureScoreSheet_(ss);
  var values = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getDisplayValues()
    : [];

  var players = {};
  var bestByPlayer = {};
  var totalPlays = 0;

  values.forEach(function (row) {
    var player = clean_(row[1]) || 'Người học';
    var type = clean_(row[3]).toUpperCase();
    var score = Number(row[4] || 0);
    players[player.toLowerCase()] = player;
    if (type === 'START') totalPlays += 1;
    if (type === 'SCORE') {
      var key = player.toLowerCase();
      if (!bestByPlayer[key] || score > bestByPlayer[key].score) {
        bestByPlayer[key] = { player: player, score: score };
      }
    }
  });

  var stats = {
    totalPlayers: Object.keys(players).length,
    totalPlays: totalPlays,
    leaderboard: Object.keys(bestByPlayer).map(function (key) {
      return bestByPlayer[key];
    }).sort(function (a, b) {
      return b.score - a.score || a.player.localeCompare(b.player);
    }).slice(0, 10)
  };

  cache.put(cacheKey, JSON.stringify(stats), CACHE_TTL_SECONDS);
  return stats;
}

function splitAliases_(value) {
  return clean_(value).split(/[;|/]+/).map(clean_).filter(Boolean);
}

function clean_(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeHeader_(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function output_(callback, payload) {
  if (callback) {
    var safeCallback = callback.replace(/[^\w.$]/g, '');
    return ContentService
      .createTextOutput(safeCallback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorMessage_(err) {
  return err && err.message ? err.message : String(err);
}
