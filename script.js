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

  // 封面
  const cover = makePage('cover');
  cover.sheet.remove();
  const firstDate = D.trips[0]?.date.slice(0, 7) || '';
  const lastDate = D.trips[D.trips.length - 1]?.date.slice(0, 7) || '';
  const coverBody = el('div', 'cover-body');
  // 封面圖：data.js 有填 coverPhoto 就貼那張照片，沒填就用燙金向日葵
  let win;
  if (D.coverPhoto) {
    win = el('div', 'cover-window');
    win.append(tape(1, -6), photoEl(D.coverPhoto, '', 'm'));
  } else {
    win = el('div', 'cover-art');
    win.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#sunflower"/></svg>';
  }
  const label = el('div', 'cover-label');
  const title = el('h1', 'cover-title');
  const [t1, t2] = (D.heroTitle || '').split('，');
  if (t2 != null) title.append(t1 + '，', document.createElement('br'), t2); else title.textContent = t1;
  label.append(el('p', 'cover-to', D.to), title,
    el('p', 'cover-range', `${firstDate.replace('.', ' · ')}  —  ${lastDate.replace('.', ' · ')}`), el('p', 'cover-sub', D.heroSub));
  if (D.coverPhoto) {
    const sticker = el('span', 'cover-sticker');
    sticker.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#sunflower"/></svg>';
    label.append(sticker);
  }
  coverBody.append(win, label);
  const coverHint = el('p', 'cover-hint', '往左滑翻開 ');
  coverHint.append(el('span', '', '←'));
  cover.front.prepend(el('div', 'cover-spine'), el('div', 'cover-corner tr'), el('div', 'cover-corner br'), coverBody, coverHint);

  /* ── 日記頁：橫線筆記本，寫不下時可以往下捲 ── */
  function diaryPage({ tag, title, text, doodleName, cls = '' }) {
    const p = makePage('diary ' + cls);
    const s = p.sheet;
    const head = el('div', 'pg-head');
    head.append(tag ? stamp(tag) : el('span'), doodle(doodleName));
    const body = el('div', 'diary-text', text || '');
    if (!text) body.classList.add('empty');
    s.append(head, highlight('h2', 'diary-title', title), body, pageNo());
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
  diaryPage({ tag: D.to || '', title: D.preface?.title || '前言', text: D.preface?.text, doodleName: 'sparkle', cls: 'preface' });

  /* ── 照片頁：每 2～3 張貼成一頁 ── */
  const PAPERS = ['paper-cream', 'paper-butter', 'paper-kraft'];
  // 每張照片一個區塊 [left, top, width, height]（佔頁面寬高的比例），
  // 照片依原比例完整縮放進區塊、貼向 anchor 指定的角落；區塊彼此重疊，營造手作黏貼感
  const LAYOUTS = {
    1: { slots: [[.07, .07, .86, .8]], anchor: [[.5, .5]], rot: [-2], free: [[12, 88], [76, 3]] },
    2: { slots: [[.05, .03, .76, .5], [.19, .43, .76, .5]], anchor: [[0, 0], [1, 1]], rot: [-2.5, 3], free: [[82, 8], [6, 88]] },
    3: {
      slots: [[.04, .03, .68, .42], [.34, .29, .62, .38], [.05, .56, .64, .37]],
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

  const placed = [];
  function placeSnaps() {
    const W = book.clientWidth, H = book.clientHeight;
    if (!W || !H) return;
    placed.forEach(({ f, region: [x, y, w, h], anchor: [ax, ay], ratio, mirror, pad }) => {
      if (mirror) { x = 1 - x - w; ax = 1 - ax; }
      const rw = w * W, rh = h * H;
      const pw = Math.min(rw, (rh - pad) * ratio + pad);
      const ph = (pw - pad) / ratio + pad;
      Object.assign(f.style, {
        left: (x * W + (rw - pw) * ax) / W * 100 + '%',
        top: (y * H + (rh - ph) * ay) / H * 100 + '%',
        width: pw / W * 100 + '%'
      });
    });
  }
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { placeSnaps(); pages.forEach(p => p.check?.()); }, 120);
  });

  // 一張貼上去的照片；有寫 note 的可以翻到背面看，沒寫的點一下放大
  function snap(photo, idx, n) {
    const hasNote = Boolean(photo.note);
    const f = el('figure', 'snap' + (n % 3 === 2 ? ' corners' : '') + (hasNote ? ' has-note' : ''));
    f.setAttribute('role', 'button');
    f.tabIndex = 0;
    const inner = el('div', 'snap-inner');
    const frame = el('div', 'frame');
    frame.append(photoEl(photo.src, '', 'm'));
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
    photos.forEach(p => gallery.push({ src: p.src, caption: t.title || t.date }));

    diaryPage({ tag: t.date, title: t.title, text: t.diary, doodleName: ['heart', 'star', 'sparkle'][i % 3] });

    let k = 0;
    splitPhotos(photos.length).forEach((size, g) => {
      const c = makePage('photos ' + PAPERS[cardNo++ % PAPERS.length]);
      const mirror = (cardNo + i) % 2 === 1;
      const { slots, anchor, rot, free } = LAYOUTS[size];
      slots.forEach((region, j) => {
        const f = snap(photos[k], start + k, k + i);
        f.style.setProperty('--tilt', (mirror ? -rot[j] : rot[j]) + 'deg');
        placed.push({ f, region, anchor: anchor[j], ratio: ratioOf(photos[k].src), mirror, pad: f.classList.contains('corners') ? 0 : 12 });
        c.sheet.append(f);
        k++;
      });
      const [dx, dy] = free[0];
      const d = doodle(CARD_DOODLES[(i + g) % CARD_DOODLES.length]);
      Object.assign(d.style, { left: (mirror ? 100 - dx - 9 : dx) + '%', top: dy + '%' });
      const [nx, ny] = free[1];
      const tag = el('span', 'card-tag', `${t.dot || ''} ${'①②③④⑤⑥⑦'[g] || ''}`);
      Object.assign(tag.style, { left: (mirror ? 100 - nx - 20 : nx) + '%', top: ny + '%' });
      c.sheet.append(d, tag, pageNo());
    });
  });

  /* ── 關於你：三張貼著紙膠帶的索引卡 ── */
  if (D.traits?.length) {
    const p = makePage('traits paper-butter');
    const grid = el('div', 'trait-grid');
    D.traits.forEach((t, k) => {
      const btn = el('button', 'trait');
      btn.setAttribute('aria-label', t.word + '，點一下翻面');
      const inner = el('div', 'inner');
      const front = el('div', 't-face t-front');
      front.append(el('div', 't-icon', t.icon), el('div', 't-word', t.word));
      inner.append(front, el('div', 't-face t-back', t.back));
      btn.append(tape([1, 3, 5][k % 3], [-5, 4, -3][k % 3]), inner);
      btn.addEventListener('click', () => btn.classList.toggle('flipped'));
      grid.append(btn);
    });
    p.sheet.append(highlight('h2', 'section-title', '關於你'), el('p', 'section-sub', '點一下卡片翻面'), grid, pageNo());
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
  fin.onEnter = async () => {
    finCheck();
    if (played) return;
    played = true;
    const lines = (E.text || '').split('\n');
    const last = lines.map(Boolean).lastIndexOf(true);
    for (let i = 0; i < lines.length; i++) {
      const isBig = E.bigLast && i === last;
      const p = el('p', 'line' + (isBig ? ' big' : '') + (lines[i] ? '' : ' gap'));
      if (isBig) p.append(el('span', '', lines[i])); else p.textContent = lines[i];
      finBody.append(p);
      void p.offsetWidth;
      p.classList.add('show');
      finCheck();
      if (lines[i]) await wait(isBig ? 1800 : 1300);
    }
    if (E.sign) {
      finSign.textContent = E.sign;
      finSign.hidden = false;
      await wait(1000);
    }
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
  function layout() {
    pages.forEach((p, i) => {
      p.el.style.zIndex = i < cur ? i + 1 : n * 2 - i;
      p.el.style.visibility = i >= cur - 1 && i <= cur + 1 ? 'visible' : 'hidden';
      if (i >= cur - 1 && i <= cur + 3) hydrate(p.el);
    });
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

  pages.forEach((_, i) => setDeg(i, 0, 0));
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
    $('figcaption', lb).textContent = `${item.caption}　${lbIndex + 1} / ${gallery.length}`;
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
