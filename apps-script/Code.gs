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

    if (action === 'words') {
      return output_(callback, {
        ok: true,
        sheet: params.sheet || '',
        words: readWords_(String(params.sheet || ''))
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
  var values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  var columns = detectColumns_(values[0]);
  return values.slice(1).filter(function (row) {
    return String(row[columns.vi] || '').trim() && String(row[columns.answer] || '').trim();
  }).length;
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
      note: clean_(row[columns.note])
    };
  }).filter(Boolean);
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
  var note = findHeader_(normalized, ['note', 'notes', 'ghi chu', 'giai thich']);

  if (vi < 0) vi = 0;
  if (answer < 0 || answer === vi) answer = vi === 0 ? 1 : 0;
  return {
    vi: vi,
    answer: answer,
    aliases: aliases,
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
