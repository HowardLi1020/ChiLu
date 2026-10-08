(() => {
  const D = window.MEMORY;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

  /* ── 向日葵壓印：產生花瓣與種子 ── */
  const petal = 'M0 -9 C3.6 -13 3.8 -19 0 -25 C-3.8 -19 -3.6 -13 0 -9Z';
  $('#sunPetals').innerHTML = Array.from({ length: 14 }, (_, i) =>
    `<path transform="translate(32 32) rotate(${(i * 360 / 14).toFixed(1)})" d="${petal}"/>`).join('');
  $('#sunSeeds').innerHTML = [[0, 1, 0], [2.6, 6, 0], [5.4, 11, 15]].flatMap(([r, k, off]) =>
    Array.from({ length: k }, (_, j) => {
      const a = (j * 360 / k + off) * Math.PI / 180;
      return `<circle cx="${(32 + r * Math.cos(a)).toFixed(2)}" cy="${(32 + r * Math.sin(a)).toFixed(2)}" r="1"/>`;
    })).join('');

  /* ── 照片：images/資料夾/檔名.jpg 另有 m/（拼貼用）與 s/（縮圖）兩種尺寸 ── */
  const sized = (src, size) => size ? src.replace(/^(images\/.+\/)([^/]+)$/, `$1${size}/$2`) : src;
  // 照片原始尺寸（tools/compress_photos.py 產生的 images/sizes.js）：照片依原比例顯示、不裁切
  const SIZES = window.PHOTO_SIZES || {};
  const ratioOf = src => (SIZES[src] ? SIZES[src][0] / SIZES[src][1] : 0.75);

  // 先只記下網址，翻到附近的頁面才真的載入（見 hydrate）
  function photoEl(src, alt, size) {
    const wrap = el('div', 'photo natural');
    const img = new Image();
    if (SIZES[src]) [img.width, img.height] = SIZES[src];
    img.alt = alt || '';
    img.decoding = 'async';
    img.draggable = false;
    img.onerror = () => {
      if (size && img.src !== new URL(src, location.href).href) { img.src = src; return; }
      wrap.classList.add('ph');
      wrap.textContent = '';
      wrap.append(el('span', 'ph-icon', '📷'), el('span', 'ph-path', src));
    };
    img.dataset.src = sized(src, size);
    wrap.append(img);
    return wrap;
  }
  const hydrate = root => root.querySelectorAll('img[data-src]').forEach(img => {
    img.src = img.dataset.src;
    delete img.dataset.src;
  });
  // 反過來：把照片放掉、只留網址，釋放記憶體（寬高屬性還在，版面不會跳動）
  const dehydrate = root => root.querySelectorAll('img[src]').forEach(img => {
    img.dataset.src = img.getAttribute('src');
    img.removeAttribute('src');
  });

  /* ── 剪貼素材 ── */
  const tape = (n, r) => {
    const t = el('span', `tape t${n}`);
    t.style.setProperty('--r', r + 'deg');
    return t;
  };
  const DOODLES = {
    heart: '<path d="M12 20.5 C5.5 15.5 2.6 11.6 3 8 C3.4 4.6 6.6 3 9.2 4.4 C10.6 5.2 11.5 6.6 12 7.8 C12.6 6.5 13.6 5.1 15.1 4.3 C17.8 3 21 4.7 21.2 8.1 C21.4 11.7 18.4 15.6 12 20.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    star: '<path d="M12 2.8 L14.5 9.1 L21.2 9.4 L15.9 13.6 L17.8 20.3 L12 16.4 L6.3 20.4 L8.1 13.7 L2.8 9.5 L9.5 9.1Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    sparkle: '<path d="M12 2 C12.8 8 16 11.2 22 12 C16 12.8 12.8 16 12 22 C11.2 16 8 12.8 2 12 C8 11.2 11.2 8 12 2Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M20 2.5 v4 M18 4.5 h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    arrow: '<path d="M3 19 C7 9 15 5.5 19.5 9.5 C22.5 12.5 18.5 16.5 15.5 13.5 C13.5 11.5 15.5 6.5 21 5.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M17.6 3.6 L21.3 5.4 L18.6 8.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  const doodle = name => {
    const d = el('span', 'doodle ' + name);
    d.innerHTML = name === 'sun'
      ? '<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#sunflower"/></svg>'
      : `<svg viewBox="0 0 24 24" aria-hidden="true">${DOODLES[name]}</svg>`;
    return d;
  };
  const stamp = text => el('span', 'stamp', text);
  const highlight = (tag, cls, text) => {
    const h = el(tag, cls);
    if (text) h.append(el('span', '', text));
    return h;
  };

  /* ── 建立書頁 ── */
  const book = $('#book');
  const pages = [];
  const gallery = [];

  function makePage(cls) {
    const page = el('section', 'page' + (cls ? ' ' + cls : ''));
    const front = el('div', 'face front');
    const back = el('div', 'face back');
    const sheet = el('div', 'sheet');
    const fs = el('div', 'shade');
    const bs = el('div', 'shade');
    front.append(sheet, fs);
    back.append(bs);
    page.append(front, back);
    book.append(page);
    const p = { el: page, front, sheet, fs, bs, onEnter: null };
    pages.push(p);
    return p;
  }
  const pageNo = () => {
    const f = el('p', 'pg-no');
    f.append(stamp(`P. ${String(pages.length - 1).padStart(2, '0')}`));
    return f;
  };

  // 封面：一張明信片（寫字的那一面）
  const cover = makePage('cover');
  cover.sheet.remove();
  const firstDate = D.trips[0]?.date || '';
  const lastDate = D.trips[D.trips.length - 1]?.date || '';
  const pc = el('div', 'postcard');

  // 印刷的抬頭
  const pcHead = el('div', 'pc-head');
  pcHead.append(el('span', 'pc-title', 'FOR YOU'), el('span', 'pc-title-zh', '寫給妳的日記'));

  // 郵票：有填 coverPhoto 就用那張照片當郵票圖案，沒填就是向日葵
  const pcStamp = el('div', 'pc-stamp');
  const art = el('div', 'pc-stamp-art');
  if (D.coverPhoto) {
    art.classList.add('has-photo');
    art.append(photoEl(D.coverPhoto, '', 's'));
  } else {
    art.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#sunflower"/></svg>';
  }
  art.append(el('span', 'pc-stamp-value', firstDate.slice(0, 4)));
  pcStamp.append(art);

  // 郵戳：圓形日期戳＋波浪註銷線
  const wave = y => `<path d="M112 ${y} q10.5 -7 21 0 t21 0 t21 0 t21 0 t21 0 t21 0"/>`;
  const pcMark = el('div', 'pc-postmark');
  pcMark.innerHTML = `<svg viewBox="0 0 240 120" aria-hidden="true">
    <defs><path id="pmArc" d="M20.5 60 A39.5 39.5 0 0 1 99.5 60"/></defs>
    <g fill="none" stroke="currentColor" stroke-width="2.4">
      <circle cx="60" cy="60" r="47"/><circle cx="60" cy="60" r="32" stroke-width="1.2"/>
      ${[38, 53, 68, 83].map(wave).join('')}
    </g>
    <g fill="currentColor">
      <text font-size="9.5" letter-spacing="2.4"><textPath href="#pmArc" startOffset="50%" text-anchor="middle">DIARY · POST</textPath></text>
      <text x="60" y="61" text-anchor="middle" font-size="15" font-weight="700">${firstDate.slice(0, 4)}</text>
      <text x="60" y="78" text-anchor="middle" font-size="10.5" letter-spacing="1">${firstDate.slice(5, 7)} — ${lastDate.slice(5, 7)}</text>
    </g>
  </svg>`;

  // 手寫的留言
  const pcMsg = el('div', 'pc-message');
  const title = el('h1', 'pc-hand pc-msg-title');
  const [t1, t2] = (D.heroTitle || '').split('，');
  if (t2 != null) title.append(t1 + '，', document.createElement('br'), t2); else title.textContent = t1;
  // 依最長那行的字數縮小字級，一行才不會被拆開
  title.style.setProperty('--len', Math.max(1, (t1 + '，').length, (t2 || '').length));
  const sub = el('p', 'pc-hand pc-msg-sub', D.heroSub);
  sub.style.setProperty('--len', Math.max(1, ...(D.heroSub || '').split('\n').map(s => s.length)));
  pcMsg.append(title, sub);

  // 收件人
  const pcAddr = el('div', 'pc-address');
  const toLine = el('div', 'pc-line');
  toLine.append(el('span', 'pc-label', 'TO'), el('span', 'pc-hand pc-to', (D.to || '').replace(/^給\s*/, '')));
  pcAddr.append(toLine, el('div', 'pc-line'), el('div', 'pc-line'));

  // 貼在明信片上的小照片（完整顯示、不裁切），和留言並排、上下置中
  let pcBody = pcMsg;
  if (D.postcardPhoto) {
    const pic = el('figure', 'pc-photo');
    pic.style.setProperty('--ratio', ratioOf(D.postcardPhoto));
    pic.append(photoEl(D.postcardPhoto, '', 'm'), tape(1, -8));
    pic.addEventListener('click', e => { e.stopPropagation(); openPhoto(D.postcardPhoto); });
    pcMsg.classList.add('beside-photo');
    pcBody = el('div', 'pc-body');
    pcBody.append(pcMsg, pic);
  }
  pc.append(pcHead, pcStamp, pcMark, pcBody, el('div', 'pc-divider'), pcAddr, el('p', 'pc-foot', `DIARY · ${firstDate.slice(0, 4)}`));
  const coverHint = el('p', 'cover-hint', '往左滑翻開 ');
  coverHint.append(el('span', '', '←'));
  cover.front.prepend(pc, coverHint);

  /* ── 日記頁：橫線筆記本，寫不下時可以往下捲 ── */
  function diaryPage({ tag, title, text, doodleName, cls = '', photo = '', caption = '' }) {
    const p = makePage('diary ' + cls);
    const s = p.sheet;
    const head = el('div', 'pg-head');
    head.append(tag ? stamp(tag) : el('span'), doodle(doodleName));
    const body = el('div', 'diary-text', text || '');
    if (!text) body.classList.add('empty');
    s.append(head, highlight('h2', 'diary-title', title), body);
    // 文字底下貼拍立得（完整顯示、不裁切），點一下放大；photo / caption 可以是一張或一組（並排貼）
    const pics = [].concat(photo || []);
    const caps = [].concat(caption || []);
    if (pics.length) {
      // 2 張並排；3 張以上拼貼（5、6 張一排 3 張，其他一排 4 張）
      const row = el('div', 'diary-photos' + (pics.length > 2 ? ' many' + ([5, 6].includes(pics.length) ? ' rows3' : '') : pics.length > 1 ? ' multi' : ''));
      pics.forEach((src, j) => {
        const pic = el('figure', 'diary-photo');
        pic.style.setProperty('--ratio', ratioOf(src));
        pic.append(photoEl(src, caps[j] || '', 'm'), tape(j % 2 ? 4 : 2, j % 2 ? 5 : -4));
        if (caps[j]) pic.append(el('figcaption', 'diary-photo-cap', caps[j]));
        pic.addEventListener('click', e => { e.stopPropagation(); openPhoto(src); });
        row.append(pic);
      });
      s.append(row);
    }
    s.append(pageNo());
    // 內容超過一頁時，在底部提示可以往下捲
    const more = el('span', 'more-hint', '往下還有 ↓');
    p.front.append(more);
    const check = () => more.classList.toggle('show', s.scrollHeight - s.clientHeight - s.scrollTop > 12);
    s.addEventListener('scroll', check, { passive: true });
    p.onEnter = check;
    p.check = check;
    return p;
  }

  // 前言
  diaryPage({ tag: D.to || '', title: D.preface?.title || '前言', text: D.preface?.text, doodleName: 'sparkle', cls: 'preface', photo: D.preface?.photo, caption: D.preface?.caption });

  /* ── 照片頁：每 2～3 張貼成一頁 ── */
  const PAPERS = ['paper-cream', 'paper-butter', 'paper-kraft'];
  // 每張照片一個區塊 [left, top, width, height]（佔頁面寬高的比例），
  // 照片依原比例完整縮放進區塊、貼向 anchor 指定的角落；區塊彼此重疊，營造手作黏貼感
  const LAYOUTS = {
    1: { slots: [[.07, .07, .86, .8]], anchor: [[.5, .5]], rot: [-2], free: [[12, 88], [76, 3]] },
    2: { slots: [[.06, .03, .82, .5], [.12, .43, .82, .5]], anchor: [[0, 0], [1, 1]], rot: [-2.5, 3], free: [[82, 8], [6, 88]] },
    3: {
      slots: [[.04, .03, .76, .43], [.22, .29, .72, .38], [.04, .5, .76, .43]],
      anchor: [[0, 0], [1, .5], [0, 1]], rot: [-3, 4, -2], free: [[80, 6], [72, 88]]
    }
  };
  const SPLIT = { 1: [1], 2: [2], 3: [3], 4: [2, 2], 5: [3, 2], 6: [3, 3], 7: [3, 2, 2], 8: [3, 3, 2], 9: [3, 3, 3] };
  const splitPhotos = count => {
    const out = [];
    while (count > 9) { out.push(3); count -= 3; }
    return count ? out.concat(SPLIT[count]) : out;
  };
  const CARD_DOODLES = ['star', 'heart', 'sparkle', 'arrow', 'sun'];
  let cardNo = 0;

  // 拍立得白邊佔照片框寬度的比例（和 style.css 的 .snap .frame padding 一致）
  // 有 caption 的照片下緣加寬：框越寬、行數越少（\n 可自己分行）
  const POLAROID = { side: .05, bottom: .16 };
  const CAP_FS = .046;   // 小字字級：頁寬的比例（照片寬窄不影響字的大小）
  // 小字實際排起來多高：在畫面外用同樣的字型排一次來量（中文標點不能在行首，用字數估會不準）
  const capMeasure = el('div', 'snap-cap-measure');
  document.body.append(capMeasure);
  const capCache = new Map();
  const capTextH = (text, width, fs) => {
    const key = `${text}|${Math.round(width)}|${fs.toFixed(1)}`;
    if (!capCache.has(key)) {
      capMeasure.style.width = width + 'px';
      capMeasure.style.fontSize = fs + 'px';
      capMeasure.textContent = text;
      capCache.set(key, capMeasure.offsetHeight);
    }
    return capCache.get(key);
  };
  // 下緣白邊高度（px）：字的高度＋上下留白（和 style.css 的 .snap-cap 一致：左右各留 6%）
  const capPx = (text, pw, fs) => capTextH(text, pw * .88, fs) + fs * .6 + pw * .08;
  const placed = [];
  function placeSnaps() {
    const W = book.clientWidth, H = book.clientHeight;
    if (!W || !H) return;
    // 框高 = 框寬 × hPerW（照片本身＋上下白邊）
    const inner = 1 - 2 * POLAROID.side;
    const fs = W * CAP_FS;
    const layout = (item, scale) => {
      let { region: [x, y, w, h], anchor: [ax, ay], ratio, mirror, caption } = item;
      if (mirror) { x = 1 - x - w; ax = 1 - ax; }
      const rw = w * W, rh = h * H;
      const body = inner / ratio + POLAROID.side;   // 照片＋上白邊，佔框寬的倍數
      let pw, f = fs;
      if (!caption) {
        pw = Math.min(rw, rh / (body + POLAROID.bottom));
      } else {
        // 下緣白邊高度跟框寬有關（框越窄、字越多行）：從最寬開始往下試，找放得進區塊的最寬框；
        // 字太多、怎樣都放不下（矮的手機、很長的說明），就把字縮小一點再試，照片不能窄過頁寬 42%
        const minPw = Math.min(rw, W * .42);
        const fitPw = fz => {
          for (let p = rw; p >= minPw; p -= W * .01) if (p * body + capPx(caption, p, fz) <= rh) return p;
          return 0;
        };
        pw = 0;
        for (const k of [1, .9, .8, .72]) {
          f = fs * k;
          if ((pw = fitPw(f))) break;
        }
        if (!pw) pw = minPw;   // 還是放不下：維持最小寬度，超出區塊的部分疊到別張照片上
      }
      pw *= scale;
      const bottom = caption ? capPx(caption, pw, f) / pw : POLAROID.bottom;
      const ph = pw * (body + bottom);
      let left = x * W + (rw - pw) * ax, top = y * H + (rh - ph) * ay;
      // 不管什麼尺寸的手機，照片都要整張留在頁面裡
      left = Math.min(Math.max(left, W * .03), W * .97 - pw);
      top = Math.min(Math.max(top, H * .015), H * .97 - ph);
      return { l: left, t: top, r: left + pw, b: top + ph, bottom, fs: f };
    };
    const hit = (a, b, m = 6) => a.l < b.r + m && b.l < a.r + m && a.t < b.b + m && b.t < a.b + m;
    // 同一頁一起排：有 whole（不要被蓋住）的照片，整頁照片一起縮小到彼此不重疊為止
    new Set(placed.map(p => p.page)).forEach(page => {
      const items = placed.filter(p => p.page === page);
      let scale = 1, rects;
      for (;;) {
        rects = items.map(it => layout(it, scale));
        const clash = items.some((it, a) => it.whole && rects.some((r, b) => a !== b && hit(rects[a], r)));
        if (!clash || scale <= .7) break;
        scale -= .02;
      }
      items.forEach(({ f }, j) => {
        const r = rects[j];
        Object.assign(f.style, { left: r.l / W * 100 + '%', top: r.t / H * 100 + '%', width: (r.r - r.l) / W * 100 + '%' });
        f.style.setProperty('--cap', r.bottom);
        f.style.setProperty('--capfs', r.fs + 'px');
        f.rect = r;
      });
    });
    placeNotes(W, H);
  }

  // 照片頁的手寫字：在照片、塗鴉、日期標籤之外，找離它們最遠的空白處
  const pageNotes = [];
  function placeNotes(W, H) {
    const gap = (a, b) => {
      const dx = Math.max(0, a.l - b.r, b.l - a.r), dy = Math.max(0, a.t - b.b, b.t - a.b);
      return dx || dy ? Math.hypot(dx, dy) : -1;   // -1：重疊
    };
    pageNotes.forEach(({ el: n, sheet, avoid, text }) => {
      const blocks = [
        // 照片（上方多留紙膠帶的高度）
        ...[...sheet.querySelectorAll('.snap')].filter(s => s.rect).map(({ rect: r }) => ({ l: r.l - 8, t: r.t - 18, r: r.r + 8, b: r.b + 8 })),
        ...avoid.map(([l, t, aw, ah]) => ({ l: l * W, t: t * H, r: (l + aw) * W, b: t * H + ah * W })),
        { l: 0, t: H * .9, r: W, b: H }   // 頁碼
      ];
      // 先試一行寫完；一行放不下（或擠在照片邊上）再試分成兩行
      // 文字裡有 \n 就照它分行；沒有的話從中間切
      const oneLine = text.replace(/\n/g, '');
      const half = Math.ceil(oneLine.length / 2);
      const twoLines = text.includes('\n') ? text : oneLine.length > 4 ? oneLine.slice(0, half) + '\n' + oneLine.slice(half) : null;
      const tries = [oneLine, twoLines].filter(Boolean);
      let best = null, bestGap = -1, bestText = text, bestSize = 0;
      // 字級從大到小試（頁寬的比例），大字放得下就用大字
      for (const size of [.075, .066, .058, .05]) {
        const fs = W * size;
        tries.forEach((t, li) => {
          const lines = t.split('\n');
          const w = Math.max(...lines.map(s => s.length)) * fs + 8, h = fs * 1.35 * lines.length;
          for (let y = H * .03; y + h <= H * .9; y += H * .015) {
            for (let x = W * .05; x + w <= W * .95; x += W * .02) {
              const box = { l: x, t: y, r: x + w, b: y + h };
              // 分兩行的版本要明顯比較寬敞才換過去
              const g = Math.min(...blocks.map(b => gap(box, b))) - (li && bestGap >= 12 ? 1e9 : 0);
              if (g > bestGap) { bestGap = g; best = box; bestText = t; bestSize = size; }
            }
          }
        });
        if (bestGap >= 6) break;
      }
      n.hidden = !best;
      n.textContent = bestText;
      if (best) Object.assign(n.style, { left: best.l / W * 100 + '%', top: best.t / H * 100 + '%', fontSize: bestSize * 100 + 'cqw' });
    });
  }
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { placeSnaps(); pages.forEach(p => p.check?.()); }, 120);
  });
  // 手寫字型載入完成後重排一次（載入前量到的是備用字型的寬度）
  document.fonts?.ready.then(() => {
    capCache.clear();
    placeSnaps();
  });

  // 一張貼上去的照片；有寫 note 的可以翻到背面看，沒寫的點一下放大
  function snap(photo, idx, n) {
    const hasNote = Boolean(photo.note);
    const f = el('figure', 'snap' + (n % 3 === 2 ? ' corners' : '') + (hasNote ? ' has-note' : '') + (photo.caption ? ' has-cap' : ''));
    f.setAttribute('role', 'button');
    f.tabIndex = 0;
    const inner = el('div', 'snap-inner');
    const frame = el('div', 'frame');
    frame.append(photoEl(photo.src, photo.caption || '', 'm'));
    // 寫在拍立得下緣的手寫小字
    if (photo.caption) {
      frame.append(el('figcaption', 'snap-cap', photo.caption));
    }
    inner.append(frame);
    if (hasNote) {
      const back = el('div', 'snap-back');
      back.append(el('p', 'snap-note', photo.note), el('span', 'snap-back-tip', '點一下翻回來 ↺'));
      inner.append(back);
      const zoom = el('button', 'zoom', '⤢');
      zoom.setAttribute('aria-label', '放大照片');
      zoom.addEventListener('click', e => { e.stopPropagation(); openLB(idx); });
      f.append(inner, el('span', 'flip-tip', '翻過來看 ↻'), zoom);
      f.setAttribute('aria-label', '照片背面有一段話，點一下翻過來看');
    } else {
      f.append(inner);
      f.setAttribute('aria-label', '放大照片');
    }
    if (n % 3 !== 2) f.append(tape(n % 5 + 1, n % 2 ? 6 : -5));
    const act = () => (hasNote ? f.classList.toggle('flipped') : openLB(idx));
    f.addEventListener('click', act);
    f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    return f;
  }

  /* ── 每趟出遊：日記 → 照片 ── */
  D.trips.forEach((t, i) => {
    const photos = t.photos.map(p => (typeof p === 'string' ? { src: p, note: '' } : p));
    const start = gallery.length;
    photos.forEach(p => gallery.push({ src: p.src, caption: t.date }));

    diaryPage({ tag: t.date, title: t.title, text: t.diary, doodleName: ['heart', 'star', 'sparkle'][i % 3], photo: t.diaryPhoto, caption: t.diaryCaption });

    let k = 0;
    splitPhotos(photos.length).forEach((size, g) => {
      const c = makePage('photos ' + PAPERS[cardNo++ % PAPERS.length]);
      const mirror = (cardNo + i) % 2 === 1;
      const { slots, anchor, rot, free } = LAYOUTS[size];
      slots.forEach((region, j) => {
        const f = snap(photos[k], start + k, k + i);
        f.style.setProperty('--tilt', (mirror ? -rot[j] : rot[j]) + 'deg');
        // 有小字的照片疊在上面；同一頁好幾張都有字時，前面的壓在後面的上面（下緣的字才不會被蓋住）
        if (photos[k].caption) f.style.zIndex = 10 - j;
        placed.push({ f, page: c, region, anchor: anchor[j], ratio: ratioOf(photos[k].src), mirror, whole: Boolean(photos[k].whole), caption: photos[k].caption || '' });
        c.sheet.append(f);
        k++;
      });
      const [dx, dy] = free[0];
      const d = doodle(CARD_DOODLES[(i + g) % CARD_DOODLES.length]);
      Object.assign(d.style, { left: (mirror ? 100 - dx - 9 : dx) + '%', top: dy + '%' });
      const [nx, ny] = free[1];
      const tag = el('span', 'card-tag', `${t.dot || ''} ${'①②③④⑤⑥⑦'[g] || ''}`);
      // 在頁面右半邊的標籤改從右邊對齊，日期區間比較長也不會超出頁面
      const tx = mirror ? 100 - nx - 20 : nx;
      Object.assign(tag.style, tx > 50 ? { right: (80 - tx) + '%', top: ny + '%' } : { left: tx + '%', top: ny + '%' });
      c.sheet.append(d, tag, pageNo());
      // 這一頁的手寫字（pageNotes 依照片頁順序），位置由 placeNotes 找空白處
      const noteText = t.pageNotes?.[g];
      if (noteText) {
        const n = el('p', 'page-note', noteText);
        c.sheet.append(n);
        const dl = mirror ? 100 - dx - 9 : dx, tl = tx > 50 ? tx - 12 : tx;
        // 要避開的塗鴉與日期標籤 [left, top, 寬, 高]（left/寬是頁寬比例、top 是頁高比例、高是頁寬比例）
        pageNotes.push({ el: n, sheet: c.sheet, text: noteText, avoid: [[dl / 100, dy / 100, .12, .12], [tl / 100, ny / 100, .34, .1]] });
      }
    });
  });

  /* ── 關於妳：貼著紙膠帶的小卡，兩張一排，有寫背面的才能翻 ── */
  if (D.traits?.length) {
    const p = makePage('traits paper-butter');
    const grid = el('div', 'trait-grid');
    const TILT = [-3, 2.5, 1.5, -2, -1.5, 3];
    D.traits.forEach((t, k) => {
      const btn = el('button', 'trait' + (t.back ? ' can-flip' : ''));
      btn.style.setProperty('--r', TILT[k % TILT.length] + 'deg');
      btn.setAttribute('aria-label', t.back ? t.word + '，點一下翻面' : t.word);
      const inner = el('div', 'inner');
      const front = el('div', 't-face t-front');
      front.append(el('div', 't-icon', t.icon), el('div', 't-word', t.word));
      inner.append(front, el('div', 't-face t-back', t.back));
      btn.append(tape(k % 5 + 1, [-5, 4, -3, 6][k % 4]), inner);
      if (t.back) btn.addEventListener('click', () => btn.classList.toggle('flipped'));
      grid.append(btn);
    });
    const sub = D.traits.some(t => t.back) ? el('p', 'section-sub', '點一下卡片翻面') : el('p', 'section-sub');
    p.sheet.append(highlight('h2', 'section-title', '關於妳'), sub, grid, pageNo());
  }

  /* ── 結語：翻到這頁時文字一行一行浮現 ── */
  const E = D.epilogue || {};
  const fin = diaryPage({ title: E.title || '結語', text: '', doodleName: 'heart', cls: 'epilogue' });
  const finBody = fin.sheet.querySelector('.diary-text');
  finBody.classList.remove('empty');
  const finSign = el('p', 'final-sign');
  finSign.hidden = true;
  finBody.after(finSign);
  let played = false;
  const finCheck = fin.onEnter;
  // 新浮現的那一行超出畫面時，慢慢往下捲到看得到
  const follow = node => {
    const s = fin.sheet, bottom = node.offsetTop + node.offsetHeight + 40;
    if (bottom > s.scrollTop + s.clientHeight) s.scrollTo({ top: bottom - s.clientHeight, behavior: 'smooth' });
  };
  fin.onEnter = async () => {
    finCheck();
    if (played) return;
    played = true;
    const lines = (E.text || '').split('\n');
    const last = lines.map(Boolean).lastIndexOf(true);
    for (let i = 0; i < lines.length; i++) {
      // [照片]：在這裡貼上一張拍立得，慢慢浮現
      if (lines[i].trim() === '[照片]') {
        if (!E.photo) continue;
        const row = el('div', 'diary-photos fin-photo');
        const pic = el('figure', 'diary-photo');
        pic.style.setProperty('--ratio', ratioOf(E.photo));
        pic.append(photoEl(E.photo, E.caption || '', 'm'), tape(2, -4));
        if (E.caption) pic.append(el('figcaption', 'diary-photo-cap', E.caption));
        pic.addEventListener('click', e => { e.stopPropagation(); openPhoto(E.photo); });
        row.append(pic);
        hydrate(row);
        finBody.append(row);
        finCheck();
        follow(row);
        await wait(1800);
        follow(row);   // 照片載入後高度變了，再跟一次
        continue;
      }
      const isBig = E.bigLast && i === last;
      const p = el('p', 'line' + (isBig ? ' big' : '') + (lines[i] ? '' : ' gap'));
      if (isBig) p.append(el('span', '', lines[i])); else p.textContent = lines[i];
      finBody.append(p);
      void p.offsetWidth;
      p.classList.add('show');
      finCheck();
      follow(p);
      if (lines[i]) await wait(isBig ? 1800 : 1300);
    }
    if (E.sign) {
      finSign.textContent = E.sign;
      finSign.hidden = false;
      await wait(1000);
    }
    follow(fin.sheet.querySelector('.pg-no') || finBody);   // 最後捲到底，「往下還有」提示就會消失
    await wait(800);
    finCheck();
  };

  /* ── 翻頁 ── */
  const n = pages.length;
  let cur = 0, busy = false;
  const EASE = 'cubic-bezier(.32, .1, .2, 1)';
  const pageNum = $('#pageNum');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');

  // deg：0 = 攤平在右邊，-180 = 翻到左邊
  function setDeg(i, deg, ms) {
    const p = pages[i];
    const tr = ms ? `${ms}ms ${EASE}` : '0s';
    p.el.style.transition = `transform ${tr}`;
    p.fs.style.transition = p.bs.style.transition = `opacity ${tr}`;
    p.el.style.transform = `rotateY(${deg}deg)`;
    const k = -deg / 180;
    p.fs.style.opacity = Math.min(1, k * 1.7);
    p.bs.style.opacity = Math.min(1, (1 - k) * 1.7);
  }

  // 疊放順序：翻過去的在左邊依序往上疊，還沒翻的由前往後疊；只顯示目前頁附近的頁面
  // 手機記憶體有限（iPhone 用太多會把分頁重新載入、跳回封面）：
  // 遠的頁面完全不畫（display: none），照片也先放掉，翻回附近再載入
  function layout() {
    pages.forEach((p, i) => {
      p.el.style.zIndex = i < cur ? i + 1 : n * 2 - i;
      p.el.style.display = i >= cur - 2 && i <= cur + 2 ? '' : 'none';
      p.el.style.visibility = i >= cur - 1 && i <= cur + 1 ? 'visible' : 'hidden';
      p.el.classList.toggle('flat', i === cur);   // 停在眼前的那一頁不用 3D，手機才捲得動
      if (i >= cur - 1 && i <= cur + 3) hydrate(p.el);
      else if (i < cur - 3 || i > cur + 5) dehydrate(p.el);
    });
    // 網址記下目前第幾頁：萬一被重新載入，也會回到同一頁
    history.replaceState(null, '', cur ? `#p=${cur}` : location.pathname + location.search);
    pageNum.textContent = cur === 0 ? '封面' : `${cur} / ${n - 1}`;
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === n - 1;
  }

  function entered() {
    layout();
    if (cur > 0) coverHint.hidden = true;
    pages[cur].onEnter?.();
  }

  // 把第 i 頁翻到 deg，完成後 cur 變成 nextCur
  function animateTo(i, deg, nextCur, ms) {
    busy = true;
    pages[i].el.style.zIndex = n * 3;
    pages[i].el.style.visibility = 'visible';
    pages[i].el.classList.remove('flat');
    setDeg(i, deg, reduce ? 1 : ms);
    return new Promise(res => setTimeout(() => {
      cur = nextCur;
      busy = false;
      entered();
      res();
    }, reduce ? 1 : ms));
  }

  function turn(dir, ms = 950) {
    if (busy) return Promise.resolve();
    if (dir > 0 && cur < n - 1) return animateTo(cur, -180, cur + 1, ms);
    if (dir < 0 && cur > 0) return animateTo(cur - 1, 0, cur - 1, ms);
    return Promise.resolve();
  }

  // 網址有 #p=頁數 就從那一頁開始（被重新載入時接著看）
  const startPage = +(location.hash.match(/^#p=(\d+)$/) || [])[1] || 0;
  if (startPage > 0 && startPage < n) cur = startPage;
  pages.forEach((_, i) => setDeg(i, i < cur ? -180 : 0, 0));
  placeSnaps();
  entered();

  prevBtn.addEventListener('click', () => { startMusic(); turn(-1); });
  nextBtn.addEventListener('click', () => { startMusic(); turn(1); });
  document.addEventListener('keydown', e => {
    if (!lb.hidden) return;
    if (e.key === 'ArrowRight') turn(1);
    if (e.key === 'ArrowLeft') turn(-1);
  });

  /* ── 手指拖曳翻頁：紙頁跟著手指掀起 ── */
  let drag = null, justDragged = false;

  book.addEventListener('pointerdown', e => {
    if (busy || e.button > 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, axis: null, i: -1, dir: 0, deg: 0, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  });

  book.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.axis) {
      if (Math.hypot(dx, dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; }    // 上下滑：交給頁面捲動
      drag.axis = 'x';
      drag.dir = dx < 0 ? 1 : -1;
      if ((drag.dir > 0 && cur >= n - 1) || (drag.dir < 0 && cur <= 0)) { drag = null; return; }
      drag.i = drag.dir > 0 ? cur : cur - 1;
      pages[drag.i].el.style.zIndex = n * 3;
      pages[drag.i].el.style.visibility = 'visible';
      pages[drag.i].el.classList.remove('flat');
      try { book.setPointerCapture(drag.id); } catch (_) {}
    }
    const w = book.clientWidth;
    const base = drag.dir > 0 ? 0 : -180;
    drag.deg = Math.max(-180, Math.min(0, base + dx / w * 200));
    const dt = e.timeStamp - drag.lastT;
    if (dt > 0) drag.v = (e.clientX - drag.lastX) / dt;
    drag.lastX = e.clientX;
    drag.lastT = e.timeStamp;
    setDeg(drag.i, drag.deg, 0);
  });

  function endDrag(cancelled) {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.axis) return;
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 50);
    startMusic();
    // 超過一半、或快速甩動，就翻過去；否則彈回
    const fling = Math.abs(d.v) > 0.5 && Math.sign(-d.v) === d.dir;
    const done = !cancelled && (fling || (d.dir > 0 ? d.deg < -90 : d.deg > -90));
    const target = done === (d.dir > 0) ? -180 : 0;
    const ms = Math.max(260, Math.abs(target - d.deg) / 180 * 900);
    const nextCur = done ? cur + d.dir : cur;
    animateTo(d.i, target, nextCur, ms);
  }
  book.addEventListener('pointerup', () => endDrag(false));
  book.addEventListener('pointercancel', () => endDrag(true));
  // 拖曳結束時不要觸發照片翻面或放大
  book.addEventListener('click', e => {
    if (justDragged) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  // 點封面也能翻開
  cover.front.addEventListener('click', () => { startMusic(); if (cur === 0) turn(1); });

  /* ── 燈箱 ── */
  const lb = $('#lightbox');
  let lbIndex = 0;
  function renderLB() {
    const item = gallery[lbIndex];
    const box = $('.lb-img', lb);
    box.textContent = '';
    box.append(photoEl(item.src, item.caption));
    hydrate(box);
    $('figcaption', lb).textContent = item.caption;
  }
  // 打開一張不在相簿照片清單裡的照片（例如明信片上的小照片）
  function openPhoto(src) {
    gallery.push({ src, caption: '' });
    openLB(gallery.length - 1);
    gallery.pop();
  }
  function openLB(i) {
    lbIndex = i;
    renderLB();
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('open'));
    $('.lb-close', lb).focus();
  }
  function closeLB() {
    lb.classList.remove('open');
    setTimeout(() => { lb.hidden = true; }, 300);
  }
  const step = d => { lbIndex = (lbIndex + d + gallery.length) % gallery.length; renderLB(); };
  $('.lb-close', lb).addEventListener('click', closeLB);
  $('.lb-prev', lb).addEventListener('click', () => step(-1));
  $('.lb-next', lb).addEventListener('click', () => step(1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  let touchX = null;
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  });

  /* ── 音樂：data.js 有填 YouTube 影片 ID 就用 YouTube，否則用 music/song.mp3 ── */
  const musicBtn = $('#musicBtn');
  const M = D.music || {};
  const setPlaying = on => {
    musicBtn.classList.toggle('playing', on);
    musicBtn.setAttribute('aria-label', on ? '暫停音樂' : '播放音樂');
  };
  let playMusic, pauseMusic, isPlaying;

  if (M.youtube) {
    let player = null, ready = false, wantPlay = false;
    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player('ytPlayer', {
        width: 200,
        height: 200,
        videoId: M.youtube,
        playerVars: { start: M.start || 0, loop: 1, playlist: M.youtube, controls: 0, playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            ready = true;
            player.setVolume(M.volume ?? 60);
            musicBtn.hidden = false;
            if (wantPlay) player.playVideo();
          },
          onStateChange: e => setPlaying(e.data === YT.PlayerState.PLAYING),
          onError: () => { musicBtn.hidden = true; }
        }
      });
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.append(s);
    playMusic = () => { wantPlay = true; if (ready) player.playVideo(); };
    pauseMusic = () => { wantPlay = false; if (ready) player.pauseVideo(); };
    isPlaying = () => ready && player.getPlayerState() === YT.PlayerState.PLAYING;
  } else {
    const bgm = $('#bgm');
    bgm.src = 'music/song.mp3';
    bgm.addEventListener('loadedmetadata', () => { musicBtn.hidden = false; });
    bgm.addEventListener('play', () => setPlaying(true));
    bgm.addEventListener('pause', () => setPlaying(false));
    playMusic = () => { if (bgm.readyState) bgm.play().catch(() => {}); };
    pauseMusic = () => bgm.pause();
    isPlaying = () => !bgm.paused;
  }
  // 第一次翻開相簿時開始播放（瀏覽器規定要在使用者操作時才能出聲）
  let musicStarted = false;
  function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    playMusic();
  }
  musicBtn.addEventListener('click', () => { musicStarted = true; isPlaying() ? pauseMusic() : playMusic(); });
})();
