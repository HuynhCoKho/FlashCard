/**
 * Bộ hình minh hoạ dựng sẵn cho từ gốc.
 *
 * Vì sao không tải ảnh thật từ Drive: mỗi ảnh PNG rẻ nhất cũng 20–40 KB, nhân với
 * hơn hai vạn từ trong bảng tính là hàng trăm MB, lại phải chia sẻ công khai và
 * đường dẫn ảnh Drive thì hay hết hạn. Emoji lấy từ phông chữ của máy và SVG dựng
 * ngay trong trình duyệt đều nặng 0 byte, chạy được khi mất mạng, và phóng to bao
 * nhiêu cũng nét — hợp với thẻ học cho trẻ nhỏ.
 *
 * Cột HÌNH trong Google Sheet vẫn được ưu tiên hơn bộ này, xem resolveImage trong
 * script.js. Bộ dựng sẵn chỉ là lớp đỡ khi ô đó còn trống.
 */
window.FLASHCARD_PICTOGRAMS = (function () {
  var INK = '#123b2d';
  var FADE_LINE = '#a6b6ae';
  var FADE_FILL = '#dde6e1';
  var GOLD = '#f5c518';
  var GOLD_EDGE = '#d99f07';
  var RED = '#e5484d';
  var RED_EDGE = '#a52b2f';
  var WOOD = '#d9a441';
  var PAPER = '#ffffff';
  var MINT = '#e7f6ee';

  function art(inner) {
    return '<svg class="picture-art" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet"'
      + ' xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }

  function rect(x, y, w, h, r, fill, stroke) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r
      + '" fill="' + fill + '" stroke="' + (stroke || INK) + '" stroke-width="4"/>';
  }

  function ball(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + RED
      + '" stroke="' + RED_EDGE + '" stroke-width="3"/>';
  }

  /* ---------- Màu sắc ---------- */

  var COLOR_HEX = {
    black: '#1f2933',
    blue: '#2f6fe0',
    brown: '#8b5a2b',
    green: '#2ea44f',
    grey: '#9aa0a6',
    pink: '#ff7eb6',
    purple: '#8b5cf6',
    red: '#e5484d',
    white: '#ffffff',
    yellow: '#f5c518'
  };

  function colorSwatch(hex) {
    return art(
      '<rect x="18" y="26" width="84" height="72" rx="20" fill="' + hex + '" stroke="' + INK + '" stroke-width="5"/>'
      + '<ellipse cx="44" cy="48" rx="14" ry="9" fill="#ffffff" opacity="0.42"/>'
    );
  }

  /* ---------- Số đếm ---------- */

  var NUMBER_WORDS = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20
  };

  /** Chữ số cho bé đã biết mặt số, chấm tròn cho bé còn phải đếm. */
  function countDots(total) {
    var parts = '<text x="60" y="40" text-anchor="middle" font-family="\'Baloo 2\',\'Be Vietnam Pro\',sans-serif"'
      + ' font-size="42" font-weight="800" fill="' + INK + '">' + total + '</text>';
    for (var i = 0; i < total; i += 1) {
      var row = Math.floor(i / 5);
      var inRow = Math.min(5, total - row * 5);
      var x = 60 + ((i % 5) - (inRow - 1) / 2) * 17;
      var y = 60 + row * 16;
      parts += '<circle cx="' + x.toFixed(1) + '" cy="' + y + '" r="6.5" fill="' + GOLD
        + '" stroke="' + GOLD_EDGE + '" stroke-width="2"/>';
    }
    return art(parts);
  }

  /* ---------- Giới từ chỉ vị trí ---------- */

  function prepositionArt(kind) {
    var box = rect(26, 52, 68, 40, 8, MINT);
    if (kind === 'in') return art(box + ball(60, 72, 13));
    if (kind === 'on') return art(box + ball(60, 39, 13));
    if (kind === 'under') return art(box + ball(60, 105, 13));
    if (kind === 'nextTo') return art(rect(14, 52, 62, 40, 8, MINT) + ball(100, 72, 15));
    if (kind === 'behind') return art(ball(54, 46, 16) + rect(26, 54, 68, 44, 8, MINT));
    // in front of: hộp lùi lên trên, quả bóng đổ bóng nằm đè phía trước.
    return art(
      rect(26, 38, 68, 44, 8, MINT)
      + '<ellipse cx="66" cy="106" rx="20" ry="5" fill="' + INK + '" opacity="0.16"/>'
      + ball(66, 86, 17)
    );
  }

  /* ---------- So sánh kích thước ---------- */

  function sizeArt(kind) {
    var big = kind === 'big';
    var small = kind === 'small';
    if (big || small) {
      return art(
        '<circle cx="44" cy="62" r="34" fill="' + (big ? GOLD : FADE_FILL) + '" stroke="'
        + (big ? INK : FADE_LINE) + '" stroke-width="5"/>'
        + '<circle cx="96" cy="84" r="14" fill="' + (small ? GOLD : FADE_FILL) + '" stroke="'
        + (small ? INK : FADE_LINE) + '" stroke-width="5"/>'
      );
    }
    if (kind === 'long' || kind === 'short') {
      var longOn = kind === 'long';
      return art(
        rect(10, 42, 100, 20, 10, longOn ? GOLD : FADE_FILL, longOn ? INK : FADE_LINE)
        + rect(35, 76, 50, 20, 10, longOn ? FADE_FILL : GOLD, longOn ? FADE_LINE : INK)
      );
    }
    // tall
    return art(
      rect(30, 12, 24, 96, 12, GOLD)
      + rect(70, 62, 24, 46, 12, FADE_FILL, FADE_LINE)
    );
  }

  /* ---------- Người và đại từ ---------- */

  function figure(x, active, female) {
    var fill = active ? GOLD : FADE_FILL;
    var line = active ? INK : FADE_LINE;
    var s = '<g stroke="' + line + '" stroke-width="4" stroke-linecap="round" fill="' + fill + '">';
    s += '<circle cx="' + x + '" cy="34" r="13"/>';
    if (female) {
      s += '<path d="M' + (x - 18) + ' 96 L' + (x - 8) + ' 54 L' + (x + 8) + ' 54 L' + (x + 18) + ' 96 Z"/>';
    } else {
      s += '<rect x="' + (x - 11) + '" y="54" width="22" height="30" rx="9"/>';
      s += '<line x1="' + (x - 6) + '" y1="84" x2="' + (x - 9) + '" y2="106" fill="none"/>';
      s += '<line x1="' + (x + 6) + '" y1="84" x2="' + (x + 9) + '" y2="106" fill="none"/>';
    }
    s += '<line x1="' + (x - 11) + '" y1="62" x2="' + (x - 23) + '" y2="74" fill="none"/>';
    s += '<line x1="' + (x + 11) + '" y1="62" x2="' + (x + 23) + '" y2="74" fill="none"/>';
    s += '</g>';
    return s;
  }

  /** Bong bóng thoại đánh dấu ai là người đang nói. */
  function bubble(x, y) {
    return '<g fill="' + PAPER + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round">'
      + '<rect x="' + (x - 15) + '" y="' + (y - 12) + '" width="30" height="20" rx="9"/>'
      + '<path d="M' + (x - 4) + ' ' + (y + 8) + ' l0 8 l10 -8 z"/></g>';
  }

  function arrow(x1, y1, x2, y2) {
    var angle = Math.atan2(y2 - y1, x2 - x1);
    var back = 13;
    var spread = 0.42;
    var ax = x2 - back * Math.cos(angle - spread);
    var ay = y2 - back * Math.sin(angle - spread);
    var bx = x2 - back * Math.cos(angle + spread);
    var by = y2 - back * Math.sin(angle + spread);
    return '<g stroke="' + INK + '" stroke-width="4" stroke-linecap="round" fill="' + INK + '">'
      + '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>'
      + '<path d="M' + x2 + ' ' + y2 + ' L' + ax.toFixed(1) + ' ' + ay.toFixed(1)
      + ' L' + bx.toFixed(1) + ' ' + by.toFixed(1) + ' Z"/></g>';
  }

  /** Cái túi nhỏ gắn cạnh người được tô sáng, để phân biệt "của tôi" với "tôi". */
  function ownedTag(x, y) {
    return '<g fill="' + PAPER + '" stroke="' + INK + '" stroke-width="3.5">'
      + '<rect x="' + (x - 13) + '" y="' + (y - 10) + '" width="26" height="22" rx="6"/>'
      + '<path d="M' + (x - 6) + ' ' + (y - 10) + ' v-5 a6 6 0 0 1 12 0 v5" fill="none"/></g>';
  }

  function personArt(kind, owns) {
    var scene;
    var tagAt;
    if (kind === 'me') {
      scene = figure(60, true) + bubble(60, 14);
      tagAt = [92, 92];
    } else if (kind === 'you') {
      // Mũi tên chĩa thẳng ra ngoài khung: người đang được nói chuyện chính là bé.
      scene = figure(30, false) + bubble(30, 14) + figure(92, true) + arrow(52, 100, 84, 112);
      tagAt = [24, 96];
    } else if (kind === 'he' || kind === 'she') {
      scene = figure(26, false) + bubble(26, 14) + figure(90, true, kind === 'she') + arrow(48, 44, 70, 40);
      tagAt = [24, 96];
    } else if (kind === 'we') {
      scene = figure(38, true) + bubble(38, 14) + figure(86, true, true);
      tagAt = [16, 96];
    } else if (kind === 'they') {
      scene = figure(22, false) + bubble(22, 14) + figure(66, true) + figure(102, true, true);
      tagAt = [20, 100];
    } else {
      // it: đồ vật, không phải người.
      scene = figure(24, false) + bubble(24, 14) + rect(62, 54, 46, 42, 8, GOLD) + arrow(46, 52, 62, 62);
      tagAt = [22, 100];
    }
    return art(scene + (owns ? ownedTag(tagAt[0], tagAt[1]) : ''));
  }

  /* ---------- Mạo từ, liên từ, chỉ nơi chốn ---------- */

  function appleShape(x, y, r, active) {
    return '<g stroke="' + (active ? INK : FADE_LINE) + '" stroke-width="4">'
      + '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (active ? RED : FADE_FILL) + '"/>'
      + '<line x1="' + x + '" y1="' + (y - r) + '" x2="' + x + '" y2="' + (y - r - 9) + '" stroke-linecap="round"/></g>';
  }

  function articleArt(definite) {
    var row = appleShape(28, 70, 18, false) + appleShape(92, 70, 18, false) + appleShape(60, 70, 18, true);
    return art(definite ? row + arrow(60, 18, 60, 42) : row);
  }

  function conjunctionArt(kind) {
    if (kind === 'and') {
      return art(
        appleShape(28, 66, 19, true)
        + '<path d="M60 50 v32 M44 66 h32" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/>'
        + '<circle cx="92" cy="66" r="19" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="4"/>'
      );
    }
    // but: hai vế trái ngược nhau.
    return art(
      '<circle cx="30" cy="64" r="21" fill="#2ea44f" stroke="' + INK + '" stroke-width="4"/>'
      + '<path d="M22 64 l6 7 l11 -14" stroke="' + PAPER + '" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<path d="M56 54 l10 10 l-10 10 M64 64 h-8" stroke="' + INK + '" stroke-width="5" fill="none" stroke-linecap="round"/>'
      + '<circle cx="92" cy="64" r="21" fill="' + RED + '" stroke="' + INK + '" stroke-width="4"/>'
      + '<path d="M85 57 l14 14 M99 57 l-14 14" stroke="' + PAPER + '" stroke-width="5" stroke-linecap="round"/>'
    );
  }

  function pin(x, y) {
    return '<g stroke="' + RED_EDGE + '" stroke-width="3">'
      + '<path d="M' + x + ' ' + y + ' c-12 -14 -17 -21 -17 -29 a17 17 0 0 1 34 0 c0 8 -5 15 -17 29 z" fill="' + RED + '"/>'
      + '<circle cx="' + x + '" cy="' + (y - 30) + '" r="6.5" fill="' + PAPER + '"/></g>';
  }

  function placeArt(near) {
    if (near) return art(figure(60, true) + pin(60, 116));
    return art(figure(22, false) + pin(98, 112) + arrow(44, 60, 76, 74));
  }

  /* ---------- Đồ vật trong lớp và trong nhà ---------- */

  function boardArt() {
    return art(
      rect(10, 22, 100, 64, 6, '#2f6b52')
      + '<path d="M26 42 h34 M26 56 h52 M26 70 h30" stroke="' + PAPER + '" stroke-width="4.5" stroke-linecap="round" fill="none"/>'
      + rect(10, 86, 100, 10, 5, '#c9a227')
    );
  }

  function tableArt(withBook) {
    var s = rect(12, 54, 96, 11, 5, WOOD)
      + rect(22, 65, 9, 42, 4, WOOD)
      + rect(89, 65, 9, 42, 4, WOOD);
    if (withBook) s += rect(44, 36, 34, 18, 3, RED);
    return art(s);
  }

  function chairArt() {
    return art(
      rect(34, 16, 14, 58, 6, WOOD)
      + rect(34, 66, 60, 11, 5, WOOD)
      + rect(38, 77, 9, 30, 4, WOOD)
      + rect(81, 77, 9, 30, 4, WOOD)
    );
  }

  function windowArt() {
    return art(
      rect(20, 20, 80, 80, 8, '#bfe6f5')
      + '<path d="M60 20 v80 M20 60 h80" stroke="' + INK + '" stroke-width="5"/>'
      + rect(14, 100, 92, 10, 5, WOOD)
    );
  }

  function doorArt(open) {
    if (!open) {
      return art(
        rect(30, 14, 60, 94, 6, WOOD)
        + '<circle cx="79" cy="62" r="5" fill="' + INK + '"/>'
        + arrow(16, 62, 28, 62)
      );
    }
    return art(
      rect(26, 14, 68, 94, 6, '#2b3a34')
      + '<path d="M26 14 L64 30 L64 100 L26 108 Z" fill="' + WOOD + '" stroke="' + INK + '" stroke-width="4"/>'
      + '<circle cx="56" cy="66" r="4.5" fill="' + INK + '"/>'
      + arrow(104, 62, 86, 62)
    );
  }

  function eraserArt() {
    return art(
      '<rect x="20" y="44" width="80" height="34" rx="10" fill="#ff9ec4" stroke="' + INK + '" stroke-width="5"/>'
      + '<path d="M30 44 h18 v34 h-18 a10 10 0 0 1 -10 -10 v-14 a10 10 0 0 1 10 -10 z" fill="#7fb7ff" stroke="' + INK + '" stroke-width="5"/>'
      + '<path d="M76 82 l10 12 M86 82 l-10 12" stroke="' + FADE_LINE + '" stroke-width="4" stroke-linecap="round"/>'
    );
  }

  function skirtArt() {
    return art(
      rect(40, 26, 40, 14, 5, '#8b5cf6')
      + '<path d="M40 40 L24 98 L96 98 L80 40 Z" fill="#a78bfa" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>'
    );
  }

  function shortsArt() {
    return art(
      '<path d="M28 28 h64 v34 l-6 34 h-22 l-4 -30 l-4 30 h-22 l-6 -34 z" fill="#3f7fd6" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>'
      + '<path d="M28 40 h64" stroke="' + INK + '" stroke-width="4"/>'
    );
  }

  function roomArt(living) {
    var s = rect(10, 24, 100, 74, 8, '#fbf3de')
      + '<path d="M10 84 h100" stroke="' + INK + '" stroke-width="4"/>';
    if (living) {
      s += rect(20, 58, 42, 26, 6, '#7fb7ff')
        + rect(72, 52, 30, 24, 4, '#2b3a34')
        + '<path d="M87 76 v8" stroke="' + INK + '" stroke-width="4"/>';
    } else {
      s += rect(24, 36, 30, 26, 4, '#bfe6f5')
        + rect(74, 44, 22, 40, 4, WOOD)
        + '<circle cx="79" cy="64" r="3.5" fill="' + INK + '"/>';
    }
    return art(s);
  }

  function classroomArt() {
    return art(
      rect(14, 14, 92, 44, 5, '#2f6b52')
      + '<path d="M28 30 h30 M28 42 h48" stroke="' + PAPER + '" stroke-width="4" stroke-linecap="round" fill="none"/>'
      + rect(12, 72, 42, 8, 4, WOOD) + rect(18, 80, 7, 26, 3, WOOD) + rect(41, 80, 7, 26, 3, WOOD)
      + rect(66, 72, 42, 8, 4, WOOD) + rect(72, 80, 7, 26, 3, WOOD) + rect(95, 80, 7, 26, 3, WOOD)
    );
  }

  /* ---------- Người: đứng, ngồi, thân thể, cái đầu ---------- */

  function standArt() {
    return art(figure(60, true) + '<path d="M28 112 h64" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>');
  }

  function sitArt() {
    return art(
      rect(70, 30, 12, 48, 5, WOOD)
      + rect(46, 74, 38, 9, 4, WOOD)
      + rect(50, 83, 8, 24, 4, WOOD)
      + '<g stroke="' + INK + '" stroke-width="4" stroke-linecap="round" fill="' + GOLD + '">'
      + '<circle cx="58" cy="36" r="13"/>'
      + '<rect x="47" y="52" width="22" height="24" rx="8"/>'
      + '<path d="M47 72 h-18 v26" fill="none"/>'
      + '<line x1="47" y1="60" x2="30" y2="70" fill="none"/></g>'
    );
  }

  function bodyArt() {
    return art(figure(60, true) + '<circle cx="60" cy="66" r="30" fill="none" stroke="' + GOLD_EDGE + '" stroke-width="4" stroke-dasharray="7 7"/>');
  }

  function headArt() {
    return art(
      '<g stroke="' + FADE_LINE + '" stroke-width="4" fill="' + FADE_FILL + '">'
      + '<path d="M22 112 q38 -24 76 0 z"/></g>'
      + '<circle cx="60" cy="52" r="30" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="5"/>'
      + '<circle cx="50" cy="46" r="4" fill="' + INK + '"/><circle cx="70" cy="46" r="4" fill="' + INK + '"/>'
      + '<path d="M49 62 q11 9 22 0" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>'
    );
  }

  /* ---------- Bảng tra ---------- */

  /** Emoji lấy thẳng từ phông của máy: không tốn byte nào để tải. */
  var EMOJI = {
    apple: '🍎', arm: '💪', baby: '👶', bad: '👎', bag: '🎒', ball: '⚽', banana: '🍌',
    bathroom: '🛁', bed: '🛏️', bedroom: '🛌', bird: '🐦', book: '📕', box: '📦', boy: '👦',
    bread: '🍞', brother: '👬', cake: '🎂', candy: '🍬', cat: '🐱', chicken: '🐔', child: '🧒',
    children: '🧒👧', class: '👩‍🏫🧒', clock: '🕐', coat: '🧥', cold: '🥶', computer: '💻',
    cookie: '🍪', cow: '🐄', dad: '👨‍👧', dance: '💃', dog: '🐶', door: '🚪', draw: '🎨',
    dress: '👗', drink: '🥤', duck: '🦆', ear: '👂', eat: '🍽️', egg: '🥚', elephant: '🐘',
    eye: '👁️', face: '🙂', family: '👨‍👩‍👧‍👦', father: '👨‍👧', feet: '🦶🦶', fish: '🐟',
    fly: '🐦💨', foot: '🦶', friend: '🤝', frog: '🐸', funny: '😄', garden: '🌻🌳',
    giraffe: '🦒', girl: '👧', goat: '🐐', good: '👍', goodbye: '👋', grape: '🍇',
    hair: '💇', hand: '✋', happy: '😀', hat: '🎩', hear: '👂', hello: '👋',
    hi: '🙋', home: '🏠', horse: '🐴', hot: '🥵', house: '🏡', 'ice cream': '🍦',
    juice: '🍹', jump: '🤸', keyboard: '⌨️', kitchen: '🍳', lamp: '💡', leg: '🦵',
    lemon: '🍋', like: '🙂👍', lion: '🦁', listen: '👂🎵', look: '👀', love: '❤️',
    man: '👨', mango: '🥭', meat: '🍖', mice: '🐭🐭', milk: '🥛', mom: '👩‍👧', monkey: '🐵',
    mother: '👩‍👧', mouse: '🐭', mouth: '👄', mum: '👩‍👧', new: '✨', nice: '😊', no: '❌',
    nose: '👃', old: '👴', orange: '🍊', pear: '🍐', pen: '🖊️', pencil: '✏️', picture: '🖼️',
    pig: '🐷', play: '🧸⚽', please: '🙏', read: '📖', rice: '🍚', ruler: '📏', run: '🏃',
    sad: '😢', school: '🏫', see: '👀✨', sheep: '🐑', shirt: '👔', shoes: '👟', sing: '🎤',
    sister: '👭', sleep: '😴', socks: '🧦', sofa: '🛋️', sorry: '😔', soup: '🍲',
    student: '🎓', swim: '🏊', 't-shirt': '👕', teacher: '👩‍🏫', teeth: '🦷🦷',
    'thank you': '🙏💖', thanks: '🙏💖', tiger: '🐯', tooth: '🦷', toy: '🧸', trousers: '👖',
    walk: '🚶', watch: '📺', water: '💧', watermelon: '🍉', welcome: '🤗', woman: '👩',
    write: '✍️', yes: '✅', young: '🌱🧒', zebra: '🦓'
  };

  /** Những từ mà emoji không diễn tả nổi thì vẽ hẳn hình. */
  var DRAWN = {
    a: function () { return articleArt(false); },
    an: function () { return articleArt(false); },
    the: function () { return articleArt(true); },
    and: function () { return conjunctionArt('and'); },
    but: function () { return conjunctionArt('but'); },

    'in': function () { return prepositionArt('in'); },
    on: function () { return prepositionArt('on'); },
    under: function () { return prepositionArt('under'); },
    behind: function () { return prepositionArt('behind'); },
    'next to': function () { return prepositionArt('nextTo'); },
    'in front of': function () { return prepositionArt('front'); },

    big: function () { return sizeArt('big'); },
    small: function () { return sizeArt('small'); },
    long: function () { return sizeArt('long'); },
    short: function () { return sizeArt('short'); },
    tall: function () { return sizeArt('tall'); },

    i: function () { return personArt('me', false); },
    me: function () { return personArt('me', false); },
    my: function () { return personArt('me', true); },
    you: function () { return personArt('you', false); },
    your: function () { return personArt('you', true); },
    he: function () { return personArt('he', false); },
    him: function () { return personArt('he', false); },
    his: function () { return personArt('he', true); },
    she: function () { return personArt('she', false); },
    her: function () { return personArt('she', true); },
    we: function () { return personArt('we', false); },
    us: function () { return personArt('we', false); },
    our: function () { return personArt('we', true); },
    they: function () { return personArt('they', false); },
    them: function () { return personArt('they', false); },
    their: function () { return personArt('they', true); },
    it: function () { return personArt('it', false); },

    here: function () { return placeArt(true); },
    there: function () { return placeArt(false); },

    board: boardArt,
    desk: function () { return tableArt(true); },
    table: function () { return tableArt(false); },
    chair: chairArt,
    window: windowArt,
    open: function () { return doorArt(true); },
    close: function () { return doorArt(false); },
    eraser: eraserArt,
    skirt: skirtArt,
    shorts: shortsArt,
    room: function () { return roomArt(false); },
    'living room': function () { return roomArt(true); },
    classroom: classroomArt,
    stand: standArt,
    sit: sitArt,
    body: bodyArt,
    head: headArt
  };

  var cache = {};

  /** Bỏ dấu câu, gộp khoảng trắng, bỏ phần chú thích trong ngoặc: "Apple (fruit)" -> "apple". */
  function key(word) {
    return String(word || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[^a-z0-9' -]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function build(name) {
    if (Object.prototype.hasOwnProperty.call(EMOJI, name)) {
      return { kind: 'emoji', value: EMOJI[name] };
    }
    if (Object.prototype.hasOwnProperty.call(COLOR_HEX, name)) {
      return { kind: 'svg', value: colorSwatch(COLOR_HEX[name]) };
    }
    if (Object.prototype.hasOwnProperty.call(NUMBER_WORDS, name)) {
      return { kind: 'svg', value: countDots(NUMBER_WORDS[name]) };
    }
    if (Object.prototype.hasOwnProperty.call(DRAWN, name)) {
      return { kind: 'svg', value: DRAWN[name]() };
    }
    return null;
  }

  function resolve(word) {
    var name = key(word);
    if (!name) return null;
    if (Object.prototype.hasOwnProperty.call(cache, name)) return cache[name];
    var found = build(name);
    if (!found) {
      // "the apple" hay "an apple" vẫn nên ra quả táo.
      var trimmed = name.replace(/^(a|an|the|to)\s+/, '');
      if (trimmed !== name) found = build(trimmed);
    }
    cache[name] = found;
    return found;
  }

  function count() {
    var names = {};
    [EMOJI, COLOR_HEX, NUMBER_WORDS, DRAWN].forEach(function (table) {
      Object.keys(table).forEach(function (name) { names[name] = true; });
    });
    return Object.keys(names).length;
  }

  return { resolve: resolve, count: count };
})();
