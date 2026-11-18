/* ============================================================================
 *  PhysBoard 主程序 app.js  ——  伪无限画布 / 手势 / 手掌擦除 / 图片 / 视频
 *  必须在 license.js 之后加载
 * ============================================================================ */
(function () {
'use strict';

const PB = window.PhysBoard || (window.PhysBoard = {
  shapes: {}, paramDefs: {}, categories: [],
  register(d) { this.shapes[d.key] = d; },
  category(id, label) { this.categories.push({ id, label }); },
  param(key, def) { this.paramDefs[key] = def; }
});

/* =====================================================================
 * 1. 常量
 * ===================================================================== */
const COLORS = [
  '#ffffff', '#ff0000', '#ff5500', '#ff9900', '#ffcc00', '#ffee00',
  '#88cc00', '#22cc22', '#00cc88', '#0088ff', '#4455ee', '#6644cc',
  '#aa22cc', '#dd22aa', '#000000'
];
const PEN_SIZES = [ {v:2, d:7}, {v:5, d:14}, {v:11, d:22} ];
const BORDER_SIZES = [ {v:1}, {v:3}, {v:6} ];
const DASH_STYLES = [
  { id:'solid',  svg:'<line x1="2" y1="7" x2="54" y2="7" stroke-width="2.5" stroke-linecap="round"/>' },
  { id:'dashed', svg:'<line x1="2" y1="7" x2="54" y2="7" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="9 6"/>' },
  { id:'center', svg:'<line x1="2" y1="7" x2="54" y2="7" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="18 5 3 5"/>' }
];

const TEXT_FONTS = [
  { id:'system', label:'系统默认', css:'system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif' },
  { id:'hei',    label:'黑体',     css:'"Microsoft YaHei","PingFang SC","Heiti SC","SimHei",sans-serif' },
  { id:'song',   label:'宋体',     css:'"SimSun","Songti SC","STSong",serif' },
  { id:'kai',    label:'楷体',     css:'"KaiTi","STKaiti","Kaiti SC",serif' },
  { id:'fangsong', label:'仿宋',   css:'"FangSong","STFangsong",serif' },
  { id:'mono',   label:'等宽',     css:'ui-monospace,Menlo,Consolas,"Courier New",monospace' },
  { id:'serif',  label:'西文衬线', css:'Georgia,"Times New Roman",Times,serif' },
  { id:'hand',   label:'手写体',   css:'"Comic Sans MS","Segoe Print","Bradley Hand",cursive' }
];
const TEXT_PARAMS = ['fontFamily','fontSize','bold','italic','underline','textAlign'];

const MASK_SCALE = 0.5;
const MASK_PAD = 32;

const CUSTOM_ICON = '<rect x="3" y="3" width="11" height="11" rx="2.5"/><rect x="10" y="10" width="11" height="11" rx="2.5"/>';

const LINE_SNAP_ANGLES = [0, 30, 37, 45, 53, 60, 90];
const LINE_SNAP_TOL = 2 * Math.PI / 180;
const LINE_SNAP_MIN_LEN = 8;

const BG_PRESETS = [
  { id:'transparent', name:'透明（批注）',
    css:'transparent',
    swatch:'repeating-conic-gradient(#334 0% 25%, #556 0% 50%) 0 0 / 10px 10px',
    light:false, fill:'transparent',
    colors:['transparent','transparent','transparent'] },
  { id:'tech', name:'科技深空',
    css:'radial-gradient(ellipse 120% 80% at 15% -10%, rgba(56,189,248,.22), transparent 55%),' +
        'radial-gradient(ellipse 100% 80% at 90% 110%, rgba(129,140,248,.20), transparent 55%),' +
        'radial-gradient(ellipse 90% 60% at 50% 50%, rgba(14,32,64,.65), transparent 70%),' +
        'linear-gradient(160deg, #060c18 0%, #0a1428 45%, #0b1020 100%)',
    swatch:'linear-gradient(160deg,#060c18,#0a1428 50%,#0b1020)', light:false, fill:'#0d1830',
    colors:['#060c18','#0a1428','#0b1020'] },

  { id:'nebula', name:'星云紫',
    css:'radial-gradient(ellipse 110% 80% at 20% -10%, rgba(192,132,252,.24), transparent 55%),' +
        'radial-gradient(ellipse 100% 80% at 90% 110%, rgba(56,189,248,.18), transparent 55%),' +
        'linear-gradient(160deg, #120a24 0%, #1a1032 50%, #0d0820 100%)',
    swatch:'linear-gradient(160deg,#120a24,#1a1032 50%,#0d0820)', light:false, fill:'#16102a',
    colors:['#120a24','#1a1032','#0d0820'] },

  { id:'aurora', name:'极光青',
    css:'radial-gradient(ellipse 110% 80% at 20% -10%, rgba(52,211,153,.20), transparent 55%),' +
        'radial-gradient(ellipse 100% 80% at 90% 110%, rgba(56,189,248,.22), transparent 55%),' +
        'linear-gradient(160deg, #041a20 0%, #062a33 50%, #04202a 100%)',
    swatch:'linear-gradient(160deg,#041a20,#062a33 50%,#04202a)', light:false, fill:'#082a33',
    colors:['#041a20','#062a33','#04202a'] },

  { id:'ocean', name:'深海蓝',
    css:'radial-gradient(ellipse 110% 80% at 18% -10%, rgba(56,189,248,.18), transparent 55%),' +
        'radial-gradient(ellipse 100% 80% at 90% 110%, rgba(30,80,180,.24), transparent 55%),' +
        'linear-gradient(160deg, #061428 0%, #0a1e3a 50%, #051228 100%)',
    swatch:'linear-gradient(160deg,#061428,#0a1e3a 50%,#051228)', light:false, fill:'#0c1e3a',
    colors:['#061428','#0a1e3a','#051228'] },

  { id:'sunset', name:'暮光橙',
    css:'radial-gradient(ellipse 110% 80% at 15% -10%, rgba(251,146,60,.22), transparent 55%),' +
        'radial-gradient(ellipse 100% 80% at 90% 110%, rgba(244,63,94,.20), transparent 55%),' +
        'linear-gradient(160deg, #2a0e0a 0%, #3d1810 50%, #20080a 100%)',
    swatch:'linear-gradient(160deg,#2a0e0a,#3d1810 50%,#20080a)', light:false, fill:'#331410',
    colors:['#2a0e0a','#3d1810','#20080a'] },

  { id:'forest', name:'松林绿',
    css:'radial-gradient(ellipse 110% 80% at 20% -10%, rgba(52,211,153,.16), transparent 55%),' +
        'radial-gradient(ellipse 100% 80% at 90% 110%, rgba(34,197,94,.18), transparent 55%),' +
        'linear-gradient(160deg, #0a1f14 0%, #13301f 50%, #071a10 100%)',
    swatch:'linear-gradient(160deg,#0a1f14,#13301f 50%,#071a10)', light:false, fill:'#0f2418',
    colors:['#0a1f14','#13301f','#071a10'] },

  { id:'eye', name:'护眼绿',
    css:'linear-gradient(160deg,#d4ecd6 0%,#c7e6cd 50%,#bfe0c6 100%)',
    swatch:'linear-gradient(160deg,#d4ecd6,#c7e6cd)', light:true, fill:'#c7e6cd',
    colors:['#d4ecd6','#c7e6cd','#bfe0c6'] },

  { id:'paper', name:'纸感米白',
    css:'linear-gradient(160deg,#fdfbf4 0%,#f7f3e8 50%,#f1ead9 100%)',
    swatch:'linear-gradient(160deg,#fdfbf4,#f1ead9)', light:true, fill:'#f7f3e8',
    colors:['#fdfbf4','#f7f3e8','#f1ead9'] },

  { id:'mist', name:'雾霾灰',
    css:'radial-gradient(ellipse 110% 80% at 15% -10%, rgba(148,163,184,.25), transparent 55%),' +
        'radial-gradient(ellipse 100% 80% at 90% 110%, rgba(100,116,139,.20), transparent 55%),' +
        'linear-gradient(160deg, #eef1f5 0%, #e3e8ee 50%, #dae0e7 100%)',
    swatch:'linear-gradient(160deg,#eef1f5,#dae0e7)', light:true, fill:'#e8edf2',
    colors:['#eef1f5','#e3e8ee','#dae0e7'] },

  { id:'white', name:'纯白',
    css:'linear-gradient(160deg,#ffffff 0%,#f7fafd 100%)',
    swatch:'linear-gradient(160deg,#ffffff,#f7fafd)', light:true, fill:'#ffffff',
    colors:['#ffffff','#fbfcfe','#f7fafd'] }
];


/* =====================================================================
 * 1b. 自定义背景与一键换肤
 * ===================================================================== */
const CUSTOM_BG_KEY = 'pb_custom_bg';
let __bgImageCache = { url: null, img: null };

function loadCustomBgPreset() {
  try {
    const raw = localStorage.getItem(CUSTOM_BG_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (!c || !c.css) return null;
    return {
      id: 'custom',
      name: c.name || '自定义背景',
      css: c.css,
      swatch: c.swatch || c.css,
      light: !!c.light,
      fill: c.fill || (c.light ? '#f7f3e8' : '#0d1830'),
      colors: c.colors || (c.light
        ? ['#f7f3e8','#efe9da','#e6e0d0']
        : ['#0d1830','#0a1428','#060c18']),
      image: c.image || null
    };
  } catch (e) { return null; }
}

function getAllBgPresets() {
  const list = BG_PRESETS.slice();
  const c = loadCustomBgPreset();
  if (c) list.push(c);
  return list;
}

function findBgPreset(id) {
  const all = getAllBgPresets();
  return all.find(p => p.id === id) || BG_PRESETS[0];
}

function saveCustomBg(obj) {
  try {
    localStorage.setItem(CUSTOM_BG_KEY, JSON.stringify(obj));
    return true;
  } catch (e) {
    console.warn('[bg] 保存自定义背景失败：', e);
    return false;
  }
}

function preloadBgImage() {
  const preset = findBgPreset(state.bg);
  if (!preset.image) { __bgImageCache = { url: null, img: null }; return Promise.resolve(); }
  if (__bgImageCache.url === preset.image && __bgImageCache.img) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { __bgImageCache = { url: preset.image, img }; resolve(); };
    img.onerror = () => { __bgImageCache = { url: null, img: null }; resolve(); };
    img.src = preset.image;
  });
}

function paintBackgroundToCanvas(c, w, h, opts) {
  opts = opts || {};
  const preset = findBgPreset(state.bg);

  /* 图片背景：cover 铺满 */
  if (preset.image && __bgImageCache.img && __bgImageCache.url === preset.image) {
    const img = __bgImageCache.img;
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    if (iw > 1 && ih > 1) {
      const s = Math.max(w / iw, h / ih);
      const dw = iw * s, dh = ih * s;
      c.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return;
    }
  }

  /* 缩略图等场景用纯色兜底 */
  if (opts.solidFallback) {
    c.fillStyle = preset.light ? '#eef2f8' : '#0d1830';
    c.fillRect(0, 0, w, h);
    return;
  }

  /* 内置渐变 / 透明背景 */
  const cols = preset.colors || ['#060c18', '#0a1428', '#0b1020'];
  const grad = c.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, cols[0]);
  grad.addColorStop(0.5, cols[1]);
  grad.addColorStop(1, cols[2]);
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);
}

function compressImageToDataUrl(file, maxDim, quality, maxBytes) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let mdim = maxDim || 1920;
        let q = quality || 0.85;
        const limit = maxBytes || (2.8 * 1024 * 1024);
        for (let attempt = 0; attempt < 7; attempt++) {
          const k = Math.min(1, mdim / Math.max(img.naturalWidth, img.naturalHeight));
          const cw = Math.max(1, Math.round(img.naturalWidth * k));
          const ch = Math.max(1, Math.round(img.naturalHeight * k));
          const cv = document.createElement('canvas');
          cv.width = cw; cv.height = ch;
          cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
          const data = cv.toDataURL('image/jpeg', q);
          if (data.length <= limit || attempt === 6) { resolve(data); return; }
          mdim = Math.round(mdim * 0.75);
          q = Math.max(0.38, q - 0.08);
        }
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function detectImageLight(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width = 32; cv.height = 32;
        const c = cv.getContext('2d');
        c.drawImage(img, 0, 0, 32, 32);
        const d = c.getImageData(0, 0, 32, 32).data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) {
          sum += d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
        }
        resolve(sum / (d.length / 4) > 140);
      } catch (e) { resolve(false); }
    };
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}

function hexToRgb(hex) {
  if (!hex || hex[0] !== '#') return null;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixColor(a, b, t) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] * (1 - t) + pb[0] * t);
  const g = Math.round(pa[1] * (1 - t) + pb[1] * t);
  const bl = Math.round(pa[2] * (1 - t) + pb[2] * t);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

/* =====================================================================
 * 1c. 文字编辑器 / 公式键盘 · 主题同步
 *      - 顶层框架元素由 CSS 变量自动跟随 body.pb-light
 *      - iframe（latex-formula-editor）本身是浅色的：
 *        浅色主题 → 不注入；深色主题 → 注入深色覆盖样式
 * ===================================================================== */
function getEmbeddedThemeCSS() {
  const light = document.body.classList.contains('pb-light');
  if (light) return '';
  return `
    html, body {
      background: #0a101c !important;
      color: #e6edf7 !important;
    }
    body { background: #0a101c !important; }
    input, textarea, select {
      background: #131c2e !important;
      color: #e6edf7 !important;
      border-color: #2a3a55 !important;
    }
    input::placeholder, textarea::placeholder { color: #6b7c96 !important; }
button:not([class*="pb-"]) {
      background: rgba(120,180,255,.08) !important;
      color: #e6edf7 !important;
      border-color: rgba(120,180,255,.22) !important;
    }
button:not([class*="pb-"]):hover,
    input:not([class*="pb-"]):hover,
    textarea:not([class*="pb-"]):hover,
    select:not([class*="pb-"]):hover {
      background: rgba(120,180,255,.18) !important;
    }


    button:hover, input:hover, textarea:hover, select:hover {
      background: rgba(120,180,255,.18) !important;
    }
    button.active, button[data-active="true"], .active {
      background: rgba(56,189,248,.28) !important;
      color: #fff !important;
    }
    .toolbar, .header, .footer, .panel, .card,
    .tabs, .tab-bar, .status-bar,
    [class*="toolbar"], [class*="header"], [class*="footer"],
    [class*="panel"], [class*="card"] {
      background: #0e1626 !important;
      color: #e6edf7 !important;
      border-color: rgba(120,180,255,.18) !important;
    }
    .MathJax, mjx-container { color: #e6edf7; }
    canvas { background: #f7f3e8; }
  `;
}

function syncEmbeddedEditorsTheme() {
  document.querySelectorAll('iframe.pb-theme-frame').forEach(f => {
    try {
      const doc = f.contentDocument;
      if (!doc || !doc.head) return;
      let styleEl = doc.getElementById('__pb_theme_override');
      if (!styleEl) {
        styleEl = doc.createElement('style');
        styleEl.id = '__pb_theme_override';
        doc.head.appendChild(styleEl);
      }
      styleEl.textContent = getEmbeddedThemeCSS();
    } catch (e) {
      /* 跨域时忽略 */
    }
  });
}


function setupCustomBgUI() {
  /* ---- 一键换肤：在所有背景（含透明 / 自定义）之间循环 ---- */
  const randomBtn = document.getElementById('randomSkinBtn');
  if (randomBtn) {
    let longPressed = false;      // ★ 长按触发标记
    let pressTimer = null;

    /* 左键单击：循环换肤 */
    randomBtn.addEventListener('click', () => {
      // 长按刚触发过 → 忽略这次 click，避免切走透明
      if (longPressed) {
        longPressed = false;
        return;
      }
      const all = getAllBgPresets();
      let idx = all.findIndex(p => p.id === state.bg);
      if (idx < 0) idx = -1;
      const next = all[(idx + 1) % all.length];
      applyBg(next.id);
      toast('🎲 已换肤：' + next.name);
    });

    /* 右键：直接回透明（右键不产生 click，不需要 flag） */
    randomBtn.addEventListener('contextmenu', e => {
      e.preventDefault();
      applyBg('transparent');
      toast('已切回透明背景');
    });

    /* 长按 600ms：直接回透明 */
    randomBtn.addEventListener('pointerdown', () => {
      longPressed = false;          // ★ 每次按下先重置，避免上次卡住
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        longPressed = true;         // ★ 打标，告诉 click「这次别切」
        applyBg('transparent');
        toast('已切回透明背景');
      }, 600);
    });

    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
      randomBtn.addEventListener(ev, () => { clearTimeout(pressTimer); })
    );
  }

  /* ---- 展开 / 收起自定义面板 ---- */
  const toggleBtn = document.getElementById('customBgToggleBtn');
  const panel = document.getElementById('customBgPanel');
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
  }

  /* ---- 上传图片背景 ---- */
  const imgInput = document.getElementById('bgImgInput');
  const uploadBtn = document.getElementById('uploadBgImgBtn');
  if (uploadBtn && imgInput) {
    uploadBtn.addEventListener('click', () => imgInput.click());
    imgInput.addEventListener('change', async () => {
      const f = imgInput.files && imgInput.files[0];
      imgInput.value = '';
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('请选择图片文件'); return; }
      uploadBtn.disabled = true;
      const oldText = uploadBtn.textContent;
      uploadBtn.textContent = '处理中…';
      try {
        const dataUrl = await compressImageToDataUrl(f, 1920, 0.85, 2.8 * 1024 * 1024);
        const isLight = await detectImageLight(dataUrl);
        const ok = saveCustomBg({
          type: 'image',
          name: '自定义图片',
          image: dataUrl,
          css: 'url(' + dataUrl + ') center center / cover no-repeat',
          swatch: 'url(' + dataUrl + ') center / cover',
          light: isLight,
          fill: isLight ? '#f7f3e8' : '#0d1830',
          colors: isLight
            ? ['#f7f3e8', '#efe9da', '#e6e0d0']
            : ['#0d1830', '#0a1428', '#060c18']
        });
        if (!ok) { toast('图片太大，无法保存到本机'); return; }
        const lightRow = document.getElementById('customBgLightRow');
        if (lightRow) {
          lightRow.querySelectorAll('.seg-btn').forEach(b => {
            b.classList.toggle('active', (b.dataset.val === 'light') === isLight);
          });
        }
        applyBg('custom');
        toast('✅ 已应用自定义图片背景' + (isLight ? '（浅色）' : '（深色）'));
      } catch (e) {
        toast('图片处理失败：' + (e && e.message ? e.message : e));
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = oldText;
      }
    });
  }

  /* ---- 明暗模式切换 ---- */
  const lightRow = document.getElementById('customBgLightRow');
  if (lightRow) {
    lightRow.addEventListener('click', e => {
      const b = e.target.closest('.seg-btn');
      if (!b) return;
      lightRow.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('active', x === b));
    });
  }

  /* ---- 渐变背景 ---- */
  const applyGradBtn = document.getElementById('applyGradBgBtn');
  if (applyGradBtn) {
    applyGradBtn.addEventListener('click', () => {
      const a = document.getElementById('bgColorA').value;
      const b = document.getElementById('bgColorB').value;
      const lightMode = lightRow && lightRow.querySelector('.seg-btn.active')?.dataset.val === 'light';
      const ok = saveCustomBg({
        type: 'gradient',
        name: '自定义渐变',
        css: 'linear-gradient(160deg, ' + a + ' 0%, ' + b + ' 100%)',
        swatch: 'linear-gradient(160deg, ' + a + ', ' + b + ')',
        light: !!lightMode,
        fill: a,
        colors: [a, mixColor(a, b, 0.5), b]
      });
      if (!ok) { toast('保存失败'); return; }
      applyBg('custom');
      toast('✅ 已应用自定义渐变背景');
    });
  }

  /* ---- 清除 ---- */
  const clearBtn = document.getElementById('clearCustomBgBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      try { localStorage.removeItem(CUSTOM_BG_KEY); } catch (e) {}
      __bgImageCache = { url: null, img: null };
      if (state.bg === 'custom') applyBg('tech');
      else buildBgRow();
      toast('已清除自定义背景');
    });
  }
}



/* =====================================================================
 * 2. 状态
 * ===================================================================== */
const state = {
  tool: 'pen',
  penSize: 5, penColor: '#ff0000', penDash: 'solid',
  borderSize: 3, borderColor: '#ff0000',
  fillColor: '#38bdf8', fillAlpha: 0.6, fillActive: false,
  shapeCat: null, bg: 'transparent', // 默认透明
  textFontFamily: 'system',
  textSize: 32,
  textBold: false,
  textItalic: false,
  textUnderline: false
};
let cloneMode = false;
let internalClipboard = [];
let pasteCount = 0;

const view = {
  scale: 1,
  minScale: 0.15,
  maxScale: 6,
  offsetX: 0,
  offsetY: 0
};
function screenToWorld(x, y) {
  return { x: (x - view.offsetX) / view.scale, y: (y - view.offsetY) / view.scale };
}
function worldToScreen(x, y) {
  return { x: x * view.scale + view.offsetX, y: y * view.scale + view.offsetY };
}
function zoomAtScreen(cx, cy, factor) {
  const w = screenToWorld(cx, cy);
  const ns = Math.max(view.minScale, Math.min(view.maxScale, view.scale * factor));
  view.scale = ns;
  view.offsetX = cx - w.x * ns;
  view.offsetY = cy - w.y * ns;
}
function resetView() {
  view.scale = 1;
  view.offsetX = 0;
  view.offsetY = 0;
  render(); drawPreview(); updateSelBarPosition();
  if (typeof positionTextEditor === 'function') positionTextEditor();
}

const activePointers = new Map();
const ignorePointers = new Set();
let gesture = null;
let panState = null;
let penActive = false;
let palmPointerId = null;
let palmPrevTool = null;

function isPalm(e) {
  if (e.pointerType !== 'touch') return false;
  const w = e.width || 0;
  const h = e.height || 0;
  if (w < 1 || h < 1) return false;
  return w >= 35 && h >= 35;
}

function abortCurrentOp() {
  if (!drawing && !selState) return;
  interactiveDrag = null;      // ★ 新增
  if (selState && selState.changed && !selState.snapshotDone) pushSnapshot();
  current = null;
  erasing = false;
  drawing = false;
  selState = null;
  marquee = null;
  endSnap();
  render(); drawPreview();
}

function startGesture() {
  const pts = [...activePointers.values()];
  if (pts.length < 2) return;
  const p1 = pts[0], p2 = pts[1];
  gesture = {
    startDist: Math.max(1, Math.hypot(p2.x - p1.x, p2.y - p1.y)),
    startMid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
    startScale: view.scale,
    startOffsetX: view.offsetX,
    startOffsetY: view.offsetY
  };
}
function applyGesture() {
  const pts = [...activePointers.values()].slice(0, 2);
  const p1 = pts[0], p2 = pts[1];
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  const factor = dist / gesture.startDist;
  const ns = Math.max(view.minScale, Math.min(view.maxScale, gesture.startScale * factor));

  const wx = (gesture.startMid.x - gesture.startOffsetX) / gesture.startScale;
  const wy = (gesture.startMid.y - gesture.startOffsetY) / gesture.startScale;

  view.scale = ns;
  view.offsetX = mid.x - wx * ns;
  view.offsetY = mid.y - wy * ns;

  render(); drawPreview();
}

let pages = [[]];
let pageIndex = 0;
let objects = pages[0];

let selection = [];
let current = null;
let drawing = false;
let interactiveDrag = null;   // ★ 新增：图形内交互拖拽
let selState = null;
let marquee = null;
let snapshots = [];
let snapIndex = -1;
let W = 0, H = 0, dpr = 1;
let eraseSliderEl = null;

let erasing = false;
let eraseDirty = false;
let erasedThisStroke = new Set();
let lastErasePt = null;
let lastHoverPt = null;
let lastEraserRadius = 22;
let eraserSizeMul = 1;

let saveDirHandle = null;
let cachedShapesHandle = null;

/* =====================================================================
 * 3. DOM
 * ===================================================================== */
const board = document.getElementById('board');
const preview = document.getElementById('preview');
const ctx = board.getContext('2d');
const pctx = preview.getContext('2d');

const penPanel = document.getElementById('penPanel');
const shapePanel = document.getElementById('shapePanel');
const borderPanel = document.getElementById('borderPanel');
const fillPanel = document.getElementById('fillPanel');
const paramsPanel = document.getElementById('paramsPanel');
const enhancePanel = document.getElementById('enhancePanel');
const videoEditPanel = document.getElementById('videoEditPanel');
const selBar = document.getElementById('selBar');
const catStrip = document.getElementById('catStrip');
const shapeGrid = document.getElementById('shapeGrid');
const penSizesEl = document.getElementById('penSizes');
const penColorsEl = document.getElementById('penColors');
const penStylesEl = document.getElementById('penStyles');
const borderSizesEl = document.getElementById('borderSizes');
const borderColorsEl = document.getElementById('borderColors');
const borderStylesEl = document.getElementById('borderStyles');
const fillColorsEl = document.getElementById('fillColors');
const fillAlphaInput = document.getElementById('fillAlpha');
const fillAlphaVal = document.getElementById('fillAlphaVal');
const paramsBody = document.getElementById('paramsBody');
const menuPop = document.getElementById('menuPop');
const pgLabel = document.getElementById('pgLabel');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const playAllBtn = document.getElementById('playAllBtn');
const pauseAllBtn = document.getElementById('pauseAllBtn');
const resetAllBtn = document.getElementById('resetAllBtn');
const thumbPanel = document.getElementById('thumbPanel');
const thumbScroll = document.getElementById('thumbScroll');
const thumbCount = document.getElementById('thumbCount');

/* =====================================================================
 * 4. 几何 / 颜色工具
 * ===================================================================== */
function alphaColor(hex, a) {
  if (!hex) return 'rgba(0,0,0,' + a + ')';
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const n = parseInt(h, 16);
  if (isNaN(n)) return 'rgba(0,0,0,' + a + ')';
  return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
}
function rotatePt(p, c, a) {
  if (!a) return { x:p.x, y:p.y };
  const cos = Math.cos(a), sin = Math.sin(a);
  const dx = p.x - c.x, dy = p.y - c.y;
  return { x:c.x + dx*cos - dy*sin, y:c.y + dx*sin + dy*cos };
}
function distToSeg(p, a, b) {
  const dx = b.x-a.x, dy = b.y-a.y;
  const l2 = dx*dx + dy*dy;
  if (l2 === 0) return Math.hypot(p.x-a.x, p.y-a.y);
  let t = ((p.x-a.x)*dx + (p.y-a.y)*dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x-(a.x+t*dx), p.y-(a.y+t*dy));
}

function isTextObj(o) {
  if (!o) return false;
  const d = PB.shapes[o.type];
  return !!(d && d.geom === 'text');
}
function getFontCss(id) {
  const f = TEXT_FONTS.find(x => x.id === id);
  return f ? f.css : TEXT_FONTS[0].css;
}

/* =====================================================================
 * 17a. 数学公式渲染（MathJax 3 → SVG → Image 缓存）
 * ===================================================================== */
const __mathCache   = new Map();
const __mathSvgCache = new Map();   // ★ 新增：缓存原始 svgStr，供编辑器预览复用
let __activeEditorPreviewRefresh = null; // ★ 新增：当前打开的编辑器预览刷新回调
const __mathPending = new Set();
const __mathFailed  = new Set();
const __mathBaseFS  = 16;

function isMathJaxReady() {
  return !!(window.MathJax && typeof window.MathJax.tex2svg === 'function');
}

/* ---- 判断 LaTeX 是否“看起来完整”，避免输入过程中无效渲染 ---- */
function isLatexLikelyComplete(latex) {
  const s = String(latex || '');
  if (!s.trim()) return false;
  
  /* 大括号不配对 → 不完整 */
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') { depth--; if (depth < 0) return false; }
  }
  if (depth !== 0) return false;
  
  /* 以 \ 结尾（转义还没写完） → 不完整 */
  if (s.endsWith('\\')) return false;
  
  /* ★ 删除了 /\\[a-zA-Z]+$/ 的正则，允许 \Phi, \alpha, \sin 等直接渲染 */
  
  return true;
}

function parseMathSegments(line) {
  const segments = [];
  let i = 0;
  while (i < line.length) {
    const idxDollar = line.indexOf('$', i);
    const idxInline = line.indexOf('\\(', i);
    if (idxDollar < 0 && idxInline < 0) {
      if (i < line.length) segments.push({ type: 'text', value: line.slice(i) });
      break;
    }
    let useDollar = (idxDollar >= 0) && (idxInline < 0 || idxDollar <= idxInline);
    if (useDollar) {
      const isDisplay = line[idxDollar + 1] === '$';
      const delimLen  = isDisplay ? 2 : 1;
      const end = isDisplay
        ? line.indexOf('$$', idxDollar + 2)
        : line.indexOf('$', idxDollar + 1);
      if (end < 0) { segments.push({ type: 'text', value: line.slice(i) }); break; }
      if (idxDollar > i) segments.push({ type: 'text', value: line.slice(i, idxDollar) });
      segments.push({ type: 'math', latex: line.slice(idxDollar + delimLen, end), display: isDisplay });
      i = end + delimLen;
    } else {
      const end = line.indexOf('\\)', idxInline + 2);
      if (end < 0) { segments.push({ type: 'text', value: line.slice(i) }); break; }
      if (idxInline > i) segments.push({ type: 'text', value: line.slice(i, idxInline) });
      segments.push({ type: 'math', latex: line.slice(idxInline + 2, end), display: false });
      i = end + 2;
    }
  }
  return segments;
}

function parseTextWithMath(text) {
  return String(text || '').split('\n').map(parseMathSegments);
}

/* ---- 把 MathJax 输出正确转成可被 Image 加载的 SVG 字符串 ---- */
function mathJaxToSvgString(container, color) {
  if (!container) throw new Error('MathJax 返回为空');

  let svgNode = null;
  if (container.tagName && container.tagName.toLowerCase() === 'svg') {
    svgNode = container;
  } else if (container.querySelector) {
    svgNode = container.querySelector('svg');
  }
  if (!svgNode) throw new Error('未找到 <svg> 节点');

  let svgStr = svgNode.outerHTML;

  /* ★ 新增：在删除 style 前，先提取 vertical-align 里的 descent */
  let descentEx = 0;
  const styleM = svgStr.match(/style="([^"]*)"/i);
  if (styleM) {
    const vm = styleM[1].match(/vertical-align:\s*(-?[\d.]+)ex/i);
    if (vm) descentEx = -parseFloat(vm[1]);   // MathJax 常写 -X ex（负值代表下沉）
  }

  try {
    const globalDefs = document.querySelector('#MJX-SVG-global-cache defs');
    if (globalDefs && svgStr.includes('<use')) {
      svgStr = svgStr.replace(/(<svg[^>]*>)/, `$1${globalDefs.outerHTML}`);
    }
  } catch (e) {}

  svgStr = svgStr.replace(/currentColor/g, color || '#e6edf7');

  const vbMatch = svgStr.match(/viewBox="([^"]+)"/);
  let pxW = 100, pxH = 30;
  if (vbMatch) {
    const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
    const vbW = parts[2], vbH = parts[3];
    if (vbW > 0 && vbH > 0) {
      pxW = Math.max(1, Math.round(vbW / 1000 * __mathBaseFS));
      pxH = Math.max(1, Math.round(vbH / 1000 * __mathBaseFS));
    }
  }
  svgStr = svgStr
    .replace(/(<svg[^>]*?)\sstyle="[^"]*"/i, '$1')
    .replace(/(<svg[^>]*?)\swidth="[^"]*"/i, '$1')
    .replace(/(<svg[^>]*?)\sheight="[^"]*"/i, '$1')
    .replace(/<svg/i, `<svg width="${pxW}" height="${pxH}"`);

  if (!/xmlns=/i.test(svgStr)) {
    svgStr = svgStr.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return { svgStr, pxW, pxH, descentEx };     // ← 多返回一个 descentEx
}


function getMathImage(latex, display, color) {
  const key = (display ? 'D:' : 'I:') + latex + '|' + (color || '');
  const cached = __mathCache.get(key);
  if (cached) return cached;
  if (__mathFailed.has(key) || __mathPending.has(key)) return null;

  if (!isLatexLikelyComplete(latex)) return null;

  if (!isMathJaxReady()) {
    if (!__mathPending.has('__boot__')) {
      __mathPending.add('__boot__');
      const waitReady = (window.MathJax.startup && window.MathJax.startup.promise)
        ? window.MathJax.startup.promise : Promise.resolve();
      waitReady.then(() => {
        __mathPending.delete('__boot__');
        try { render(); drawPreview(); updateSelBarPosition(); } catch (e) {}
      }).catch(() => { __mathPending.delete('__boot__'); });
    }
    return null;
  }

  __mathPending.add(key);
  (async () => {
    try {
      const node = window.MathJax.tex2svg(latex, { display: !!display });

      /* ★ 修复：原来只解构 svgStr，导致下面的 descentEx 未定义 → ReferenceError */
      const { svgStr, pxW, pxH, descentEx } = mathJaxToSvgString(node, color);

      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url  = URL.createObjectURL(blob);

      const img = await new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => {
          im._descentEx = descentEx;
          res(im);
        };
        im.onerror = () => rej(new Error('SVG → Image 失败'));
        im.src = url;
      });

      URL.revokeObjectURL(url);
      __mathCache.set(key, img);
      /* ★ 新增：存一份原始 SVG，供编辑器预览复用 */
      __mathSvgCache.set(key, { svgStr, pxW, pxH, descentEx });

      __mathVersion++;
      scheduleRender();

      /* ★ 新增：通知当前打开的文字编辑器刷新预览 */
      if (typeof __activeEditorPreviewRefresh === 'function') {
        try { __activeEditorPreviewRefresh(); } catch (e) {}
      }

      try { render(); drawPreview(); updateSelBarPosition(); } catch (e) {}
    } catch (e) {
      console.warn('[math] 渲染失败：', latex, e);
      __mathFailed.add(key);
      if (typeof __activeEditorPreviewRefresh === 'function') {
        try { __activeEditorPreviewRefresh(); } catch (_) {}
      }
      try { render(); drawPreview(); } catch (_) {}
    } finally {
      __mathPending.delete(key);
    }
  })();

  return null;
}




function textFontString(o) {
  const fs = Math.max(6, o.fontSize || 32);
  const fam = getFontCss(o.fontFamily);
  return (o.italic ? 'italic ' : '') + (o.bold ? '700 ' : '400 ') + fs + 'px ' + fam;
}

function measureText(o) {
  const fs    = Math.max(6, o.fontSize || 32);
  const raw   = (o.text == null) ? '' : String(o.text);
  const color = o.color || '#e6edf7';

  const parsedLines = parseTextWithMath(raw);

  ctx.save();
  ctx.font = textFontString(o);

  /* ---- 兜底字形度量（用于空文本 / 字体不支持 actualBoundingBox 时） ---- */
  const FALLBACK_ASCENT  = fs * 0.82;
  const FALLBACK_DESCENT = fs * 0.22;
  /* ---- 行间额外留白：上下各分一半，既不贴身也不撑开 ---- */
  const LEADING = fs * 0.12;

  let maxW = 0, totalH = 0;
  let hasMath = false;
  const lineData = [];

  for (const segments of parsedLines) {
    let w = 0;
    const lineSegs = [];

    /* 本行内所有段相对 alphabetic baseline 的 ascent / descent 最大值 */
    let lineAscent  = 0;
    let lineDescent = 0;
    let hasContent  = false;

    for (const seg of segments) {
      /* ---------- 普通文字 ---------- */
      if (seg.type === 'text') {
        const text = seg.value || '';
        const m = ctx.measureText(text);
        const tw = m.width;

        /* actualBoundingBox* 在空字符串或部分旧浏览器上返回 0 / undefined */
        let asc = m.actualBoundingBoxAscent;
        let des = m.actualBoundingBoxDescent;
        if (!isFinite(asc) || asc <= 0) asc = FALLBACK_ASCENT;
        if (!isFinite(des) || des <= 0) des = FALLBACK_DESCENT;

        const hasGlyph = /\S/.test(text);
        if (hasGlyph) {
          hasContent = true;
          if (asc > lineAscent)  lineAscent  = asc;
          if (des > lineDescent) lineDescent = des;
        }

        lineSegs.push({
          type: 'text',
          value: text,
          width: tw,
          ascent: asc,
          descent: des,
          hasGlyph
        });
        w += tw;
        continue;
      }

      /* ---------- 公式段 ---------- */
      hasMath = true;
      const scale = fs / 16;
      const img   = getMathImage(seg.latex, seg.display, color);

      if (img && img.naturalWidth) {
        /* 已就绪：把图片按基线拆成 ascent / descent */
        const iw = img.naturalWidth  * scale;
        const ih = img.naturalHeight * scale;
        const descent =
          (typeof img._descentEx === 'number' && isFinite(img._descentEx))
            ? Math.max(0, img._descentEx * fs / 2)
            : ih * 0.22;
        const ascent = Math.max(0, ih - descent);

        lineSegs.push({
          type: 'math',
          img,
          width:   iw,
          height:  ih,
          ascent:  ascent,
          descent: descent
        });
        w += iw;
        hasContent = true;
        if (ascent  > lineAscent)  lineAscent  = ascent;
        if (descent > lineDescent) lineDescent = descent;
      }
      else {
        /* 未就绪占位符：保持原有估算逻辑，居中放置，不参与基线对齐 */
        const estW = Math.max(fs, seg.latex.length * fs * 0.55);
        const isIncomplete = !isLatexLikelyComplete(seg.latex);
        const pendingKey   = (seg.display ? 'D:' : 'I:') + seg.latex + '|' + color;
        const isFailed     = !isIncomplete && __mathFailed.has(pendingKey);

        lineSegs.push({
          type: 'math',
          width:      estW,
          height:     fs * 1.3,
          pending:    !isIncomplete && !isFailed,
          failed:     isFailed,
          incomplete: isIncomplete
          /* 无 ascent/descent → draw 时走"盒内居中"分支 */
        });
        w += estW;
        hasContent = true;
        /* 占位符用兜底行高参与布局，避免行高塌陷 */
        if (FALLBACK_ASCENT  > lineAscent)  lineAscent  = FALLBACK_ASCENT;
        if (FALLBACK_DESCENT > lineDescent) lineDescent = FALLBACK_DESCENT;
      }
    }

    /* ---- 本行最终高度 ---- */
    let lineHeight;
    if (hasContent) {
      lineHeight = lineAscent + lineDescent + LEADING;
      /* 把 LEADING 均分到上下，保证基线两侧对称，bbox 中心 = 视觉中心 */
      lineAscent  += LEADING / 2;
      lineDescent += LEADING / 2;
    } else {
      /* 空行：如 "a\n\nb" 里的中间行，给一个合理的默认高度 */
      lineAscent  = FALLBACK_ASCENT  + LEADING / 2;
      lineDescent = FALLBACK_DESCENT + LEADING / 2;
      lineHeight  = lineAscent + lineDescent;
    }

    lineData.push({
      segments:    lineSegs,
      width:       w,
      height:      lineHeight,
      ascent:      lineAscent,
      descent:     lineDescent
    });
    if (w > maxW) maxW = w;
    totalH += lineHeight;
  }

  o.tw            = maxW;
  o.th            = Math.max(1, totalH);
  o._lineData     = lineData;
  o._lineDataFs   = fs;
  o._lineDataColor= color;
  o._hasMath      = hasMath;

  ctx.restore();
}

function drawTextShape(c, o) {
  const fs    = Math.max(6, o.fontSize || 32);
  const align = o.textAlign || 'left';
  const color = o.color || '#e6edf7';

  /* ------------------------------------------------------------------
   * 1. 缓存失效判断（与旧版一致）
   * ------------------------------------------------------------------ */
  const needRemeasure =
    !o._lineData ||
    o._lineDataFs !== fs ||
    o._lineDataColor !== color ||
    (o._hasMath && o._mathVersion !== __mathVersion);

  if (needRemeasure) {
    measureText(o);
    o._mathVersion = __mathVersion;
  }

  const lineData = o._lineData || [];
  const maxW     = o.tw || 0;

  c.save();
  c.setLineDash([]);
  c.lineCap   = 'round';
  c.lineJoin  = 'round';
  c.font      = textFontString(o);
  c.textBaseline = 'alphabetic';   /* ← 关键改动：改用 alphabetic baseline */
  c.textAlign    = 'left';
  c.fillStyle    = color;
  c.strokeStyle  = color;

  /* ------------------------------------------------------------------
   * 2. 背景填充（逻辑不变，o.th 现在已是紧包围盒高度）
   * ------------------------------------------------------------------ */
  if (o.fill && o.fillColor) {
    const padX = fs * 0.2, padY = fs * 0.1;
    const a = (o.fillAlpha != null ? o.fillAlpha : 0.6);
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, a));
    c.fillStyle = o.fillColor;
    const bx = o.x - padX, by = o.y - padY;
    const bw = maxW + padX * 2, bh = o.th + padY * 2;
    const rx = Math.min(8, fs * 0.15);
    if (c.roundRect) {
      c.beginPath(); c.roundRect(bx, by, bw, bh, rx); c.fill();
    } else {
      c.fillRect(bx, by, bw, bh);
    }
    c.restore();
    c.fillStyle = color;
  }

  /* ------------------------------------------------------------------
   * 3. 逐行绘制
   *    - 文本 / 公式：都以 alphabetic baseline 对齐
   *    - 占位符：走盒内居中分支
   * ------------------------------------------------------------------ */
  let topY = o.y;
  for (const lineInfo of lineData) {
    /* 本行基线 = 行顶 + 本行 ascent */
    const baselineY = topY + lineInfo.ascent;

    /* 按对齐方式算本行起点 x */
    let x = o.x;
    if (align === 'center')      x = o.x + (maxW - lineInfo.width) / 2;
    else if (align === 'right')  x = o.x + (maxW - lineInfo.width);

    for (const seg of lineInfo.segments) {
      if (seg.type === 'text') {
        /* ---------- 3.1 普通文字 ---------- */
        if (seg.hasGlyph) {
          c.fillText(seg.value, x, baselineY);

          if (o.underline) {
            /* 下划线：基线下方 descent + 一点点视觉余量 */
            const des = (typeof seg.descent === 'number' && isFinite(seg.descent))
                        ? seg.descent : fs * 0.22;
            const uy = baselineY + des + fs * 0.06;
            c.lineWidth = Math.max(1, fs / 16);
            c.beginPath();
            c.moveTo(x, uy);
            c.lineTo(x + seg.width, uy);
            c.stroke();
          }
        }
        /* 纯空白段（如行首空格）：不绘制也不画下划线，宽度已在布局中占位 */
      }
      else if (seg.img) {
        /* ---------- 3.2 公式图片（按基线对齐） ----------
         * 基线 = 图片底边 - descent  →  dy = baselineY - (height - descent) */
        let dy;
        if (typeof seg.descent === 'number' && isFinite(seg.descent)) {
          dy = baselineY - (seg.height - seg.descent);
        } else {
          /* 兜底：盒内垂直居中 */
          dy = topY + (lineInfo.height - seg.height) / 2;
        }
        c.drawImage(seg.img, x, dy, seg.width, seg.height);
      }
      else {
        /* ---------- 3.3 公式占位符 ---------- */
        const boxFont = '400 ' + (fs * 0.7) + 'px ui-monospace,Menlo,Consolas,monospace';
        c.save();
        c.font = boxFont;
        c.textBaseline = 'alphabetic';

        /* 让占位符文字大致在盒内垂直居中：
         * baseline 位置 ≈ 盒顶 + 盒高/2 + 字高×0.35 */
        const boxBaseline = topY + lineInfo.height / 2 + fs * 0.7 * 0.35;

        if (seg.incomplete) {
          c.fillStyle = 'rgba(143,163,192,.5)';    // 灰色：还没输完
          c.fillText('…', x, boxBaseline);
        } else if (seg.failed) {
          c.fillStyle = 'rgba(248,113,113,.75)';   // 红色：渲染报错
          c.fillText('[公式错误]', x, boxBaseline);
        } else {
          c.fillStyle = 'rgba(125,211,252,.75)';   // 蓝色：异步中
          c.fillText('[…]', x, boxBaseline);
        }
        c.restore();
        c.font = textFontString(o);                // 恢复主字体
        c.textBaseline = 'alphabetic';
      }

      x += seg.width;
    }

    topY += lineInfo.height;
  }

  c.restore();
}
function getBBox(o) {
  let x1,y1,x2,y2;
  if (o.points && o.points.length) {
    x1=y1=Infinity; x2=y2=-Infinity;
    for (const p of o.points) {
      if (p.x<x1) x1=p.x; if (p.y<y1) y1=p.y;
      if (p.x>x2) x2=p.x; if (p.y>y2) y2=p.y;
    }
  } else if (isTextObj(o)) {
    if (o.tw == null || o.th == null) measureText(o);
    x1=o.x; y1=o.y; x2=o.x+(o.tw||0); y2=o.y+(o.th||0);
  } else {
    x1=Math.min(o.x1,o.x2); y1=Math.min(o.y1,o.y2);
    x2=Math.max(o.x1,o.x2); y2=Math.max(o.y1,o.y2);
  }
  return { x1, y1, x2, y2, w:x2-x1, h:y2-y1 };
}
function getWorldBBox(o) {
  const b = getBBox(o);
  const rot = o.rotation || 0;
  if (!rot) return { x1:b.x1, y1:b.y1, x2:b.x2, y2:b.y2 };
  const c = { x:(b.x1+b.x2)/2, y:(b.y1+b.y2)/2 };
  const pts = [{x:b.x1,y:b.y1},{x:b.x2,y:b.y1},{x:b.x2,y:b.y2},{x:b.x1,y:b.y2}]
    .map(p => rotatePt(p, c, rot));
  return {
    x1:Math.min(...pts.map(p=>p.x)), y1:Math.min(...pts.map(p=>p.y)),
    x2:Math.max(...pts.map(p=>p.x)), y2:Math.max(...pts.map(p=>p.y))
  };
}
function unionBBox(objs) {
  let x1=Infinity, y1=Infinity, x2=-Infinity, y2=-Infinity;
  for (const o of objs) {
    const b = getWorldBBox(o);
    if (b.x1<x1) x1=b.x1; if (b.y1<y1) y1=b.y1;
    if (b.x2>x2) x2=b.x2; if (b.y2>y2) y2=b.y2;
  }
  if (!isFinite(x1)) return { x1:0, y1:0, x2:0, y2:0 };
  return { x1, y1, x2, y2 };
}
function normRect(r) {
  const x1 = Math.min(r.x1, r.x2), y1 = Math.min(r.y1, r.y2);
  const x2 = Math.max(r.x1, r.x2), y2 = Math.max(r.y1, r.y2);
  return { x1, y1, x2, y2, w:x2-x1, h:y2-y1 };
}
const rectsIntersect = (a, b) => !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
function objCenter(o) {
  if (isTextObj(o)) return { x:o.x+(o.tw||0)/2, y:o.y+(o.th||0)/2 };
  const b = getBBox(o);
  return { x:(b.x1+b.x2)/2, y:(b.y1+b.y2)/2 };
}
function copyObj(o) {
  const t = Object.assign({}, o);
  if (o.points) t.points = o.points.map(p => ({x:p.x, y:p.y}));
  if (o._view) t._view = Object.assign({}, o._view);   // ★ 新增
  return t;
}
function cloneGeo(o) {
  const g = {};
  if (o.points) g.points = o.points.map(p => ({x:p.x,y:p.y}));
  if (o.x1 !== undefined) { g.x1=o.x1; g.y1=o.y1; g.x2=o.x2; g.y2=o.y2; }
  if (isTextObj(o)) {
    g.x=o.x; g.y=o.y; g.fontSize=o.fontSize; g.tw=o.tw; g.th=o.th;
    g.fontFamily=o.fontFamily; g.bold=o.bold; g.italic=o.italic;
    g.underline=o.underline; g.textAlign=o.textAlign;
  }
  return g;
}
function applyGeo(o, g) {
  if (g.points) o.points = g.points.map(p => ({x:p.x,y:p.y}));
  if (g.x1 !== undefined) { o.x1=g.x1; o.y1=g.y1; o.x2=g.x2; o.y2=g.y2; }
  if (g.x !== undefined) {
    o.x=g.x; o.y=g.y; o.fontSize=g.fontSize; o.tw=g.tw; o.th=g.th;
    if (g.fontFamily !== undefined) o.fontFamily=g.fontFamily;
    if (g.bold !== undefined) o.bold=g.bold;
    if (g.italic !== undefined) o.italic=g.italic;
    if (g.underline !== undefined) o.underline=g.underline;
    if (g.textAlign !== undefined) o.textAlign=g.textAlign;
  }
}
function translateObj(o, dx, dy) {
  if (o.points) o.points.forEach(p => { p.x+=dx; p.y+=dy; });
  if (o.x1 !== undefined) { o.x1+=dx; o.y1+=dy; o.x2+=dx; o.y2+=dy; }
  if (isTextObj(o)) { o.x+=dx; o.y+=dy; }
}
function scaleObj(o, anchor, sx, sy) {
  const f = p => ({ x:anchor.x+(p.x-anchor.x)*sx, y:anchor.y+(p.y-anchor.y)*sy });
  if (o.points) o.points = o.points.map(f);
  if (o.x1 !== undefined) {
    const a = f({x:o.x1,y:o.y1}), b = f({x:o.x2,y:o.y2});
    o.x1=a.x; o.y1=a.y; o.x2=b.x; o.y2=b.y;
  }
  if (isTextObj(o)) {
    const a = f({x:o.x,y:o.y});
    o.x=a.x; o.y=a.y;
    o.fontSize = Math.max(6, (o.fontSize||32)*Math.abs(sy));
    measureText(o);
  }
}
function arrowHead(c, x1, y1, x2, y2, size) {
  const ang = Math.atan2(y2-y1, x2-x1);
  const hl = Math.max(12, size*4);
  const sp = 0.42;
  c.beginPath();
  c.moveTo(x2,y2); c.lineTo(x2-hl*Math.cos(ang-sp), y2-hl*Math.sin(ang-sp));
  c.moveTo(x2,y2); c.lineTo(x2-hl*Math.cos(ang+sp), y2-hl*Math.sin(ang+sp));
  c.stroke();
}

const U = {
  alpha: function (color, a) {
    const cur = U._cur;
    let base = color, al = a;
    if (cur) {
      if (typeof cur.fillAlpha === 'number') al = cur.fillAlpha;
      if (cur.fillColor && (color === cur.color || color == null)) base = cur.fillColor;
    }
    return alphaColor(base, al);
  },
  bbox: getBBox,
  arrowHead: arrowHead,
  rad: d => d*Math.PI/180,
  _cur: null,
  _scale: 1          // ★ 新增
};
window.U_bbox = getBBox;

function installFreehandShape() {
  PB.shapes['__freehand'] = {
    key: '__freehand', cat: '__sys', geom: 'path', label: '画笔', hidden: true, icon: '',
  draw: function (c, o) {
    const pts = o.points;
    if (!pts || !pts.length) return;
    if (pts.length === 1) {
      c.beginPath();
      c.arc(pts[0].x, pts[0].y, Math.max(1, (o.size||3)/2), 0, Math.PI*2);
      c.fillStyle = o.color || '#e6edf7';
      c.fill();
      return;
    }
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i+1].x) / 2;
      const my = (pts[i].y + pts[i+1].y) / 2;
      c.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length-1];
    c.lineTo(last.x, last.y);
    c.stroke();
  }
};
}

function installImageShape() {
  PB.shapes['__image'] = {
    key: '__image', cat: '__sys', geom: 'rect', label: '图片', hidden: true, icon: '',
    draw: function (c, o) {
      const img = o._img;
      if (!img || !img.complete || !img.naturalWidth) {
        c.save();
        c.setLineDash([8, 6]);
        c.strokeStyle = 'rgba(120,180,255,.55)';
        c.lineWidth = 2;
        c.strokeRect(o.x1, o.y1, o.x2 - o.x1, o.y2 - o.y1);
        c.restore();
        return;
      }
      const x = Math.min(o.x1, o.x2);
      const y = Math.min(o.y1, o.y2);
      const w = Math.abs(o.x2 - o.x1);
      const h = Math.abs(o.y2 - o.y1);
      if (w < 1 || h < 1) return;
      c.save();
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = 'high';
      c.drawImage(img, x, y, w, h);
      c.restore();
    }
  };
}

/* ---- 视频图形 ---- */
function installVideoShape() {
  PB.shapes['__video'] = {
    key: '__video', cat: '__sys', geom: 'rect', label: '视频', hidden: true, icon: '',
    draw: function (c, o) {
      const v = o._videoEl;
      const x = Math.min(o.x1, o.x2);
      const y = Math.min(o.y1, o.y2);
      const w = Math.abs(o.x2 - o.x1);
      const h = Math.abs(o.y2 - o.y1);
      if (!v || v.readyState < 2 || w < 1 || h < 1) {
        c.save();
        c.setLineDash([8, 6]);
        c.strokeStyle = 'rgba(120,180,255,.55)';
        c.lineWidth = 2;
        c.strokeRect(o.x1, o.y1, o.x2 - o.x1, o.y2 - o.y1);
        c.fillStyle = 'rgba(143,163,192,.9)';
        c.font = '14px system-ui,-apple-system,sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(o._videoMissing ? '视频（请重新导入）' : '视频加载中…',
          (o.x1 + o.x2) / 2, (o.y1 + o.y2) / 2);
        c.restore();
        return;
      }
      c.save();
      try { c.drawImage(v, x, y, w, h); } catch (e) {}
      c.restore();
    }
  };
}

/* =====================================================================
 * 5. IndexedDB
 * ===================================================================== */
const IDB_NAME = 'physboard-fs', IDB_STORE = 'handles';
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => { const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, val) {
  try {
    const db = await idbOpen();
    await new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(val, key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch (e) {}
}
async function idbGet(key) {
  try {
    const db = await idbOpen();
    return await new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  } catch (e) { return null; }
}
/* =====================================================================
 * 6. 遮罩工具
 * ===================================================================== */
function ensureMask(o) {
  if (o._mask) return o._mask;
  const bb = getBBox(o);
  const pad = MASK_PAD;
  const w = Math.max(1, Math.ceil((bb.w + pad * 2) * MASK_SCALE));
  const h = Math.max(1, Math.ceil((bb.h + pad * 2) * MASK_SCALE));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  o._mask = cv;
  o._maskPad = pad;
  return cv;
}
function cloneCanvas(src) {
  const cv = document.createElement('canvas');
  cv.width = src.width; cv.height = src.height;
  cv.getContext('2d').drawImage(src, 0, 0);
  return cv;
}
function thresholdMask(mask) {
  try {
    const mctx = mask.getContext('2d');
    const w = mask.width, h = mask.height;
    const img = mctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) {
      d[i] = d[i] >= 128 ? 255 : 0;
    }
    mctx.putImageData(img, 0, 0);
  } catch (e) {}
}
function getMaskMapping(o) {
  const bb = getBBox(o);
  const pad = o._maskPad || MASK_PAD;
  const mask = o._mask;
  const worldX1 = bb.x1 - pad;
  const worldY1 = bb.y1 - pad;
  const worldW = bb.w + pad * 2;
  const worldH = bb.h + pad * 2;
  return {
    worldX1, worldY1, worldW, worldH,
    scX: mask.width / worldW,
    scY: mask.height / worldH
  };
}
function applyEraseToObj(o, worldPt, radius) {
  if (!o._mask) return;
  const ctr = objCenter(o);
  const rot = o.rotation || 0;
  const lp = rotatePt(worldPt, ctr, -rot);
  const mask = o._mask;
  const mctx = mask.getContext('2d');
  const m = getMaskMapping(o);

  const mx = (lp.x - m.worldX1) * m.scX;
  const my = (lp.y - m.worldY1) * m.scY;
  const mrx = radius * m.scX;
  const mry = radius * m.scY;

  if (mx + mrx < 0 || my + mry < 0 || mx - mrx > mask.width || my - mry > mask.height) return;

  mctx.save();
  mctx.fillStyle = '#fff';
  mctx.beginPath();
  if (Math.abs(mrx - mry) < 0.5) {
    mctx.arc(mx, my, mrx, 0, Math.PI * 2);
  } else {
    mctx.ellipse(mx, my, mrx, mry, 0, 0, Math.PI * 2);
  }
  mctx.fill();
  mctx.restore();
}
function remapMask(o, oldBB, anchor, sx, sy) {
  if (!o._mask) return;
  if (!(sx > 0) || !(sy > 0)) return;
  const maskPad = o._maskPad || MASK_PAD;
  const oldMask = o._mask;

  const oldWorldX1 = oldBB.x1 - maskPad;
  const oldWorldY1 = oldBB.y1 - maskPad;
  const oldWorldW = oldBB.w + maskPad * 2;
  const oldWorldH = oldBB.h + maskPad * 2;

  const newBB = getBBox(o);
  const newWorldX1 = newBB.x1 - maskPad;
  const newWorldY1 = newBB.y1 - maskPad;
  const newWorldW = newBB.w + maskPad * 2;
  const newWorldH = newBB.h + maskPad * 2;

  const newMaskW = Math.max(1, Math.round(oldMask.width * (newWorldW / oldWorldW)));
  const newMaskH = Math.max(1, Math.round(oldMask.height * (newWorldH / oldWorldH)));

  const newMask = document.createElement('canvas');
  newMask.width = newMaskW;
  newMask.height = newMaskH;
  const nctx = newMask.getContext('2d');

  const kx = newWorldW / newMaskW;
  const ky = newWorldH / newMaskH;

  const a_x = (kx / sx / oldWorldW) * oldMask.width;
  const b_x = ((anchor.x - oldWorldX1) + (newWorldX1 - anchor.x) / sx) / oldWorldW * oldMask.width;
  const a_y = (ky / sy / oldWorldH) * oldMask.height;
  const b_y = ((anchor.y - oldWorldY1) + (newWorldY1 - anchor.y) / sy) / oldWorldH * oldMask.height;

  if (!isFinite(a_x) || !isFinite(a_y) || a_x === 0 || a_y === 0) return;

  const inv_a_x = 1 / a_x, inv_b_x = -b_x / a_x;
  const inv_a_y = 1 / a_y, inv_b_y = -b_y / a_y;

  try {
    nctx.setTransform(inv_a_x, 0, 0, inv_a_y, inv_b_x, inv_b_y);
    nctx.drawImage(oldMask, 0, 0);
  } catch (e) {
    return;
  }
  o._mask = newMask;
}
function findObjectsAt(worldPt, radius) {
  const result = [];
  for (const o of objects) if (hitTestErase(o, worldPt, radius)) result.push(o);
  return result;
}
function hitTestErase(o, pt, radius) {
  if (o.type === '__video') return false;
  const ctr = objCenter(o);
  const rot = o.rotation || 0;
  const lp = rotatePt(pt, ctr, -rot);
  const pad = (o.size || 4) * 0.7 + radius;
  const def = PB.shapes[o.type];
  if (o.points) {
    if (o.points.length === 1) return Math.hypot(lp.x - o.points[0].x, lp.y - o.points[0].y) < pad;
    const step = Math.max(1, Math.floor(o.points.length / 200));
    for (let i = step; i < o.points.length; i += step) {
      if (distToSeg(lp, o.points[i-step], o.points[i]) < pad) return true;
    }
    return false;
  }
  if (def && def.geom === 'line') return distToSeg(lp, {x:o.x1,y:o.y1}, {x:o.x2,y:o.y2}) < pad;
  const b = getBBox(o);
  return lp.x >= b.x1 - pad && lp.x <= b.x2 + pad &&
         lp.y >= b.y1 - pad && lp.y <= b.y2 + pad;
}
function getEraserRadius(e) {
  let base = 22;
  if (e && (e.pointerType === 'touch' || e.pointerType === 'pen')) {
    const w = e.width || 0;
    if (w > 1) {
      base = Math.max(14, Math.min(90, w * 0.75));
    } else {
      base = 26;
    }
    if (e.pressure && e.pressure > 0.01 && e.pressure < 1) {
      base *= (0.6 + e.pressure * 0.8);
    }
  }
  return (base * eraserSizeMul) / view.scale;
}

/* =====================================================================
 * 7. 画布尺寸
 * ===================================================================== */
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  [board, preview].forEach(cv => {
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  });
  render(); drawPreview(); updateSelBarPosition();
  if (typeof positionTextEditor === 'function') positionTextEditor();
}
window.addEventListener('resize', resize);

/* =====================================================================
 * 8. 渲染
 * ===================================================================== */
function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);



  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.scale, view.scale);
  drawGrid();
  const w0 = screenToWorld(0, 0);
  const w1 = screenToWorld(W, H);
  const pad = 60;
  const viewBB = { x1: w0.x - pad, y1: w0.y - pad, x2: w1.x + pad, y2: w1.y + pad };

  for (const o of objects) {
    const b = getWorldBBox(o);
    if (rectsIntersect(b, viewBB)) drawObject(ctx, o);
  }
  ctx.restore();
}

function drawGrid() {
  // 透明背景时不画网格
  const preset = BG_PRESETS.find(p => p.id === state.bg);
  if (preset && preset.id === 'transparent') return;
  let step = 52;
  while (step * view.scale < 22) step *= 2;
  while (step * view.scale > 240) step /= 2;

  const w0 = screenToWorld(0, 0);
  const w1 = screenToWorld(W, H);
  const x0 = Math.floor(w0.x / step) * step;
  const y0 = Math.floor(w0.y / step) * step;

  ctx.save();
  ctx.strokeStyle = 'rgba(120,180,255,.05)';
  ctx.lineWidth = 1 / view.scale;
  ctx.beginPath();
  for (let x = x0; x <= w1.x; x += step) {
    ctx.moveTo(x, w0.y);
    ctx.lineTo(x, w1.y);
  }
  for (let y = y0; y <= w1.y; y += step) {
    ctx.moveTo(w0.x, y);
    ctx.lineTo(w1.x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPreview() {
  pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pctx.clearRect(0, 0, W, H);

  pctx.save();
  pctx.translate(view.offsetX, view.offsetY);
  pctx.scale(view.scale, view.scale);
  if (current) {
    drawObject(pctx, current);
    drawAngleHint(pctx, current);
  }
  drawSelectionOverlay();
  drawSnapIndicator();
  pctx.restore();

  drawEraserCursor();
}

function drawObjectRaw(c, o) {
  const def = PB.shapes[o.type];
  if (!def || !def.draw) return;
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  const lw = o.size || 4;
  c.lineWidth = lw;
  if (o.dash === 'dashed') c.setLineDash([lw * 2.6, lw * 2.2]);
  else if (o.dash === 'center') c.setLineDash([lw * 6, lw * 2.6, lw * 1, lw * 2.6]);
  else c.setLineDash([]);
  c.strokeStyle = (o.hasBorder === false) ? 'rgba(0,0,0,0)' : (o.color || '#e6edf7');
  c.fillStyle = o.color || '#e6edf7';   
  const prev = U._cur;
U._cur = o;
U._scale = view.scale;           // ★ 新增
o._viewScale = view.scale;       // ★ 新增（供 onPan 使用）

  const prevT = animState.t, prevP = animState.playing, prevS = animState.speed;
  if (def.animatable) {
    ensureAnimFields(o);
    animState.t = o.animT;
    animState.playing = o.animPlaying;
    animState.speed = o.animSpeed;
  }
  try { def.draw(c, o, U); }
  finally {
    U._cur = prev;
    animState.t = prevT; animState.playing = prevP; animState.speed = prevS;
  }
  c.restore();
}
let _tmpCanvas = null;
function getTmpCanvas(w, h) {
  if (!_tmpCanvas) _tmpCanvas = document.createElement('canvas');
  if (_tmpCanvas.width !== w) _tmpCanvas.width = w;
  if (_tmpCanvas.height !== h) _tmpCanvas.height = h;
  return _tmpCanvas;
}
function drawObject(c, o) {
  const def = PB.shapes[o.type];
  if (!def || !def.draw) return;
  if (!o._mask) {
    c.save();
    if (o.rotation) {
      const ctr = objCenter(o);
      c.translate(ctr.x, ctr.y); c.rotate(o.rotation); c.translate(-ctr.x, -ctr.y);
    }
    drawObjectRaw(c, o);
    c.restore();
    return;
  }
  const bb = getBBox(o);
  const maskPad = o._maskPad || MASK_PAD;
  const lx = bb.x1 - maskPad;
  const ly = bb.y1 - maskPad;
  const lw = bb.w + maskPad * 2;
  const lh = bb.h + maskPad * 2;

  const m = c.getTransform ? c.getTransform() : null;
  const rs = Math.min(4, Math.max(1, m ? Math.abs(m.a) : dpr));

  const cw = Math.max(1, Math.ceil(lw * rs));
  const ch = Math.max(1, Math.ceil(lh * rs));
  const tmp = getTmpCanvas(cw, ch);
  const tctx = tmp.getContext('2d');
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  tctx.clearRect(0, 0, cw, ch);
  tctx.setTransform(rs, 0, 0, rs, 0, 0);
  tctx.translate(-lx, -ly);
  drawObjectRaw(tctx, o);
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  tctx.globalCompositeOperation = 'destination-out';
  tctx.imageSmoothingEnabled = true;
  try { tctx.drawImage(o._mask, 0, 0, cw, ch); } catch (err) {}
  tctx.globalCompositeOperation = 'source-over';
  c.save();
  if (o.rotation) {
    const ctr = objCenter(o);
    c.translate(ctr.x, ctr.y); c.rotate(o.rotation); c.translate(-ctr.x, -ctr.y);
  }
  c.drawImage(tmp, 0, 0, cw, ch, lx, ly, lw, lh);
  c.restore();
}
function drawEraserCursor() {
  if (state.tool !== 'eraser') return;
  if (!lastHoverPt) return;
  const sp = worldToScreen(lastHoverPt.x, lastHoverPt.y);
  const r = lastEraserRadius * view.scale;
  pctx.save();
  pctx.strokeStyle = 'rgba(248,113,113,.85)';
  pctx.fillStyle = 'rgba(248,113,113,.12)';
  pctx.lineWidth = 2;
  pctx.beginPath();
  pctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
  pctx.fill();
  pctx.stroke();
  pctx.restore();
}

function drawAngleHint(c, o) {
  if (!o) return;
  if (o.points) return;
  if (o.x1 === undefined || o.x2 === undefined) return;

  const def = PB.shapes[o.type];
  const isLineShape = !!(def && def.geom === 'line');
  const isRightTri  = (o.type === 'rightTriangle');
  if (!isLineShape && !isRightTri) return;

  const dx = o.x2 - o.x1;
  const dy = o.y2 - o.y1;
  const len = Math.hypot(dx, dy);
  if (len < 14) return;
  let angDeg;
  let isSpecial = false;

  if (isRightTri) {
    angDeg = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
    const TRI_SPECIAL = [30, 37, 45, 53, 60];
    for (let i = 0; i < TRI_SPECIAL.length; i++) {
      if (Math.abs(angDeg - TRI_SPECIAL[i]) < 1.2) { isSpecial = true; break; }
    }
  } else {
    angDeg = Math.atan2(-dy, dx) * 180 / Math.PI;
    if (angDeg < 0) angDeg += 360;
    if (angDeg >= 360) angDeg -= 360;
    const SPECIAL = LINE_SNAP_ANGLES;
    for (let i = 0; i < SPECIAL.length; i++) {
      const a = SPECIAL[i];
      if (Math.abs(angDeg - a) < 1.2) { isSpecial = true; break; }
      if (Math.abs(angDeg - (360 - a)) < 1.2) { isSpecial = true; break; }
    }
  }

  const k = 1 / view.scale;

  const mx = (o.x1 + o.x2) / 2;
  const my = (o.y1 + o.y2) / 2;
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  const offset = 26 * k;

  let tx = mx + nx * offset;
  let ty = my + ny * offset;

  const text = angDeg.toFixed(1) + '°';
  c.save();
  c.font = '600 ' + (15 * k) + 'px ui-monospace,Menlo,Consolas,monospace';
  const tw = c.measureText(text).width;
  const padX = 10 * k, padY = 6 * k;
  const bw = tw + padX * 2;
  const bh = 15 * k + padY * 2;

  const vw0 = screenToWorld(0, 0);
  const vw1 = screenToWorld(W, H);
  const margin = 8 * k;
  if (tx - bw / 2 < vw0.x + margin) tx = vw0.x + margin + bw / 2;
  if (tx + bw / 2 > vw1.x - margin) tx = vw1.x - margin - bw / 2;
  if (ty - bh / 2 < vw0.y + margin) ty = vw0.y + margin + bh / 2;
  if (ty + bh / 2 > vw1.y - margin) ty = vw1.y - margin - bh / 2;

  const rx = tx - bw / 2, ry = ty - bh / 2;
  const r = 8 * k;
  c.beginPath();
  c.moveTo(rx + r, ry);
  c.lineTo(rx + bw - r, ry);
  c.quadraticCurveTo(rx + bw, ry, rx + bw, ry + r);
  c.lineTo(rx + bw, ry + bh - r);
  c.quadraticCurveTo(rx + bw, ry + bh, rx + bw - r, ry + bh);
  c.lineTo(rx + r, ry + bh);
  c.quadraticCurveTo(rx, ry + bh, rx, ry + bh - r);
  c.lineTo(rx, ry + r);
  c.quadraticCurveTo(rx, ry, rx + r, ry);
  c.closePath();

  if (isSpecial) {
    c.fillStyle = 'rgba(56,189,248,.95)';
    c.strokeStyle = 'rgba(186,230,253,1)';
    c.shadowColor = 'rgba(56,189,248,.85)';
    c.shadowBlur = 14 * k;
  } else {
    c.fillStyle = 'rgba(16,26,44,.92)';
    c.strokeStyle = 'rgba(56,189,248,.55)';
    c.shadowColor = 'rgba(56,189,248,.35)';
    c.shadowBlur = 8 * k;
  }
  c.lineWidth = 1.6 * k;
  c.fill();
  c.stroke();
  c.shadowBlur = 0;

  c.fillStyle = isSpecial ? '#ffffff' : '#7dd3fc';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, tx, ty + 1 * k);
  c.restore();
}

/* =====================================================================
 * 9. 命中检测
 * ===================================================================== */
function hitTest(o, pt) {
  const ctr = objCenter(o);
  const rot = o.rotation || 0;
  const lp = rotatePt(pt, ctr, -rot);
  const k = 1 / view.scale;
  const pad = Math.max(7, (o.size || 4) * 0.7) * k;
  const def = PB.shapes[o.type];
  if (o.points) {
    if (o.points.length === 1) return Math.hypot(lp.x - o.points[0].x, lp.y - o.points[0].y) < pad + 7 * k;
    const step = Math.max(1, Math.floor(o.points.length / 200));
    for (let i = step; i < o.points.length; i += step) {
      if (distToSeg(lp, o.points[i-step], o.points[i]) < pad + 7 * k) return true;
    }
    return false;
  }
  if (def && def.geom === 'line') return distToSeg(lp, {x:o.x1,y:o.y1}, {x:o.x2,y:o.y2}) < pad + 7 * k;
  const b = getBBox(o);
  return lp.x >= b.x1 - pad && lp.x <= b.x2 + pad &&
         lp.y >= b.y1 - pad && lp.y <= b.y2 + pad;
}

/* ---- 多边形框选（闭合曲线套索）判定 ---- */

function pointInPolygon(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    if (((yi > pt.y) !== (yj > pt.y)) &&
        (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function segIntersect(a, b, c, d) {
  function ccw(p1, p2, p3) {
    return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
  }
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

function polygonIntersectsObject(poly, o) {
  if (!poly || poly.length < 3) return false;
  const def = PB.shapes[o.type];
  const ctr = objCenter(o);
  const rot = o.rotation || 0;

  /* ---- 1. 收集图形的采样点与边 ---- */
  const samplePts = [];
  const edges = [];

  if (o.points && o.points.length) {
    /* 折线 / 自由绘制：按比例抽样，避免点太多拖慢 */
    const arr = o.points;
    const step = Math.max(1, Math.ceil(arr.length / 120));
    for (let i = 0; i < arr.length; i += step) {
      samplePts.push(rotatePt(arr[i], ctr, rot));
    }
    const lastW = rotatePt(arr[arr.length - 1], ctr, rot);
    samplePts.push(lastW);
    for (let i = 1; i < samplePts.length; i++) {
      edges.push([samplePts[i - 1], samplePts[i]]);
    }
  } else {
    /* 盒子类（矩形 / 线段 / 文字 / 图片 / 视频 / 自定义组合） */
    if (isTextObj(o) && (o.tw == null || o.th == null)) {
      try { measureText(o); } catch (e) {}
    }
    const b = getBBox(o);
    const corners = [
      { x: b.x1, y: b.y1 }, { x: b.x2, y: b.y1 },
      { x: b.x2, y: b.y2 }, { x: b.x1, y: b.y2 }
    ].map(p => rotatePt(p, ctr, rot));
    samplePts.push(...corners);
    for (let i = 0; i < 4; i++) {
      edges.push([corners[i], corners[(i + 1) % 4]]);
    }
  }

  /* ---- 2. 图形采样点在多边形内 → 相交 ---- */
  for (const p of samplePts) {
    if (pointInPolygon(p, poly)) return true;
  }

  /* ---- 3. 多边形顶点在图形 bbox 内 → 相交（盒子类） ---- */
  const isPathLike = (o.points && o.points.length) || (def && def.geom === 'line');
  if (!isPathLike) {
    const obb = getWorldBBox(o);
    for (const v of poly) {
      if (v.x >= obb.x1 && v.x <= obb.x2 &&
          v.y >= obb.y1 && v.y <= obb.y2) return true;
    }
  }

  /* ---- 4. 多边形边与图形边相交 → 相交 ---- */
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    for (const e of edges) {
      if (segIntersect(a, b, e[0], e[1])) return true;
    }
  }
  return false;
}



function getHandles(o) {
  const b = getBBox(o);
  const cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
  const rot = o.rotation || 0;
  const ctr = { x:cx, y:cy };
  const local = [
    { id:'nw', x:b.x1, y:b.y1 }, { id:'n', x:cx, y:b.y1 }, { id:'ne', x:b.x2, y:b.y1 },
    { id:'e',  x:b.x2, y:cy   }, { id:'se', x:b.x2, y:b.y2 }, { id:'s', x:cx, y:b.y2 },
    { id:'sw', x:b.x1, y:b.y2 }, { id:'w', x:b.x1, y:cy }
  ];
  const out = local.map(p => {
    const w = rotatePt(p, ctr, rot);
    return { id:p.id, x:w.x, y:w.y };
  });
  const k = 1 / view.scale;
  const rp = rotatePt({ x:cx, y:b.y1 - 36 * k }, ctr, rot);
  out.push({ id:'rotate', x:rp.x, y:rp.y });
  return out;
}
function hitHandle(o, pt) {
  const k = 1 / view.scale;
  for (const h of getHandles(o)) {
    const r = (h.id === 'rotate' ? 16 : 11) * k;
    if (Math.hypot(h.x - pt.x, h.y - pt.y) < r) return h;
  }
  return null;
}
function getVertices(o) {
  if (o.points) return o.points.map(p => ({x:p.x, y:p.y}));
  const def = PB.shapes[o.type];
  if (def && def.geom === 'line') return [{x:o.x1, y:o.y1}, {x:o.x2, y:o.y2}];
  return null;
}
function hitVertex(o, pt) {
  const verts = getVertices(o);
  if (!verts) return null;
  const ctr = objCenter(o);
  const rot = o.rotation || 0;
  const k = 1 / view.scale;
  for (let i = 0; i < verts.length; i++) {
    const wp = rotatePt(verts[i], ctr, rot);
    if (Math.hypot(wp.x - pt.x, wp.y - pt.y) < 11 * k) return i;
  }
  return null;
}

/* =====================================================================
 * 10. 选区绘制
 * ===================================================================== */
function drawSelectionOverlay() {
  const k = 1 / view.scale;

  if (marquee && marquee.points && marquee.points.length >= 2) {
    const pts = marquee.points;
    pctx.save();
    pctx.fillStyle = 'rgba(56,189,248,.10)';
    pctx.strokeStyle = 'rgba(56,189,248,.85)';
    pctx.lineWidth = 1.2 * k;
    pctx.setLineDash([5 * k, 4 * k]);
    pctx.lineJoin = 'round';
    pctx.lineCap = 'round';
    pctx.beginPath();
    pctx.moveTo(pts[0].x, pts[0].y);
    /* 二次贝塞尔平滑，视觉上像手绘的闭合曲线 */
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      pctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    pctx.lineTo(last.x, last.y);
    pctx.closePath();
    pctx.fill();
    pctx.stroke();
    pctx.restore();
  }
  if (!selection.length) return;
  if (selection.length > 1) {
    pctx.save();
    pctx.lineWidth = 1.1 * k; pctx.setLineDash([4 * k, 3 * k]);
    pctx.strokeStyle = 'rgba(56,189,248,.55)';
    for (const o of selection) {
      const b = getWorldBBox(o);
      pctx.strokeRect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1);
    }
    pctx.restore();
    const bb = unionBBox(selection);
    pctx.save();
    pctx.lineWidth = 1.6 * k; pctx.setLineDash([7 * k, 4 * k]);
    pctx.strokeStyle = '#38bdf8';
    pctx.shadowColor = 'rgba(56,189,248,.6)'; pctx.shadowBlur = 8 * k;
    pctx.strokeRect(bb.x1, bb.y1, bb.x2 - bb.x1, bb.y2 - bb.y1);
    pctx.restore();
    return;
  }
  const o = selection[0];
  const b = getBBox(o);
  const cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
  const rot = o.rotation || 0;
  const ctr = { x:cx, y:cy };
  const corners = [
    {x:b.x1,y:b.y1},{x:b.x2,y:b.y1},{x:b.x2,y:b.y2},{x:b.x1,y:b.y2}
  ].map(p => rotatePt(p, ctr, rot));
  pctx.save();
  pctx.lineCap = 'round'; pctx.strokeStyle = '#38bdf8';
  pctx.lineWidth = 1.4 * k; pctx.setLineDash([6 * k, 4 * k]);
  pctx.shadowColor = 'rgba(56,189,248,.55)'; pctx.shadowBlur = 6 * k;
  pctx.beginPath();
  corners.forEach((p, i) => i ? pctx.lineTo(p.x, p.y) : pctx.moveTo(p.x, p.y));
  pctx.closePath(); pctx.stroke();
  pctx.setLineDash([]); pctx.shadowBlur = 0;
  const verts = getVertices(o);
  if (verts) {
    pctx.fillStyle = '#0a1428'; pctx.strokeStyle = '#38bdf8'; pctx.lineWidth = 1.6 * k;
    for (const v of verts) {
      const wp = rotatePt(v, ctr, rot);
      pctx.beginPath(); pctx.arc(wp.x, wp.y, 4.5 * k, 0, Math.PI * 2); pctx.fill(); pctx.stroke();
    }
  }
  for (const h of getHandles(o)) {
    if (h.id === 'rotate') {
      const topMid = rotatePt({ x:cx, y:b.y1 }, ctr, rot);
      pctx.strokeStyle = '#38bdf8'; pctx.lineWidth = 1.4 * k;
      pctx.beginPath(); pctx.moveTo(topMid.x, topMid.y); pctx.lineTo(h.x, h.y); pctx.stroke();
      pctx.beginPath(); pctx.arc(h.x, h.y, 7 * k, 0, Math.PI * 2);
      pctx.fillStyle = '#0a1428'; pctx.fill(); pctx.stroke();
      pctx.beginPath(); pctx.arc(h.x, h.y, 3.6 * k, -Math.PI * 0.85, Math.PI * 0.4); pctx.stroke();
    } else {
      pctx.beginPath(); pctx.rect(h.x - 5 * k, h.y - 5 * k, 10 * k, 10 * k);
      pctx.fillStyle = '#0a1428'; pctx.fill();
      pctx.strokeStyle = '#38bdf8'; pctx.lineWidth = 1.6 * k; pctx.stroke();
    }
  }
  pctx.restore();
}

/* =====================================================================
 * 11. 动画系统
 * ===================================================================== */
const animState = { t: 0, playing: false, speed: 1 };
PB.animState = animState;
let animRaf = null, lastTs = 0;
function isAnimDef(def) { return !!(def && def.animatable); }
function isAnimObj(o) { return !!(o && isAnimDef(PB.shapes[o.type])); }
function ensureAnimFields(o) {
  if (typeof o.animT !== 'number') o.animT = 0;
  if (typeof o.animSpeed !== 'number') o.animSpeed = 1;
  if (typeof o.animPlaying !== 'boolean') o.animPlaying = false;
}
function anyVideoPlaying() {
  for (const o of objects) if (o.type === '__video' && o.playing) return true;
  return false;
}
function anyAnimPlaying() {
  for (const o of objects) {
    if (isAnimObj(o) && o.animPlaying) return true;
    if (o.type === '__video' && o.playing) return true;
  }
  return false;
}
function registerAnimParams() {
  if (!PB.paramDefs) PB.paramDefs = {};
  const defs = {
    animPeriod:{ label:'周期', min:0.5, max:10, step:0.1, def:2.0, unit:'s' },
    animSwing: { label:'摆角', min:5, max:90, step:1, def:45, unit:'°' },
    animAmp:   { label:'振幅', min:4, max:200, step:1, def:30 },
    animPhase: { label:'相位', min:0, max:360, step:1, def:0, unit:'°' },
    animAngle: { label:'抛射角', min:10, max:80, step:1, def:45, unit:'°' }
  };
  for (const k in defs) if (!PB.paramDefs[k]) PB.paramDefs[k] = defs[k];
}
function registerTextParams() {
  if (!PB.paramDefs) PB.paramDefs = {};
  if (!PB.paramDefs.fontFamily) {
    PB.paramDefs.fontFamily = {
      label:'字体', type:'select', def:'system',
      options: TEXT_FONTS.map(f => ({ value:f.id, label:f.label, css:f.css }))
    };
  }
  if (!PB.paramDefs.fontSize) {
    PB.paramDefs.fontSize = { label:'字号', type:'range', min:8, max:200, step:1, def:32 };
  }
  if (!PB.paramDefs.bold)      PB.paramDefs.bold      = { label:'加粗',   type:'toggle', def:false };
  if (!PB.paramDefs.italic)    PB.paramDefs.italic    = { label:'斜体',   type:'toggle', def:false };
  if (!PB.paramDefs.underline) PB.paramDefs.underline = { label:'下划线', type:'toggle', def:false };
  if (!PB.paramDefs.textAlign) {
    PB.paramDefs.textAlign = {
      label:'对齐', type:'select', def:'left',
      options: [
        { value:'left',   label:'左对齐' },
        { value:'center', label:'居中' },
        { value:'right',  label:'右对齐' }
      ]
    };
  }
}
function ensureTextShapes() {
  let found = false;
  for (const k in PB.shapes) {
    const s = PB.shapes[k];
    if (!s) continue;
    if (s.geom === 'text' || s.key === 'text') {
      s.geom = 'text';
      s.draw = drawTextShape;
      s.params = TEXT_PARAMS.slice();
      found = true;
    }
  }
  return found;
}

function animTick(ts) {
  if (!anyAnimPlaying()) {
    animRaf = null; lastTs = 0; updatePlayButtons(); return;
  }
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;
  let needRender = false;
  for (const o of objects) {
    if (isAnimObj(o) && o.animPlaying) {
      o.animT = (o.animT || 0) + dt * (o.animSpeed || 1);
      needRender = true;
    }
    if (o.type === '__video' && o.playing) {
      const v = o._videoEl;
      if (v) {
        if (o.trimEnd && v.currentTime >= o.trimEnd) {
          v.pause();
          o.playing = false;
          updateSelBar();
        } else {
          needRender = true;
        }
      }
    }
  }
  if (needRender) render();
  updatePlayButtons();
  animRaf = requestAnimationFrame(animTick);
}
function startAnimLoop() { if (animRaf != null) return; lastTs = 0; animRaf = requestAnimationFrame(animTick); }
function stopAnimLoop() { if (animRaf != null) { cancelAnimationFrame(animRaf); animRaf = null; } lastTs = 0; }
function playAnimAll() {
  const anims = objects.filter(isAnimObj);
  const vids = objects.filter(o => o.type === '__video');
  if (!anims.length && !vids.length) { toast('画布上还没有动画图形或视频'); return; }
  for (const o of anims) { ensureAnimFields(o); o.animPlaying = true; }
  for (const o of vids) {
    if (o._videoEl) {
      o._videoEl.currentTime = o.trimStart || 0;
      try { o._videoEl.play(); } catch (e) {}
      o.playing = true;
    }
  }
  updatePlayButtons(); startAnimLoop(); render();
}
function pauseAnimAll() {
  let any = false;
  for (const o of objects) {
    if (isAnimObj(o) && o.animPlaying) { o.animPlaying = false; any = true; }
    if (o.type === '__video' && o.playing) {
      if (o._videoEl) try { o._videoEl.pause(); } catch (e) {}
      o.playing = false; any = true;
    }
  }
  updatePlayButtons(); stopAnimLoop(); render();
  if (!any) toast('当前没有正在播放的动画');
}
function togglePlayAll() { if (anyAnimPlaying()) pauseAnimAll(); else playAnimAll(); }
function resetAnimAll() {
  animState.t = 0;
  for (const o of objects) {
    if (isAnimObj(o)) o.animT = 0;
    if (o.type === '__video') {
      if (o._videoEl) try { o._videoEl.currentTime = o.trimStart || 0; } catch (e) {}
      o.playing = false;
    }
  }
  render(); toast('动画时间已归零');
}
function toggleObjAnim(o) {
  ensureAnimFields(o);
  o.animPlaying = !o.animPlaying;
  if (o.animPlaying) startAnimLoop(); else if (!anyAnimPlaying()) stopAnimLoop();
  updatePlayButtons(); updateSelBar(); render();
}
function resetObjAnim(o) { ensureAnimFields(o); o.animT = 0; render(); }
function updatePlayButtons() {
  const playing = anyAnimPlaying();
  playAllBtn.style.display = playing ? 'none' : '';
  pauseAllBtn.style.display = playing ? '' : 'none';
}

/* =====================================================================
 * 12. 历史记录
 * ===================================================================== */
const MAX_SNAPSHOTS = 30;
function pushSnapshot() {
  snapshots = snapshots.slice(0, snapIndex + 1);
  snapshots.push({ pages: pages.map(pg => pg.map(copyObj)), pageIndex });
  snapIndex = snapshots.length - 1;
  if (snapshots.length > MAX_SNAPSHOTS) { snapshots.shift(); snapIndex--; }
  updateHistoryButtons();
}
function restoreSnapshot(s) {
  pages = s.pages.map(pg => pg.map(o => {
    const t = copyObj(o);
    if (o._mask) t._mask = cloneCanvas(o._mask);
    if (o._img) t._img = o._img;
    if (o._videoEl) { t._videoEl = o._videoEl; t._blobUrl = o._blobUrl; }
    if (o._origImg) t._origImg = o._origImg;
    return t;
  }));
  pageIndex = Math.min(s.pageIndex, pages.length - 1);
  objects = pages[pageIndex];
  selection = [];
  updateSelBar(); updatePageUI(); render(); drawPreview(); updateHistoryButtons();
}
function undo() { if (snapIndex <= 0) return; snapIndex--; restoreSnapshot(snapshots[snapIndex]); toast('已撤销'); }
function redo() { if (snapIndex >= snapshots.length - 1) return; snapIndex++; restoreSnapshot(snapshots[snapIndex]); toast('已重做'); }
function updateHistoryButtons() {
  undoBtn.disabled = snapIndex <= 0;
  redoBtn.disabled = snapIndex >= snapshots.length - 1;
}

/* =====================================================================
 * 13. 页面
 * ===================================================================== */
function updatePageUI() {
  pgLabel.textContent = (pageIndex + 1) + ' / ' + pages.length;
  document.getElementById('prevPage').disabled = pageIndex <= 0;
  document.getElementById('nextPage').disabled = pageIndex >= pages.length - 1;
  thumbCount.textContent = '共 ' + pages.length + ' 页';
}
function goPage(n) {
  if (n < 0 || n >= pages.length) return;
  pageIndex = n;
  objects = pages[pageIndex];
  selection = [];
  updateSelBar(); updatePageUI(); render(); drawPreview();
  if (thumbPanel.classList.contains('show')) {
    thumbScroll.querySelectorAll('.thumb-item').forEach((el, k) => {
      el.classList.toggle('active', k === pageIndex);
    });
  }
}
function addPage() {
  pages.push([]);
  pageIndex = pages.length - 1;
  objects = pages[pageIndex];
  selection = [];
  updateSelBar(); updatePageUI(); render(); drawPreview(); pushSnapshot();
  if (thumbPanel.classList.contains('show')) buildThumbnails();
  toast('已新建第 ' + pages.length + ' 页');
}
function deletePage(idx) {
  if (typeof idx !== 'number' || idx < 0 || idx >= pages.length) return;

  if (pages.length <= 1) {
    if (!pages[0].length) { toast('已经是空白页了'); return; }
    pages[0].length = 0;
    objects = pages[0];
    selection = [];
    pushSnapshot();
    updateSelBar(); updatePageUI(); render(); drawPreview();
    if (thumbPanel.classList.contains('show')) buildThumbnails();
    toast('已清空本页（Ctrl+Z 可撤销）');
    return;
  }

  const no = idx + 1;
  pages.splice(idx, 1);
  if (pageIndex >= pages.length) pageIndex = pages.length - 1;
  else if (idx < pageIndex) pageIndex--;

  objects = pages[pageIndex];
  selection = [];

  pushSnapshot();
  updateSelBar(); updatePageUI(); render(); drawPreview();
  if (thumbPanel.classList.contains('show')) buildThumbnails();
  toast('已删除第 ' + no + ' 页（Ctrl+Z 可撤销）');
}

/* =====================================================================
 * 14. Toast
 * ===================================================================== */
let toastTimer = null;
let __mathVersion = 0;      // 每次公式异步渲染成功 +1
let __renderScheduled = false;
function scheduleRender() {
  if (__renderScheduled) return;
  __renderScheduled = true;
  requestAnimationFrame(() => {
    __renderScheduled = false;
    render();
    drawPreview();
    if (selBar.classList.contains('show')) updateSelBarPosition();
  });
}


function toast(msg, ms) {
  let el = document.getElementById('__toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '__toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; }, ms || 2200);
}

/* =====================================================================
 * 15. 工具切换
 * ===================================================================== */
function isShapeTool(t) {
  return t !== 'select' && t !== 'pen' && t !== 'eraser' &&
         !!PB.shapes[t] && !PB.shapes[t].hidden;
}
function setTool(t, noAutoPanel) {
  if (textEditorEl && t !== state.tool) commitTextEditor();
  state.tool = t;
  const isShape = isShapeTool(t);
  document.querySelectorAll('.dbtn[data-tool]').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === t);
  });
  document.getElementById('shapeBtn').classList.toggle('active', isShape);
  if (noAutoPanel) {
    penPanel.classList.remove('show');
    if (!isShape) shapePanel.classList.remove('show');
  } else {
    penPanel.classList.toggle('show', t === 'pen');
    shapePanel.classList.toggle('show', isShape);
  }
  if (isShape) {
    const def = PB.shapes[t];
    if (def && def.cat) state.shapeCat = def.cat;
    buildShapePanel();
  }
  if (t !== 'select') { selection = []; hideSubPanels(); updateSelBar(); }
  updateToolHighlight();
  setCursor(t === 'select' ? 'default' : (t === 'eraser' ? 'none' : 'crosshair'));
  drawPreview();
}
function updateToolHighlight() {
  document.querySelectorAll('.shape-cell').forEach(b => {
    b.classList.toggle('active', b.dataset.shape === state.tool);
  });
}
function setCursor(cur) { board.style.cursor = cur; }
/* =====================================================================
 * 16. 形状面板
 * ===================================================================== */
function getCategories() {
  if (Array.isArray(PB.categories) && PB.categories.length) {
    return PB.categories.filter(c => c.id !== '__sys');
  }
  const map = new Map();
  for (const k in PB.shapes) {
    const s = PB.shapes[k];
    if (s.hidden || s.cat === '__sys') continue;
    if (!map.has(s.cat)) map.set(s.cat, { id:s.cat, label:s.cat });
  }
  return [...map.values()];
}
function ensureCategoryList() {
  if (!Array.isArray(PB.categories) || !PB.categories.length) {
    const map = new Map();
    for (const k in PB.shapes) {
      const s = PB.shapes[k];
      if (s.hidden || s.cat === '__sys') continue;
      if (!map.has(s.cat)) map.set(s.cat, { id:s.cat, label:s.cat });
    }
    PB.categories = [...map.values()];
  }
}
function ensureCategory(id, label) {
  ensureCategoryList();
  if (!PB.categories.some(c => c.id === id)) {
    PB.categories.push({ id, label: label || id });
  }
}
function catHasShapes(catId) {
  for (const k in PB.shapes) {
    const s = PB.shapes[k];
    if (!s.hidden && s.cat === catId) return true;
  }
  return false;
}
function buildShapePanel() {
  const cats = getCategories().filter(c => catHasShapes(c.id));
  if (!state.shapeCat || !cats.some(c => c.id === state.shapeCat)) {
    state.shapeCat = cats.length ? cats[0].id : null;
  }
  catStrip.innerHTML = '';
  cats.forEach(c => {
    const b = document.createElement('button');
    b.className = 'cat-chip' + (c.id === state.shapeCat ? ' active' : '');
    b.textContent = c.label;
    b.addEventListener('click', () => { state.shapeCat = c.id; buildShapePanel(); });
    catStrip.appendChild(b);
  });
  attachCatDrag();
  shapeGrid.innerHTML = '';
  const frag = document.createDocumentFragment();
  let count = 0;
  for (const k in PB.shapes) {
    const s = PB.shapes[k];
    if (s.hidden || s.cat !== state.shapeCat) continue;
    count++;
    const b = document.createElement('button');
    b.className = 'shape-cell' + (state.tool === k ? ' active' : '');
    b.dataset.shape = k;
    b.title = s.label || k;
    b.innerHTML = renderShapeIcon(s.icon) + '<span>' + escapeHtml(s.label || k) + '</span>';
    b.addEventListener('click', () => {
      setTool(k);
      shapePanel.classList.remove('show');
    });
    frag.appendChild(b);
  }
  if (!count) {
    const d = document.createElement('div');
    d.className = 'shape-empty';
    d.textContent = '该类别下暂无图形';
    shapeGrid.appendChild(d);
  } else shapeGrid.appendChild(frag);
}
function attachCatDrag() {
  if (catStrip._dragAttached) return;
  catStrip._dragAttached = true;

  /* ========== 鼠标拖动（保留原逻辑）========== */
  let isDown = false, startX = 0, scrollStart = 0, moved = false;
  catStrip.addEventListener('mousedown', e => {
    isDown = true; startX = e.clientX; scrollStart = catStrip.scrollLeft; moved = false;
    if (!e.target.closest('.cat-chip')) { catStrip.classList.add('grabbing'); e.preventDefault(); }
  });
  window.addEventListener('mousemove', e => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) { moved = true; catStrip.classList.add('grabbing'); }
    if (moved) catStrip.scrollLeft = scrollStart - dx;
  });
  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    catStrip.classList.remove('grabbing');
    if (moved) {
      const stopClick = ev => { ev.stopPropagation(); ev.preventDefault(); };
      catStrip.addEventListener('click', stopClick, { capture: true, once: true });
      setTimeout(() => catStrip.removeEventListener('click', stopClick, true), 0);
    }
  });

  /* ========== 触摸滑动：小滑 = 滚动，大滑 = 切换类别 ========== */
  let tsX = 0, tsY = 0, tsTime = 0, tsMoved = false;

  catStrip.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    tsX = e.touches[0].clientX;
    tsY = e.touches[0].clientY;
    tsTime = Date.now();
    tsMoved = false;
    startX = tsX;
    scrollStart = catStrip.scrollLeft;
  }, { passive: true });

  catStrip.addEventListener('touchmove', e => {
    if (e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - tsY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) tsMoved = true;
    // 短距离横滑 → 滚动 category 条
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) < 60) {
      catStrip.scrollLeft = scrollStart - dx;
    }
  }, { passive: true });

  catStrip.addEventListener('touchend', e => {
    if (!tsMoved) return;
    const dx = (e.changedTouches[0] && e.changedTouches[0].clientX || 0) - tsX;
    const dt = Date.now() - tsTime;
    // 快速、大距离横滑 → 切换类别
    if (dt < 800 && Math.abs(dx) >= 60) {
      switchCategory(dx < 0 ? 1 : -1);
      // 阻止触发 chip 的点击
      const stopClick = ev => { ev.stopPropagation(); ev.preventDefault(); };
      catStrip.addEventListener('click', stopClick, { capture: true, once: true });
      setTimeout(() => catStrip.removeEventListener('click', stopClick, true), 400);
    }
  }, { passive: true });
}

/* 新增：切换到相邻类别 */
function switchCategory(dir) {
  const cats = getCategories().filter(c => catHasShapes(c.id));
  if (!cats.length) return;
  let idx = cats.findIndex(c => c.id === state.shapeCat);
  if (idx < 0) idx = 0;
  const next = Math.max(0, Math.min(cats.length - 1, idx + dir));
  if (cats[next].id !== state.shapeCat) {
    state.shapeCat = cats[next].id;
    buildShapePanel();
  }
}

function makeTouchScrollable(el) {
  if (!el) return;
  let activeId = null;
  let startX = 0, startY = 0, startTop = 0;
  let didScroll = false;

  el.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    activeId = t.identifier;
    startX = t.clientX;
    startY = t.clientY;
    startTop = el.scrollTop;
    didScroll = false;
  }, { passive: true });

  el.addEventListener('touchmove', e => {
    if (activeId === null) return;
    let t = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeId) { t = e.touches[i]; break; }
    }
    if (!t) return;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (!didScroll) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) {
        didScroll = true;
      } else if (Math.abs(dx) > 6) {
        activeId = null;
        return;
      } else {
        return;
      }
    }
    el.scrollTop = startTop - dy;
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  const endHandler = () => {
    if (didScroll) {
      const suppress = ev => { ev.stopPropagation(); ev.preventDefault(); };
      el.addEventListener('click', suppress, { capture: true, once: true });
      setTimeout(() => el.removeEventListener('click', suppress, true), 400);
    }
    activeId = null;
    didScroll = false;
  };
  el.addEventListener('touchend', endHandler);
  el.addEventListener('touchcancel', endHandler);
}

function renderShapeIcon(icon) {
  if (typeof icon === 'string' && icon.slice(0, 11) === 'data:image/') {
    return '<img src="' + icon + '" alt="" draggable="false">';
  }
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
         'stroke-linecap="round" stroke-linejoin="round">' + (icon || '') + '</svg>';
}
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}



/* =====================================================================
 * A1. 追加到 selBar 的「存函数」按钮（仅选中 funcPlotter 时显示）
 * ===================================================================== */
(function ensureFuncSaveBtn() {
  function install() {
    const selBar = document.getElementById('selBar');
    if (!selBar) { setTimeout(install, 80); return; }
    if (document.getElementById('tagFuncSave')) return;
    const btn = document.createElement('button');
    btn.className = 'sbtn';
    btn.id = 'tagFuncSave';
    btn.title = '拖动此按钮到已打开的抽屉上，即可把当前函数保存进抽屉';
    btn.style.display = 'none';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>' +
      '</svg><span>存函数</span>';
    const delBtn = document.getElementById('tagDelete');
    if (delBtn) selBar.insertBefore(btn, delBtn);
    else selBar.appendChild(btn);

    /* 拖动保存逻辑 */
    btn.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      const one = selection[0];
      if (!one || one.type !== 'funcPlotter') return;
      const code = String(one['智能指令'] || '');
      if (!code.trim()) { toast('该函数图形还没有绘制脚本'); return; }

      const defaultLabel = code.split('\n')[0].slice(0, 18);
      const label = prompt('给这条函数起个名字（保存到抽屉后显示）：', defaultLabel);
      if (label === null) return;
      const finalLabel = (label || defaultLabel).trim() || defaultLabel;

      e.preventDefault();
      const ghost = document.createElement('div');
      ghost.textContent = '📌 ' + finalLabel;
      ghost.style.cssText =
        'position:fixed; z-index:99999; pointer-events:none; ' +
        'padding:8px 14px; background:linear-gradient(135deg,#22d3ee,#a855f7); ' +
        'color:#fff; border-radius:10px; font-size:12px; font-weight:600; ' +
        'box-shadow:0 8px 24px rgba(34,211,238,.65),0 0 0 1px rgba(255,255,255,.25) inset; ' +
        'transform:translate(-50%,-50%);';
      ghost.style.left = e.clientX + 'px';
      ghost.style.top = e.clientY + 'px';
      document.body.appendChild(ghost);

      let dropGroupId = null;

      const move = function (ev) {
        ghost.style.left = ev.clientX + 'px';
        ghost.style.top = ev.clientY + 'px';
        document.querySelectorAll('.pb-ex-drawer [data-group-id]').forEach(function (n) {
          n.style.outline = '';
          n.style.background = '';
          n.style.outlineOffset = '';
        });
        const hovered = document.elementFromPoint(ev.clientX, ev.clientY);
        const groupEl = hovered && hovered.closest && hovered.closest('.pb-ex-drawer [data-group-id]');
        if (groupEl) {
          groupEl.style.outline = '2px dashed #22d3ee';
          groupEl.style.outlineOffset = '3px';
          groupEl.style.background = 'rgba(34,211,238,.12)';
          dropGroupId = groupEl.dataset.groupId;
        } else {
          dropGroupId = null;
        }
      };

      const up = function (ev) {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        ghost.remove();
        document.querySelectorAll('.pb-ex-drawer [data-group-id]').forEach(function (n) {
          n.style.outline = '';
          n.style.background = '';
          n.style.outlineOffset = '';
        });

        if (dropGroupId && window.__pbFuncPlotter) {
          window.__pbFuncPlotter.addItem(dropGroupId, finalLabel, code);
          if (window.__exDrawerElRefresh) window.__exDrawerElRefresh();
          toast('✅ 已保存到抽屉：' + finalLabel);
        } else {
          toast('拖到已打开的抽屉上才能保存');
        }
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }
  install();
})();












/* =====================================================================
 * 17. 选中标签栏
 * ===================================================================== */
function updateSelBar() {
  const show = selection.length > 0 && state.tool === 'select';
  if (!show) {
    selBar.classList.remove('show');
    hideSubPanels();
    cloneMode = false;
    document.getElementById('tagClone').classList.remove('active');
    return;
  }
  const one = selection.length === 1 ? selection[0] : null;
  const def = one ? PB.shapes[one.type] : null;
  const isAnim = !!(def && def.animatable);
  const hasParams = !!(def && def.params && def.params.length);
  const isImage = !!(one && one.type === '__image');
  const isVideo = !!(one && one.type === '__video');
  const isFuncPlotter = !!(one && one.type === 'funcPlotter');

  const tagAnim = document.getElementById('tagAnim');
  const tagResetAnim = document.getElementById('tagResetAnim');
  const tagParams = document.getElementById('tagParams');
  const tagGroup = document.getElementById('tagGroup');
  const tagAnimIcon = document.getElementById('tagAnimIcon');
  const tagAnimText = document.getElementById('tagAnimText');
  const tagEnhance = document.getElementById('tagEnhance');
  const tagVideo = document.getElementById('tagVideo');
  const tagFuncSaveEl = document.getElementById('tagFuncSave');
  if (tagFuncSaveEl) tagFuncSaveEl.style.display = isFuncPlotter ? '' : 'none';
  tagAnim.style.display = isAnim ? '' : 'none';
  tagResetAnim.style.display = isAnim ? '' : 'none';
  tagParams.style.display = hasParams ? '' : 'none';
  tagGroup.style.display = selection.length >= 2 ? '' : 'none';
  tagEnhance.style.display = isImage ? '' : 'none';
  tagVideo.style.display = isVideo ? '' : 'none';

  const tagVideoPlay = document.getElementById('tagVideoPlay');
  tagVideoPlay.style.display = isVideo ? '' : 'none';
  if (isVideo) {
    const isPlaying = !!one.playing;
    const iconEl = document.getElementById('tagVideoPlayIcon');
    const textEl = document.getElementById('tagVideoPlayText');
    if (isPlaying) {
      iconEl.innerHTML = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
      textEl.textContent = '暂停';
      tagVideoPlay.classList.add('anim-on');
    } else {
      iconEl.innerHTML = '<polygon points="7,5 19,12 7,19"/>';
      textEl.textContent = '播放';
      tagVideoPlay.classList.remove('anim-on');
    }
  }
  if (isAnim) {
    ensureAnimFields(one);
    if (one.animPlaying) {
      tagAnimIcon.innerHTML = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
      tagAnimText.textContent = '暂停';
      tagAnim.classList.add('anim-on');
    } else {
      tagAnimIcon.innerHTML = '<polygon points="7,5 19,12 7,19"/>';
      tagAnimText.textContent = '播放';
      tagAnim.classList.remove('anim-on');
    }
  }
  if (isVideo) {
    tagVideo.classList.toggle('active', videoEditPanel.classList.contains('show'));
  }
  if (isImage) {
    tagEnhance.classList.toggle('active', enhancePanel.classList.contains('show'));
  }
  document.getElementById('tagBorder').classList.toggle('active', borderPanel.classList.contains('show'));
  document.getElementById('tagFill').classList.toggle('active', fillPanel.classList.contains('show'));
  document.getElementById('tagParams').classList.toggle('active', paramsPanel.classList.contains('show'));
  document.getElementById('tagClone').classList.toggle('active', cloneMode);
  selBar.classList.add('show');
  requestAnimationFrame(updateSelBarPosition);
}
function updateSelBarPosition() {
  if (!selBar.classList.contains('show')) return;
  const bb = selection.length === 1 ? getWorldBBox(selection[0]) : unionBBox(selection);
  const sp1 = worldToScreen(bb.x1, bb.y1);
  const sp2 = worldToScreen(bb.x2, bb.y2);

  const cx = (sp1.x + sp2.x) / 2;
  const barW = selBar.offsetWidth || 320;
  const barH = selBar.offsetHeight || 52;
  let left = cx - barW / 2;
  let top = sp2.y + 14;
  if (top + barH > window.innerHeight - 90) {
    const above = sp1.y - barH - 14;
    if (above > 12) top = above;
    else top = Math.min(window.innerHeight - barH - 12, sp2.y + 14);
  }
  if (left < 12) left = 12;
  if (left + barW > window.innerWidth - 12) left = window.innerWidth - barW - 12;
  selBar.style.left = left + 'px';
  selBar.style.top = top + 'px';
  if (borderPanel.classList.contains('show')) positionSubPanel(borderPanel);
  if (fillPanel.classList.contains('show')) positionSubPanel(fillPanel);
  if (paramsPanel.classList.contains('show')) positionSubPanel(paramsPanel);
  if (enhancePanel.classList.contains('show')) positionSubPanel(enhancePanel);
  if (videoEditPanel.classList.contains('show')) positionSubPanel(videoEditPanel);
}
function positionSubPanel(el) {
  requestAnimationFrame(() => {
    const barRect = selBar.getBoundingClientRect();
    const bb = selection.length === 1 ? getWorldBBox(selection[0]) : unionBBox(selection);
    const sp1 = worldToScreen(bb.x1, bb.y1);
    const sp2 = worldToScreen(bb.x2, bb.y2);

    const midY = (sp1.y + sp2.y) / 2;
    const w = el.offsetWidth  || 300;
    const h = el.offsetHeight || 200;
    const gap = 12, M = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cxBar = barRect.left + barRect.width / 2;

    /* ★ 1) 图形右侧 */
    let left = sp2.x + gap;
    let top  = midY - h / 2;
    if (left + w <= vw - M) {
      top = Math.max(M, Math.min(vh - h - M, top));
      el.style.left = left + 'px';
      el.style.top  = top  + 'px';
      return;
    }

    /* ★ 2) 图形左侧 */
    left = sp1.x - w - gap;
    if (left >= M) {
      top = Math.max(M, Math.min(vh - h - M, midY - h / 2));
      el.style.left = left + 'px';
      el.style.top  = top  + 'px';
      return;
    }

    /* 3) 按钮下方 */
    left = Math.max(M, Math.min(vw - w - M, cxBar - w / 2));
    top  = barRect.bottom + gap;
    if (top + h <= vh - M) {
      el.style.left = left + 'px';
      el.style.top  = top  + 'px';
      return;
    }

    /* 4) 按钮上方 */
    top = barRect.top - h - gap;
    if (top >= M) {
      el.style.left = left + 'px';
      el.style.top  = top  + 'px';
      return;
    }

    /* 5) 兜底：按钮下方强制放置 */
    left = Math.max(M, Math.min(vw - w - M, cxBar - w / 2));
    top  = Math.max(M, Math.min(vh - h - M, barRect.bottom + gap));
    el.style.left = left + 'px';
    el.style.top  = top  + 'px';
  });
}

function hideSubPanels() {
  borderPanel.classList.remove('show');
  fillPanel.classList.remove('show');
  paramsPanel.classList.remove('show');
  enhancePanel.classList.remove('show');
  videoEditPanel.classList.remove('show');
  /* 关闭参数面板时清掉示例抽屉 */
  if (typeof __destroyExDrawer === 'function') __destroyExDrawer();
}


document.getElementById('tagAnim').addEventListener('click', () => {
  const one = selection[0];
  if (!one || !isAnimObj(one)) return;
  toggleObjAnim(one);
});
document.getElementById('tagResetAnim').addEventListener('click', () => {
  const one = selection[0];
  if (!one || !isAnimObj(one)) return;
  resetObjAnim(one);
});
document.getElementById('tagBorder').addEventListener('click', function () {
  const open = borderPanel.classList.contains('show');
  hideSubPanels();
  if (!open) { borderPanel.classList.add('show'); syncBorderUI(); positionSubPanel(borderPanel); }
  this.classList.toggle('active', !open);
  ['tagFill','tagParams','tagEnhance','tagVideo'].forEach(id => document.getElementById(id).classList.remove('active'));
});
document.getElementById('tagFill').addEventListener('click', function () {
  const open = fillPanel.classList.contains('show');
  hideSubPanels();
  if (!open) { fillPanel.classList.add('show'); syncFillUI(); positionSubPanel(fillPanel); }
  this.classList.toggle('active', !open);
  ['tagBorder','tagParams','tagEnhance','tagVideo'].forEach(id => document.getElementById(id).classList.remove('active'));
});
document.getElementById('tagParams').addEventListener('click', function () {
  const open = paramsPanel.classList.contains('show');
  hideSubPanels();
  if (!open) { buildParamsPanel(); paramsPanel.classList.add('show'); positionSubPanel(paramsPanel); }
  this.classList.toggle('active', !open);
  ['tagBorder','tagFill','tagEnhance','tagVideo'].forEach(id => document.getElementById(id).classList.remove('active'));
});
document.getElementById('tagEnhance').addEventListener('click', function () {
  const one = selection[0];
  if (!one || one.type !== '__image') return;
  const open = enhancePanel.classList.contains('show');
  hideSubPanels();
  if (!open) { buildEnhancePanel(); enhancePanel.classList.add('show'); positionSubPanel(enhancePanel); }
  this.classList.toggle('active', !open);
  ['tagBorder','tagFill','tagParams','tagVideo'].forEach(id => document.getElementById(id).classList.remove('active'));
});
document.getElementById('tagVideo').addEventListener('click', function () {
  const one = selection[0];
  if (!one || one.type !== '__video') return;
  const open = videoEditPanel.classList.contains('show');
  hideSubPanels();
  if (!open) { buildVideoEditPanel(); videoEditPanel.classList.add('show'); positionSubPanel(videoEditPanel); }
  this.classList.toggle('active', !open);
  ['tagBorder','tagFill','tagParams','tagEnhance'].forEach(id => document.getElementById(id).classList.remove('active'));
});
document.getElementById('tagVideoPlay').addEventListener('click', function () {
  const one = selection[0];
  if (!one || one.type !== '__video') return;
  const v = one._videoEl;

  if (one.playing) {
    /* 当前在播 → 暂停 */
    if (v) try { v.pause(); } catch (e) {}
    one.playing = false;
    if (!anyAnimPlaying()) stopAnimLoop();
  } else {
    /* 当前暂停 → 播放 */
    if (v) {
      const start = one.trimStart || 0;
      const end = (one.trimEnd != null ? one.trimEnd : (one.duration || 0));
      /* 未开始、或在剪切区间外、或已经播到结尾 → 重置到 trimStart */
      if (!v.currentTime || v.currentTime < start ||
          (end > 0 && v.currentTime >= end - 0.05)) {
        try { v.currentTime = start; } catch (e) {}
      }
      try { v.play(); } catch (e) {}
    }
    one.playing = true;
    startAnimLoop();
  }
  updatePlayButtons();
  updateSelBar();
});
document.getElementById('tagTop').addEventListener('click', () => {
  if (!selection.length) return;
  const sel = selection.slice();
  objects = objects.filter(o => sel.indexOf(o) < 0);
  objects.push(...sel);
  pages[pageIndex] = objects;
  pushSnapshot(); render(); drawPreview();
  toast('已置顶');
});
document.getElementById('tagClone').addEventListener('click', function () {
  cloneMode = !cloneMode;
  this.classList.toggle('active', cloneMode);
  if (cloneMode) {
    toast(selection.length > 1
      ? '克隆已开启：拖动选中的 ' + selection.length + ' 个图形，会整组复制'
      : '克隆已开启：拖动图形即可复制');
  } else {
    toast('克隆已关闭');
  }
});
document.getElementById('tagDelete').addEventListener('click', () => {
  if (!selection.length) return;
  const n = selection.length;
  objects = objects.filter(o => selection.indexOf(o) < 0);
  pages[pageIndex] = objects;
  selection = [];
  pushSnapshot(); updateSelBar(); render(); drawPreview();
  toast('已删除 ' + n + ' 个图形');
  if (!objects.length) setTool('pen', true);
});

/* =====================================================================
 * 17b. 文字编辑器
 * ===================================================================== */
let textEditorEl = null;
let textEditTarget = null;
let textEditIsNew = false;
let textEditOriginalText = '';
let committingText = false;
let textEditorAnchor = null;   // ← 新增：记录编辑器锚定屏幕坐标
let textMathPanelEl = null;  

function startNewText(pt) {
  const type = state.tool;
  const def = PB.shapes[type];
  if (!def) return;
  const base = newBase(def);

  // ★ 关键：如果图形定义了 defaultText，就用它作为初始文本
  const hasPreset = (typeof def.defaultText === 'string' && def.defaultText.length > 0);

  const o = {
    type: type,
    x: pt.x,
    y: pt.y,
    text: hasPreset ? def.defaultText : '',
    fontFamily: base.fontFamily || state.textFontFamily || 'system',
    fontSize: base.fontSize || state.textSize || 32,
    bold: (base.bold != null) ? base.bold : !!state.textBold,
    italic: (base.italic != null) ? base.italic : !!state.textItalic,
    underline: (base.underline != null) ? base.underline : !!state.textUnderline,
    textAlign: base.textAlign || 'left',
    color: base.color || state.penColor,
    size: base.size || state.penSize,
    hasBorder: true,
    dash: 'solid',
    fill: false,
    rotation: 0
  };
  measureText(o);

  // ★ 有预设文字的"快捷文字" → 直接放置，不打开编辑器
  if (hasPreset) {
    objects.push(o);
    pages[pageIndex] = objects;
    selection = [o];
    pushSnapshot();
    setTool('select');
    updateSelBar();
    render();
    drawPreview();
    if (typeof toast === 'function') toast('已放置：' + (def.label || type));
    return;
  }

  // 普通「文字」工具 → 仍打开编辑器让用户输入
  objects.push(o);
  pages[pageIndex] = objects;
  render();
  openTextEditor(o, true);
}

function openTextEditor(o, isNew) {
  if (textEditorEl) commitTextEditor();
  if (!o) return;
  textEditTarget = o;
  textEditIsNew = !!isNew;
  textEditOriginalText = o.text || '';
  textEditorAnchor = null;

  const el = document.createElement('div');
  const ball = document.getElementById('__pb_ball');
  if (ball) ball.style.display = 'none';
  el.className = 'text-editor-fullscreen';
  
  // 构建全屏编辑器 UI
  el.innerHTML =
    '<div class="te-fs-header">' +
      '<div class="te-fs-title">编辑文字</div>' +
      '<div class="te-fs-actions">' +
        '<button class="te-fs-btn te-fs-ok" data-b="ok" title="保存 (Ctrl+Enter)">✓ 保存</button>' +
        '<button class="te-fs-btn te-fs-cancel" data-b="cancel" title="取消 (Esc)">✕ 关闭</button>' +
      '</div>' +
    '</div>' +
    '<div class="te-fs-body">' +
      '<div class="te-fs-left">' +
        '<textarea class="te-input te-fs-textarea" spellcheck="false" ' +
          'placeholder="输入文字…&#10;&#10;公式语法：&#10;· 行内公式：$x^2 + y^2 = 1$&#10;· 独立公式：$$\\frac{a}{b}$$&#10;· 也支持 \\( ... \\) 和 \\[ ... \\]&#10;&#10;按 Alt+M 或点击 ∑ 打开公式编辑器"></textarea>' +
      '</div>' +
      '<div class="te-fs-right">' +
        '<div class="te-fs-preview-head">预览</div>' +
        '<div class="te-fs-preview" data-el="preview"></div>' +
      '</div>' +
    '</div>' +
    '<div class="te-fs-toolbar">' +
      '<select class="te-font" title="字体"></select>' +
      '<input type="number" class="te-size" min="6" max="400" step="1" title="字号">' +
      '<button class="te-btn" data-b="bold" title="加粗">B</button>' +
      '<button class="te-btn" data-b="italic" title="斜体" style="font-style:italic;">I</button>' +
      '<button class="te-btn" data-b="underline" title="下划线" style="text-decoration:underline;">U</button>' +
      '<span class="te-sep"></span>' +
      '<button class="te-btn" data-a="left" title="左对齐">⇤</button>' +
      '<button class="te-btn" data-a="center" title="居中">⇔</button>' +
      '<button class="te-btn" data-a="right" title="右对齐">⇥</button>' +
      '<span class="te-sep"></span>' +
      '<input type="color" class="te-color" title="颜色">' +
      '<span class="te-sep"></span>' +
      '<button class="te-btn te-math-toggle" title="公式编辑器 (Alt+M)" style="font-family:serif;font-weight:bold;">∑</button>' +
    '</div>' +
'<div class="te-fs-math-panel" data-el="mathPanel">' +
  '<div class="te-math-insert-area"></div>' +
'</div>';
    
  document.body.appendChild(el);
  textEditorEl = el;

  /* ---- 关键引用 ---- */
  const fontSel   = el.querySelector('.te-font');
  const ta        = el.querySelector('.te-input');
/* ========== 选中公式 → 拖到公式面板 (Pointer 伪拖拽) ========== */
let formulaDragGhost = null;

function getSelectedFormula() {
  const start = ta.selectionStart, end = ta.selectionEnd;
  if (start === end) return null;
  const text = ta.value.slice(start, end).trim();
  return text || null;
}
function cleanFormulaText(t) {
  t = t.trim();
  if (t.startsWith('$$') && t.endsWith('$$')) return t.slice(2, -2).trim();
  if (t.startsWith('$') && t.endsWith('$')) return t.slice(1, -1).trim();
  return t;
}
function hideFormulaDragGhost() {
  if (formulaDragGhost) formulaDragGhost.style.display = 'none';
}
function showFormulaDragGhost() {
  const t = getSelectedFormula();
  if (!t) { hideFormulaDragGhost(); return; }
  const g = ensureFormulaDragGhost();
  const rect = ta.getBoundingClientRect();
  g.style.display = 'block';
  g.style.right = '26px';
  g.style.top = (rect.top + 10) + 'px';
  g.style.left = 'auto'; 
}

function ensureFormulaDragGhost() {
  if (formulaDragGhost) return formulaDragGhost;
  const g = document.createElement('div');
  g.className = 'te-formula-ghost';
  g.textContent = '📌 拖到公式面板';
  g.title = '按住拖动到右侧公式面板的抽屉 / 常用区';
  document.body.appendChild(g);

  // ★ 关键：彻底禁用原生拖拽，改用 Pointer 事件模拟
  g.draggable = false; 
  
  let dragging = false;
  let dragPayload = '';

  g.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const t = getSelectedFormula();
    if (!t) return;
    
    e.preventDefault();
    dragPayload = cleanFormulaText(t);
    dragging = true;
    g.setPointerCapture(e.pointerId);
    g.classList.add('dragging');
    g.style.cursor = 'grabbing';
    
    // 自动打开公式面板，方便用户继续拖入
    const mathToggle = el.querySelector('.te-math-toggle');
    const mathPanel  = el.querySelector('[data-el=mathPanel]');
    if (mathToggle && mathPanel && !mathPanel.classList.contains('show')) {
      mathToggle.click();
    }

    // ★ 新增：通知 iframe 拖拽开始
    const frame = document.getElementById('latexEditorFrame');
    if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'pb:drag-start' }, '*');
    }
  });


  g.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    g.style.left = (e.clientX + 15) + 'px';
    g.style.top  = (e.clientY + 15) + 'px';
    g.style.right = 'auto';
    
    // 把坐标发给 iframe，让它自己判断高亮
    const frame = document.getElementById('latexEditorFrame');
    if (frame && frame.contentWindow) {
        const r = frame.getBoundingClientRect();
        const ix = e.clientX - r.left;
        const iy = e.clientY - r.top;
        frame.contentWindow.postMessage({
            type: 'pb:drag-move',
            x: ix,
            y: iy,
            inFrame: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
        }, '*');
    }
  });

  g.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    g.releasePointerCapture(e.pointerId);
    g.classList.remove('dragging');
    g.style.cursor = 'grab';
    g.style.left = ''; g.style.top = ''; g.style.right = '26px'; g.style.display = 'none';

    const frame = document.getElementById('latexEditorFrame');
    if (!frame || !frame.contentWindow || !dragPayload) return;

    const r = frame.getBoundingClientRect();
    const ix = e.clientX - r.left;
    const iy = e.clientY - r.top;
    const inFrame = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;

    // 通知 iframe 拖拽结束并投放
    frame.contentWindow.postMessage({
        type: 'pb:drag-end',
        x: ix,
        y: iy,
        inFrame: inFrame,
        latex: dragPayload
    }, '*');

    g.textContent = '✓ 已添加';
    setTimeout(() => { g.textContent = '📌 拖到公式面板'; }, 1500);
  });

  g.addEventListener('pointercancel', () => {
    dragging = false;
    g.classList.remove('dragging');
    g.style.left = ''; g.style.top = ''; g.style.right = '26px';
    const frame = document.getElementById('latexEditorFrame');
    if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'pb:drag-end', inFrame: false }, '*');
    }
  });
  formulaDragGhost = g;
  return g;
}

/* 通过鼠标屏幕坐标判断是否在 iframe 内部的抽屉 / 常用区上 */
function findFrameDropTarget(sx, sy) {
  const frame = document.getElementById('latexEditorFrame');
  if (!frame) return null;
  const r = frame.getBoundingClientRect();
  if (sx < r.left || sx > r.right || sy < r.top || sy > r.bottom) return null;

  try {
    const doc = frame.contentDocument;
    if (!doc) return null;
    
    // 鼠标相对于 iframe 视口的坐标
    const ix = sx - r.left;
    const iy = sy - r.top;
    
    // 1. 遍历所有的抽屉，判断坐标是否在抽屉的矩形范围内（无视浮窗遮挡）
    const wraps = doc.querySelectorAll('.pb-group-wrap');
    for (let i = 0; i < wraps.length; i++) {
        const wRect = wraps[i].getBoundingClientRect();
        // 允许稍微扩大一点判断范围（向外扩大 5px），方便用户对准
        if (ix >= wRect.left - 5 && ix <= wRect.right + 5 && iy >= wRect.top - 5 && iy <= wRect.bottom + 5) {
            return { type: 'group', gid: wraps[i].dataset.groupId, el: wraps[i] };
        }
    }
    
    // 2. 检查是否在“常用”区域内部
    const common = doc.getElementById('commonButtons');
    if (common) {
        const cRect = common.getBoundingClientRect();
        if (ix >= cRect.left - 5 && ix <= cRect.right + 5 && iy >= cRect.top - 5 && iy <= cRect.bottom + 5) {
            return { type: 'common', el: common };
        }
    }
  } catch (err) { /* 跨域忽略 */ }
  return null;
}

function highlightFrameTarget(drop) {
  clearFrameHighlight();
  if (!drop || !drop.el) return;
  
  // 用更显眼的青色发光虚线标记
  drop.el.style.outline = '3px dashed #22d3ee';
  drop.el.style.outlineOffset = '6px';
  drop.el.style.background = 'rgba(34,211,238,.25)';
  drop.el.style.boxShadow = '0 0 20px rgba(34,211,238,.8)';
  drop.el.style.transition = 'all .2s';
  drop.el.style.borderRadius = '8px';
}

function clearFrameHighlight() {
  const frame = document.getElementById('latexEditorFrame');
  if (!frame) return;
  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.querySelectorAll('.pb-group-wrap, #commonButtons').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.background = '';
      el.style.boxShadow = '';
    });
  } catch (err) {}
}
/* 监听选区变化 */
['mouseup', 'keyup', 'select'].forEach(ev => {
  ta.addEventListener(ev, () => setTimeout(showFormulaDragGhost, 10));
});
ta.addEventListener('mousedown', () => {
  setTimeout(() => { if (!getSelectedFormula()) hideFormulaDragGhost(); }, 10);
});
/* ======================================================== */


  const previewEl = el.querySelector('[data-el=preview]');
  const sizeInp   = el.querySelector('.te-size');
  const colorInp  = el.querySelector('.te-color');
  const mathPanel = el.querySelector('[data-el=mathPanel]');
  const mathToggle= el.querySelector('.te-math-toggle');
  textMathPanelEl = mathPanel;

  // 初始化字体下拉框
  TEXT_FONTS.forEach(f => {
    const op = document.createElement('option');
    op.value = f.id; op.textContent = f.label;
    op.style.fontFamily = f.css;
    fontSel.appendChild(op);
  });
  fontSel.value = o.fontFamily || 'system';

  ta.value = o.text || '';
  sizeInp.value = o.fontSize || 32;
  colorInp.value = toHexColor(o.color || '#e6edf7');

  function syncBtns() {
    el.querySelectorAll('[data-b]').forEach(b => {
      const k = b.dataset.b;
      if (k === 'bold')      b.classList.toggle('on', !!o.bold);
      if (k === 'italic')    b.classList.toggle('on', !!o.italic);
      if (k === 'underline') b.classList.toggle('on', !!o.underline);
    });
    el.querySelectorAll('[data-a]').forEach(b => {
      b.classList.toggle('on', (o.textAlign || 'left') === b.dataset.a);
    });
  }

  /* ---- 预览 ---- */
  function svgStrToDataUrl(s) {
    const bytes = new TextEncoder().encode(s);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return 'data:image/svg+xml;base64,' + btoa(bin);
  }

  function renderPreview() {
    if (!previewEl || !ta) return;
    clearTimeout(previewEl._timer);
    const raw = String(o.text == null ? '' : o.text);
    if (!raw.trim()) { previewEl.innerHTML = ''; return; }

    const fs        = o.fontSize || 32;
    const color     = o.color || '#e6edf7';
    const previewFs = Math.min(22, Math.max(13, fs * 0.65));
    const fontCss   = getFontCss(o.fontFamily).replace(/"/g, "'");
    const mathScale = previewFs / 16;

    const parsedLines = parseTextWithMath(raw);
    let html = '';
    let hasPending = false;

    parsedLines.forEach((segments, lineIdx) => {
      if (lineIdx > 0) html += '<br>';
      if (!segments.length) return;
      for (const seg of segments) {
        if (seg.type === 'text') {
          const txt = escapeHtmlSelf(seg.value).replace(/ /g, '&nbsp;');
          html += '<span style="font-family:' + fontCss + ';font-size:' + previewFs +
                  'px;color:' + color + ';line-height:1.5;">' + txt + '</span>';
          continue;
        }
        const key = (seg.display ? 'D:' : 'I:') + seg.latex + '|' + color;
        const rec = __mathSvgCache.get(key);
        if (rec && rec.svgStr) {
          const url = svgStrToDataUrl(rec.svgStr);
          const iw  = Math.max(1, Math.round(rec.pxW * mathScale));
          const ih  = Math.max(1, Math.round(rec.pxH * mathScale));
          html += '<img src="' + url + '" style="width:' + iw + 'px;height:' + ih +
                  'px;vertical-align:middle;margin:0 2px;">';
        } else if (__mathFailed.has(key)) {
          html += '<span style="color:#f87171;font-size:11px;padding:0 4px;">[公式错误]</span>';
        } else {
          hasPending = true;
          getMathImage(seg.latex, seg.display, color);
          html += '<span style="display:inline-block;padding:0 6px;background:rgba(56,189,248,.15);color:#7dd3fc;border-radius:4px;font-size:11px;line-height:1.6;">∑…</span>';
        }
      }
    });

    previewEl.innerHTML = html;
    if (hasPending) {
      previewEl._timer = setTimeout(() => {
        if (textEditorEl && textEditorEl.querySelector('[data-el=preview]') === previewEl) {
          renderPreview();
        }
      }, 100);
    }
  }

  function refresh() {
    measureText(o);
    scheduleRender();
    renderPreview();
  }

  syncBtns();

  /* =====================================================================
   * 集成 moskensoap/latex-formula-editor (iframe 通信方案)
   *   点击 iframe 内的公式按钮 → 立即插入到当前 textarea
   * ===================================================================== */
  const mathCont  = mathPanel.querySelector('.te-math-insert-area');
 

  // 1. 创建 iframe
  const editorFrame = document.createElement('iframe');
  editorFrame.id = 'latexEditorFrame';
  editorFrame.className = 'pb-theme-frame';
  editorFrame.src = 'latex-formula-editor/index.html';
  editorFrame.style.cssText = 'width: 100%; height: 100%; border: none;';
  editorFrame.addEventListener('load', () => {
    try {
      const doc = editorFrame.contentDocument;
      if (doc && !doc.head && doc.documentElement) {
        const head = doc.createElement('head');
        doc.documentElement.insertBefore(head, doc.documentElement.firstChild);
      }
    } catch (e) {}
    syncEmbeddedEditorsTheme();
  });
  mathCont.appendChild(editorFrame);

  // 2. 直接插入公式（由 iframe 点击触发）
  function insertFormulaLatex(latex) {
    if (!latex || !latex.trim()) return;
    const start  = ta.selectionStart, end = ta.selectionEnd;
    const before = ta.value.slice(0, start);
    const after  = ta.value.slice(end);
    const hasOpen = (before.match(/\$/g) || []).length % 2 === 1;
    const payload = hasOpen ? latex : '$' + latex + '$';

    ta.value = before + payload + after;
    const newPos = start + payload.length;
    ta.setSelectionRange(newPos, newPos);

    o.text = ta.value;
    refresh();

    // 插入后保持 focus，方便连续点击插入多个公式
    requestAnimationFrame(() => { try { ta.focus(); } catch (e) {} });
  }

  // 3. 监听 iframe 发来的 insert-formula 消息
  const messageHandler = (event) => {
    if (event.source !== editorFrame.contentWindow) return;
    const d = event.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'insert-formula' && typeof d.latex === 'string') {
      insertFormulaLatex(d.latex);
    }
  };
  window.addEventListener('message', messageHandler);

  // 4. 面板控制
  function openMathPanel() {
    mathPanel.classList.add('show');
    mathToggle.classList.add('on');
  }
  function closeMathPanel() {
    mathPanel.classList.remove('show');
    mathToggle.classList.remove('on');
    window.removeEventListener('message', messageHandler);
    requestAnimationFrame(() => { if (ta) ta.focus(); });
  }

  mathToggle.addEventListener('click', () => {
    if (mathPanel.classList.contains('show')) closeMathPanel();
    else openMathPanel();
  });


  // 输入框和快捷键
  ta.addEventListener('keydown', e => {
    if (e.altKey && (e.key === 'm' || e.key === 'M')) {
      e.preventDefault(); openMathPanel(); return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (mathPanel.classList.contains('show')) closeMathPanel();
      else cancelTextEditor();
      return;
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault(); commitTextEditor();
    }
  });

  ta.addEventListener('input', () => { o.text = ta.value; refresh(); });
  fontSel.addEventListener('change', () => { o.fontFamily = fontSel.value; refresh(); });
  sizeInp.addEventListener('input', () => {
    o.fontSize = Math.max(6, Math.min(400, parseInt(sizeInp.value, 10) || 32));
    refresh();
  });
  colorInp.addEventListener('input', () => { o.color = colorInp.value; refresh(); });

  el.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const b = btn.dataset.b, a = btn.dataset.a;
    if (b === 'ok')     { commitTextEditor(); return; }
    if (b === 'cancel') { cancelTextEditor(); return; }
    if (b === 'bold')      o.bold = !o.bold;
    if (b === 'italic')    o.italic = !o.italic;
    if (b === 'underline') o.underline = !o.underline;
    if (a) o.textAlign = a;
    syncBtns();
    refresh();
    ta.focus();
  });

  /* ---- 首屏 ---- */
  __activeEditorPreviewRefresh = renderPreview;
  renderPreview();

  requestAnimationFrame(() => {
    try { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
  });
}




function positionTextEditor(force) {
  if (!textEditorEl || !textEditTarget) return;

  /* ★ 全屏编辑器不需要计算浮动位置，直接返回 */
  if (textEditorEl.classList.contains('text-editor-fullscreen')) return;

  // 关键：只有首次打开，或视图发生变化时才重新计算位置；
  // 编辑过程中的 resize / 输入 / 回车 一律不动，避免文字框跟着跳
  if (!textEditorAnchor || force) {
    const o = textEditTarget;
    const bb = getWorldBBox(o);
    const sp1 = worldToScreen(bb.x1, bb.y1);
    const sp2 = worldToScreen(bb.x2, bb.y2);

    const w = textEditorEl.offsetWidth || 430;
    const h = textEditorEl.offsetHeight || 160;
    let left = sp1.x;
    let top = sp2.y + 12;
    if (top + h > window.innerHeight - 12) {
      const above = sp1.y - h - 12;
      top = above > 12 ? above : Math.max(12, window.innerHeight - h - 12);
    }
    if (left + w > window.innerWidth - 12) left = window.innerWidth - w - 12;
    if (left < 12) left = 12;
    if (top < 12) top = 12;
    textEditorAnchor = { left, top };
  }

  textEditorEl.style.left = textEditorAnchor.left + 'px';
  textEditorEl.style.top  = textEditorAnchor.top  + 'px';
}


function commitTextEditor() {
document.querySelectorAll('.te-formula-ghost').forEach(n => n.remove());
const ball = document.getElementById('__pb_ball');
if (ball) ball.style.display = 'grid';
  if (committingText) return;
  committingText = true;
__activeEditorPreviewRefresh = null;
  try {
    const el = textEditorEl;
    const o = textEditTarget;
    const isNew = textEditIsNew;
    textEditorEl = null;
    textEditTarget = null;
    textEditIsNew = false;
    if (!el) return;


    el.remove();
textEditorAnchor = null;
    if (!o) { setTool('select'); return; }

    const txt = String(o.text == null ? '' : o.text).replace(/\s+$/, '');

    if (!txt) {
      objects = objects.filter(x => x !== o);
      pages[pageIndex] = objects;
      selection = selection.filter(x => x !== o);
      setTool('select');
      updateSelBar(); render(); drawPreview();
      return;
    }

    o.text = txt;
    measureText(o);

    state.textFontFamily = o.fontFamily || 'system';
    state.textSize = o.fontSize || 32;
    state.textBold = !!o.bold;
    state.textItalic = !!o.italic;
    state.textUnderline = !!o.underline;

    pushSnapshot();

    if (isNew) selection = [o];
    else if (selection.indexOf(o) < 0) selection = [o];

    setTool('select');

    updateSelBar(); render(); drawPreview();
  } finally {
    committingText = false;
  }
}

function cancelTextEditor() {
document.querySelectorAll('.te-formula-ghost').forEach(n => n.remove());
const ball = document.getElementById('__pb_ball');
if (ball) ball.style.display = 'grid';
__activeEditorPreviewRefresh = null;
  const el = textEditorEl;
  const o = textEditTarget;
  const isNew = textEditIsNew;
  const orig = textEditOriginalText;
  textEditorEl = null;
  textEditTarget = null;
  textEditIsNew = false;


  if (el) el.remove();
textEditorAnchor = null;
  if (!o) { setTool('select'); return; }

  if (isNew) {
    objects = objects.filter(x => x !== o);
    pages[pageIndex] = objects;
  } else {
    o.text = orig;
    measureText(o);
  }

  selection = selection.filter(x => x !== o);

  setTool('select');

  updateSelBar(); render(); drawPreview();
}

function toHexColor(c) {
  if (!c) return '#ffffff';
  if (c[0] === '#') {
    if (c.length === 4) return '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3];
    return c.slice(0, 7);
  }
  const m = String(c).match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) {
    const h = n => (+n).toString(16).padStart(2, '0');
    return '#' + h(m[1]) + h(m[2]) + h(m[3]);
  }
  return '#ffffff';
}

/* =====================================================================
 * 17c. 组合为新图形
 * ===================================================================== */
(function () { try { idbGet('shapesJsHandle').then(h => { if (h) cachedShapesHandle = h; }); } catch (e) {} })();
const CS_FILE = 'custom-shapes.json';
let __csCache = null;

const __fsFallback = {
  readFile:   async n => localStorage.getItem('__pb_' + n),
  writeFile:  async (n, v) => localStorage.setItem('__pb_' + n, v),
  getAppDir:  async () => ''
};
function csReadFS() {
  return window.__pbFS || __fsFallback;
}

async function csLoadAll() {
  if (__csCache) return __csCache;
  const fs = csReadFS();
  const text = await fs.readFile(CS_FILE);
  if (!text) { __csCache = []; return __csCache; }
  try {
    __csCache = JSON.parse(text) || [];
  } catch (e) {
    try { await fs.writeFile(CS_FILE + '.bak', text); } catch (_) {}
    __csCache = [];
  }
  return __csCache;
}

async function csSaveRecord(rec) {
  const list = await csLoadAll();
  const i = list.findIndex(r => r.id === rec.id);
  if (i >= 0) list[i] = rec; else list.push(rec);
  __csCache = list;
  const fs = csReadFS();
  await fs.writeFile(CS_FILE, JSON.stringify(list, null, 2));
}

async function csDeleteRecord(id) {
  const list = await csLoadAll();
  __csCache = list.filter(r => r.id !== id);
  const fs = csReadFS();
  await fs.writeFile(CS_FILE, JSON.stringify(__csCache, null, 2));
}

async function csRestoreAll() {
  const records = await csLoadAll();
  if (!records.length) return;
  let hasNewCat = false;
  for (const rec of records) {
    if (PB.shapes[rec.id]) continue;
    if (rec.catId) {
      const exists = (PB.categories || []).some(c => c.id === rec.catId);
      if (!exists) {
        ensureCategory(rec.catId, rec.catLabel || rec.catId);
        hasNewCat = true;
      }
    }
    PB.shapes[rec.id] = buildCustomDef({
      id: rec.id, label: rec.label,
      cat: rec.catId || 'custom',
      baseW: rec.baseW, baseH: rec.baseH,
      parts: rec.parts, icon: rec.icon
    });
  }
  if (hasNewCat) buildShapePanel();
  render();
}
function bakeRotation(t) {
  const rot = t.rotation || 0;
  if (!rot) return t;
  const b = getBBox(t);
  const c = { x:(b.x1+b.x2)/2, y:(b.y1+b.y2)/2 };
  if (t.points) t.points = t.points.map(p => rotatePt(p, c, rot));
  if (t.x1 !== undefined) {
    const a = rotatePt({x:t.x1,y:t.y1}, c, rot);
    const d = rotatePt({x:t.x2,y:t.y2}, c, rot);
    t.x1=a.x; t.y1=a.y; t.x2=d.x; t.y2=d.y;
  }
  if (isTextObj(t)) {
    const p = rotatePt({ x:t.x, y:t.y }, c, rot); t.x = p.x; t.y = p.y;
  }
  t.rotation = 0;
  return t;
}
function normalizePart(o, bx, by, bw, bh) {
  const t = copyObj(o);
  delete t._mask; delete t._maskPad; delete t._img; delete t._videoEl;
  bakeRotation(t);
  const nx = v => (v - bx) / bw, ny = v => (v - by) / bh;
  if (t.points) t.points = t.points.map(p => ({ x:nx(p.x), y:ny(p.y) }));
  if (t.x1 !== undefined) {
    t.x1 = nx(t.x1); t.y1 = ny(t.y1); t.x2 = nx(t.x2); t.y2 = ny(t.y2);
  }
  if (isTextObj(t)) {
    t.x = nx(t.x); t.y = ny(t.y);
    t.fontSize = (t.fontSize || 24) / bh;
    delete t.tw; delete t.th;
  }
  delete t.rotation;
  delete t.animT; delete t.animPlaying; delete t.animSpeed;
  return t;
}
function makeCustomRecord(id, label, catId, objs, icon) {
  const bb = unionBBox(objs);
  const bw = Math.max(1, bb.x2 - bb.x1), bh = Math.max(1, bb.y2 - bb.y1);
  const parts = objs.map(o => normalizePart(o, bb.x1, bb.y1, bw, bh));
  return { id, label, cat: catId, baseW: bw, baseH: bh, parts, icon: icon || CUSTOM_ICON };
}
function generateIconDataURL(rec, targetSize) {
  targetSize = targetSize || 56;
  const dprI = 2, S = Math.round(targetSize * dprI);
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const c = cv.getContext('2d');
  c.lineCap = 'round'; c.lineJoin = 'round';
  const pad = S * 0.14;
  const W2 = S - pad * 2, H2 = S - pad * 2;
  const scale = Math.min(W2 / rec.baseW, H2 / rec.baseH);
  const bw = rec.baseW * scale, bh = rec.baseH * scale;
  const offsetX = (S - bw) / 2, offsetY = (S - bh) / 2;
  const toX = nx => offsetX + nx * bw, toY = ny => offsetY + ny * bh;
  const prevCur = U._cur;
  try {
    for (const p of rec.parts) {
      const def = PB.shapes[p.type];
      if (!def || !def.draw) continue;
      const tmp = Object.assign({}, p);
      tmp.size = Math.max(1, (p.size || 4) * scale);
      if (p.points) tmp.points = p.points.map(q => ({ x: toX(q.x), y: toY(q.y) }));
      if (p.x1 !== undefined) {
        tmp.x1 = toX(p.x1); tmp.y1 = toY(p.y1);
        tmp.x2 = toX(p.x2); tmp.y2 = toY(p.y2);
      }
      if (isTextObj(p)) {
        tmp.x = toX(p.x); tmp.y = toY(p.y);
        tmp.fontSize = Math.max(4, (p.fontSize || 0.15) * bh);
        tmp.tw = null; tmp.th = null;
        measureText(tmp);
      }
      c.save();
      c.lineWidth = tmp.size;
      c.strokeStyle = tmp.color || '#e6edf7';
      if (tmp.fill) c.fillStyle = U.alpha(tmp.color || '#e6edf7', 0.16);
      const prevU = U._cur;
      U._cur = tmp;
      try { def.draw(c, tmp, U); } catch (err) {} finally { U._cur = prevU; }
      c.restore();
    }
  } finally { U._cur = prevCur; }
  try { return cv.toDataURL('image/png'); } catch (e) { return CUSTOM_ICON; }
}
function buildCustomDef(rec) {
  return {
    key: rec.id, cat: rec.cat, geom: 'rect',
    label: rec.label, icon: rec.icon || CUSTOM_ICON,
    custom: true, baseW: rec.baseW, baseH: rec.baseH, parts: rec.parts,
    draw(c, o, U2) {
      const w = o.x2 - o.x1, h = o.y2 - o.y1;
      const aw = Math.abs(w), ah = Math.abs(h);
      if (aw < 1 || ah < 1) return;
      const k = Math.min(aw / this.baseW, ah / this.baseH);
      const X = nx => o.x1 + nx * w, Y = ny => o.y1 + ny * h;
      const overrideFill = (o.fillColor && o.color && o.fillColor !== o.color) ? o.fillColor : null;
      for (const p of this.parts) {
        const def = PB.shapes[p.type];
        if (!def || !def.draw) continue;
        const tmp = Object.assign({}, p);
        tmp.size = Math.max(0.4, (p.size || 4) * k);
        if (p.points) tmp.points = p.points.map(q => ({ x:X(q.x), y:Y(q.y) }));
        if (p.x1 !== undefined) {
          tmp.x1 = X(p.x1); tmp.y1 = Y(p.y1);
          tmp.x2 = X(p.x2); tmp.y2 = Y(p.y2);
        }
        if (isTextObj(p)) {
          tmp.x = X(p.x); tmp.y = Y(p.y);
          tmp.fontSize = Math.max(6, (p.fontSize || 0.15) * ah);
          tmp.tw = null; tmp.th = null;
          measureText(tmp);
        }
        if (overrideFill) tmp.fillColor = overrideFill;
        c.save();
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.lineWidth = tmp.size;
        c.strokeStyle = (o.hasBorder === false) ? 'rgba(0,0,0,0)' : (tmp.color || '#e6edf7');
        if (tmp.fill) c.fillStyle = U2.alpha(tmp.color || '#e6edf7', 0.16);
        const prevU = U2._cur;
        U2._cur = tmp;
        try { def.draw(c, tmp, U2); } catch (err) {} finally { U2._cur = prevU; }
        c.restore();
      }
    }
  };
}

/* ---- 组合弹窗 UI ---- */
const groupModal = document.getElementById('groupModal');
const gmName = document.getElementById('gmName');
const gmCat = document.getElementById('gmCat');
const gmNewCatField = document.getElementById('gmNewCatField');
const gmCatId = document.getElementById('gmCatId');
const gmCatLabel = document.getElementById('gmCatLabel');
const gmCount = document.getElementById('gmCount');
const gmTip = document.getElementById('gmTip');
const gmOk = document.getElementById('gmOk');
const gmCancel = document.getElementById('gmCancel');
const gmIconPrev = document.getElementById('gmIconPreview');

let gmSelection = [];
let gmPreviewRec = null;

function countCustomShapes() {
  let n = 0;
  for (const k in PB.shapes) if (PB.shapes[k].custom) n++;
  return n;
}
function refreshGmIconPreview() {
  const choice = (document.querySelector('input[name=gmIcon]:checked') || {}).value || 'auto';
  if (choice === 'generic' || !gmPreviewRec) {
    gmIconPrev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + CUSTOM_ICON + '</svg>';
    return;
  }
  let url = CUSTOM_ICON;
  try { url = generateIconDataURL(gmPreviewRec, 56); } catch (e) { url = CUSTOM_ICON; }
  if (typeof url === 'string' && url.slice(0, 11) === 'data:image/') {
    gmIconPrev.innerHTML = '<img src="' + url + '" alt="">';
  } else {
    gmIconPrev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + CUSTOM_ICON + '</svg>';
  }
}
function updateGmTip() {
  gmTip.innerHTML = '组合图形保存在程序目录下的 <b>custom-shapes.json</b>，重启后仍然可用。';
  gmOk.textContent = '保存';
}
function openGroupModal() {
  if (selection.length < 2) { toast('请先选中至少两个图形'); return; }
  gmSelection = selection.slice();
  gmPreviewRec = null;
  ensureCategory('custom', '自定义');
  gmCount.textContent = gmSelection.length + ' 个';
  const cats = getCategories();
  gmCat.innerHTML = '';
  let hasCustom = false;
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.label;
    gmCat.appendChild(opt);
    if (c.id === 'custom') hasCustom = true;
  });
  const newOpt = document.createElement('option');
  newOpt.value = '__new__'; newOpt.textContent = '＋ 新建类别…';
  gmCat.appendChild(newOpt);
  gmCat.value = hasCustom ? 'custom' : (cats[0] ? cats[0].id : '__new__');
  gmNewCatField.style.display = gmCat.value === '__new__' ? 'block' : 'none';
  gmName.value = '自定义图形 ' + (countCustomShapes() + 1);
  gmCatId.value = ''; gmCatLabel.value = '';
  const autoRadio = document.querySelector('input[name=gmIcon][value=auto]');
  if (autoRadio) autoRadio.checked = true;
  try { gmPreviewRec = makeCustomRecord('preview', 'preview', 'preview', gmSelection); }
  catch (e) { gmPreviewRec = null; }
  refreshGmIconPreview();

  updateGmTip();
  openModal('groupModal');
  setTimeout(() => { try { gmName.focus(); gmName.select(); } catch (e) {} }, 60);
}
gmCat.addEventListener('change', () => {
  gmNewCatField.style.display = gmCat.value === '__new__' ? 'block' : 'none';
  if (gmCat.value === '__new__') setTimeout(() => gmCatId.focus(), 30);
});

document.querySelectorAll('input[name=gmIcon]').forEach(m => m.addEventListener('change', refreshGmIconPreview));
gmCancel.addEventListener('click', () => closeModal('groupModal'));
gmOk.addEventListener('click', async () => {
  const label = (gmName.value || '').trim();
  if (!label) { toast('请填写图形名称'); gmName.focus(); return; }
  let catId, catLabel, isNewCat = false;
  if (gmCat.value === '__new__') {
    catId = (gmCatId.value || '').trim();
    catLabel = (gmCatLabel.value || '').trim() || catId;
    if (!catId) { toast('请填写新类别 ID'); gmCatId.focus(); return; }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(catId)) {
      toast('类别 ID 只能用英文字母、数字、下划线，且不能以数字开头');
      gmCatId.focus(); return;
    }
    isNewCat = !PB.categories.some(c => c.id === catId);
  } else {
    catId = gmCat.value;
    const found = (PB.categories || []).find(c => c.id === catId);
    catLabel = found ? found.label : catId;
  }
  const iconChoice = (document.querySelector('input[name=gmIcon]:checked') || {}).value || 'auto';
  const id = 'cs_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const rec = makeCustomRecord(id, label, catId, gmSelection);
  rec.icon = (iconChoice === 'auto') ? generateIconDataURL(rec, 56) : CUSTOM_ICON;
  gmOk.disabled = true;
  const oldText = gmOk.textContent;
  gmOk.textContent = '处理中…';
  try {
    await csSaveRecord({
      id: rec.id,
      label: rec.label,
      catId: catId,
      catLabel: catLabel,
      baseW: rec.baseW,
      baseH: rec.baseH,
      parts: rec.parts,
      icon: rec.icon
    });
    ensureCategory(catId, catLabel);
    PB.shapes[rec.id] = buildCustomDef(rec);
    const used = gmSelection.slice();
    objects = objects.filter(o => used.indexOf(o) < 0);
    pages[pageIndex] = objects;
    selection = [];
    pushSnapshot();
    updateSelBar(); render(); drawPreview();
    state.shapeCat = catId;
    buildShapePanel();
    setTool(rec.id);
    closeModal('groupModal');
    toast('已保存到本机 ✓（刷新后仍然可用）', 3000);
  } catch (err) {
    console.error(err);
    toast('操作失败：' + (err && err.message ? err.message : err), 3400);
  } finally {
    gmOk.disabled = false;
    gmOk.textContent = oldText;
  }
});
document.getElementById('tagGroup').addEventListener('click', () => {
  if (selection.length < 2) { toast('请先选中至少两个图形'); return; }
  openGroupModal();
});

/* =====================================================================
 * 17d. 图形库管理
 * ===================================================================== */
const libModal = document.getElementById('libModal');
const libFileInfo = document.getElementById('libFileInfo');
const libFilter = document.getElementById('libFilter');
const libCat = document.getElementById('libCat');
const libSearch = document.getElementById('libSearch');   // ← 新增
const libList = document.getElementById('libList');
const libDelete = document.getElementById('libDelete');
const libConfirm = document.getElementById('libConfirm');
const libConfirmBody = document.getElementById('libConfirmBody');

let libHandle = null, libText = null, libBlocks = [];
let libSelected = new Set();

const HIDDEN_LS_KEY = 'pb_hidden_shapes';
let libHidden = (function () {
  try {
    const raw = localStorage.getItem(HIDDEN_LS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) { return new Set(); }
})();
let originalHiddenKeys = new Set();

function saveLibHidden() {
  try { localStorage.setItem(HIDDEN_LS_KEY, JSON.stringify([...libHidden])); } catch (e) {}
}
function collectOriginalHidden() {
  originalHiddenKeys = new Set();
  for (const k in PB.shapes) {
    if (PB.shapes[k].hidden) originalHiddenKeys.add(k);
  }
  let changed = false;
  for (const k of Array.from(libHidden)) {
    if (!PB.shapes[k]) { libHidden.delete(k); changed = true; }
  }
  if (changed) saveLibHidden();
}
function applyLibHidden() {
  for (const k in PB.shapes) {
    const s = PB.shapes[k];
    if (s.cat === '__sys') continue;
    if (libHidden.has(k) || originalHiddenKeys.has(k)) s.hidden = true;
    else s.hidden = false;
  }
}

const ICON_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16"/><path d="M9.6 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.3 17.3 0 0 1-3.4 4.2"/><path d="M6.2 7.7A17.4 17.4 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

function findShapeBlocks(text) {
  const blocks = []; const N = text.length;
  let i = 0;
  while (i < N) {
    const idx = text.indexOf('shape', i);
    if (idx < 0) break;
    const before = idx > 0 ? text[idx - 1] : '';
    if (before && /[A-Za-z0-9_$.]/.test(before)) { i = idx + 5; continue; }
    let j = idx + 5;
    while (j < N && /\s/.test(text[j])) j++;
    if (text[j] !== '(') { i = idx + 5; continue; }
    j++;
    let braceStart = -1, k = j;
    while (k < N) { const ch = text[k];
      if (ch === '{') { braceStart = k; break; }
      if (ch === ')' || ch === ';') break; k++; }
    if (braceStart < 0) { i = idx + 5; continue; }
    let depth = 0, inString = null, escaped = false, inLine = false, inBlock = false, braceEnd = -1;
    let m = braceStart;
    for (; m < N; m++) {
      const ch = text[m], nx = text[m + 1];
      if (inLine) { if (ch === '\n') inLine = false; continue; }
      if (inBlock) { if (ch === '*' && nx === '/') { inBlock = false; m++; } continue; }
      if (inString) {
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === inString) inString = null; continue;
      }
      if (ch === '/' && nx === '/') { inLine = true; m++; continue; }
      if (ch === '/' && nx === '*') { inBlock = true; m++; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { inString = ch; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { braceEnd = m; break; } }
    }
    if (braceEnd < 0) { i = idx + 5; continue; }
    let endPos = braceEnd + 1;
    while (endPos < N && /\s/.test(text[endPos])) endPos++;
    if (text[endPos] === ')') endPos++;
    while (endPos < N && /\s/.test(text[endPos])) endPos++;
    if (text[endPos] === ';') endPos++;
    const inner = text.slice(braceStart, braceEnd + 1);
    const keyM = inner.match(/\bkey\s*:\s*["'`]([^"'`]+)["'`]/);
    const labelM = inner.match(/\blabel\s*:\s*["'`]([^"'`]+)["'`]/);
    const catM = inner.match(/\bcat\s*:\s*["'`]([^"'`]+)["'`]/);
    const custM = /\bcustom\s*:\s*true\b/.test(inner);
    const animM = /\banimatable\s*:\s*true\b/.test(inner);
    if (keyM) blocks.push({ start: idx, end: endPos, key: keyM[1],
      label: labelM ? labelM[1] : keyM[1], cat: catM ? catM[1] : '',
      custom: custM, animatable: animM });
    i = endPos;
  }
  return blocks;
}
function getBlockDeleteRange(text, block, prevEnd) {
  let start = block.start; let s = start;
  while (s > prevEnd && /\s/.test(text[s - 1])) s--;
  if (s >= 2 && text[s - 1] === '/' && text[s - 2] === '*') {
    let e = s - 2;
    while (e > prevEnd && !(text[e] === '*' && text[e - 1] === '/')) e--;
    if (e > prevEnd) start = e - 1;
  } else {
    let lineStart = s;
    while (lineStart > prevEnd && text[lineStart - 1] !== '\n') lineStart--;
    const lineText = text.slice(lineStart, s).trim();
    if (lineText.startsWith('//')) start = lineStart;
  }
  return { start, end: block.end };
}
function getLibItems() {
  const items = [];
  for (const key in PB.shapes) {
    const s = PB.shapes[key];
    if (s.cat === '__sys') continue;
    if (s.hidden && !libHidden.has(key)) continue;
    const isSelf = !!s._selfFile;
    const isCustom = !!s.custom;
    items.push({
      key, label: s.label || key, cat: s.cat || '',
      custom: isCustom,
      selfFile: isSelf,
      deletable: isCustom || isSelf,
      animatable: !!s.animatable,
      icon: s.icon || '',
      inFile: libBlocks.some(b => b.key === key),
      hidden: libHidden.has(key)
    });
  }
  return items;
}
function libMatches(it) {
  const f = libFilter.value;
  const c = libCat.value;

  if (c !== 'all' && it.cat !== c) return false;

  /* ===== 类型筛选：拆分出「组合模型」与「开发者模型」 ===== */
  if (f === 'combo'   && !it.custom) return false;                       // 仅组合模型
  if (f === 'dev'     && !it.selfFile) return false;                     // 仅开发者模型
  if (f === 'custom'  && !it.custom && !it.selfFile) return false;       // 兼容旧值
  if (f === 'builtin' && (it.custom || it.selfFile || it.animatable)) return false;
  if (f === 'anim'    && !it.animatable) return false;

  /* ===== 关键词搜索：名称 / key / 类别（不区分大小写）===== */
  const q = (libSearch.value || '').trim().toLowerCase();
  if (q) {
    const hay = (it.label + ' ' + it.key + ' ' + (it.cat || '')).toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  return true;
}
function refreshLibCatOptions() {
  const cur = libCat.value || 'all';
  const seen = new Set();
  const opts = [];
  const cats = (Array.isArray(PB.categories) ? PB.categories : []).filter(c => c.id !== '__sys');
  cats.forEach(c => {
    if (!seen.has(c.id)) { seen.add(c.id); opts.push({ id: c.id, label: c.label || c.id }); }
  });
  for (const key in PB.shapes) {
    const s = PB.shapes[key];
    if (s.cat === '__sys' || !s.cat) continue;
    if (!seen.has(s.cat)) { seen.add(s.cat); opts.push({ id: s.cat, label: s.cat }); }
  }
  libCat.innerHTML = '<option value="all">全部类别</option>';
  opts.forEach(o => {
    const op = document.createElement('option');
    op.value = o.id; op.textContent = o.label;
    libCat.appendChild(op);
  });
  libCat.value = (cur === 'all' || seen.has(cur)) ? cur : 'all';
}
function toggleLibHide(key) {
  const s = PB.shapes[key];
  if (!s) return;
  const willHide = !libHidden.has(key);
  if (willHide) {
    libHidden.add(key);
    s.hidden = true;
    if (state.tool === key) setTool('pen', true);
  } else {
    libHidden.delete(key);
    s.hidden = false;
  }
  saveLibHidden();
  buildShapePanel();
  renderLibList();
  toast(willHide
    ? '已隐藏：' + (s.label || key) + '（已记住，刷新后仍保持）'
    : '已恢复显示：' + (s.label || key));
}
function renderLibList() {
  refreshLibCatOptions();
  const items = getLibItems().filter(libMatches);
  libList.innerHTML = '';
  const frag = document.createDocumentFragment();

  for (const it of items) {
    const row = document.createElement('div');
    row.className = 'lib-item' + (libSelected.has(it.key) ? ' sel' : '') +
                    (it.hidden ? ' is-hidden' : '') + (it.deletable ? '' : ' locked');
    row.dataset.key = it.key;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = libSelected.has(it.key);
    cb.disabled = !it.deletable;
    cb.title = it.deletable
      ? (it.selfFile ? '勾选后可删除（会从 shapes-self.js 移除对应代码块）' : '勾选后可删除')
      : '内置 / 动画图形不可删除，可点右侧按钮隐藏';
    cb.addEventListener('change', () => {
      if (cb.checked) libSelected.add(it.key); else libSelected.delete(it.key);
      row.classList.toggle('sel', cb.checked);
      updateLibDeleteBtn();
    });

    const iconWrap = document.createElement('span');
    iconWrap.className = 'lib-item-icon';
    iconWrap.innerHTML = renderShapeIcon(it.icon);

    const name = document.createElement('span');
    name.className = 'lib-item-name'; name.textContent = it.label;

    const keyEl = document.createElement('span');
    keyEl.className = 'lib-item-key'; keyEl.textContent = it.key; keyEl.title = it.key;

    const catEl = document.createElement('span');
    catEl.className = 'lib-item-cat'; catEl.textContent = it.cat;

       const tag = document.createElement('span');
    if (it.selfFile)        { tag.className = 'lib-item-tag self';    tag.textContent = '开发者'; }
    else if (it.custom)     { tag.className = 'lib-item-tag custom';  tag.textContent = '组合'; }
    else if (it.animatable) { tag.className = 'lib-item-tag anim';    tag.textContent = '动画'; }
    else                    { tag.className = 'lib-item-tag builtin'; tag.textContent = '内置'; }

    const hideBtn = document.createElement('button');
    hideBtn.type = 'button';
    hideBtn.className = 'lib-hide-btn' + (it.hidden ? ' on' : '');
    hideBtn.title = it.hidden
      ? '取消隐藏，重新显示在图形面板'
      : '隐藏：不显示在图形面板（状态会被记住，刷新后仍隐藏）';
    hideBtn.innerHTML = it.hidden ? ICON_EYE_OFF : ICON_EYE;
    hideBtn.addEventListener('click', ev => {
      ev.stopPropagation(); ev.preventDefault();
      toggleLibHide(it.key);
    });

    row.append(cb, iconWrap, name, keyEl, catEl, tag, hideBtn);

    row.addEventListener('click', ev => {
      if (ev.target === cb || ev.target.closest('.lib-hide-btn')) return;
      if (!it.deletable) {
        toast('内置 / 动画图形不可删除，可点右侧按钮隐藏');
        return;
      }
      if (cb.checked) { libSelected.delete(it.key); cb.checked = false; }
      else { libSelected.add(it.key); cb.checked = true; }
      row.classList.toggle('sel', cb.checked);
      updateLibDeleteBtn();
    });

    frag.appendChild(row);
  }
  libList.appendChild(frag);
  updateLibDeleteBtn();
}
function updateLibDeleteBtn() {
  for (const k of Array.from(libSelected)) {
    const s = PB.shapes[k];
    if (!s || (!s.custom && !s._selfFile)) libSelected.delete(k);
  }
  const n = libSelected.size;
  libDelete.disabled = n === 0;
  libDelete.textContent = n > 0 ? '删除选中 (' + n + ')' : '删除选中';
}
async function tryAutoLoadCachedFile() {
  if (libHandle && libText != null) return;
  if (!cachedShapesHandle) return;
  try {
    const opts = { mode: 'readwrite' };
    let perm = await cachedShapesHandle.queryPermission(opts);
    if (perm === 'prompt') perm = await cachedShapesHandle.requestPermission(opts);
    if (perm !== 'granted') return;
    const f = await cachedShapesHandle.getFile();
    libHandle = cachedShapesHandle;
    libText = await f.text();
    libBlocks = findShapeBlocks(libText);
    libFileInfo.textContent = '已加载：' + (libHandle.name || 'shapes.js') +
      '（识别到 ' + libBlocks.length + ' 个 shape）';
    libFileInfo.classList.add('loaded');
    renderLibList();
  } catch (e) {}
}
function openLibModal() {
  libSelected.clear();
  libFilter.value = 'all';
  libCat.value = 'all';
  libSearch.value = '';           // ← 新增：清空搜索
  refreshLibCatOptions();
  libConfirm.classList.remove('show');
  if (libHandle && libText != null) {
    libBlocks = findShapeBlocks(libText);
    libFileInfo.textContent = '已加载：' + (libHandle.name || 'shapes.js') +
      '（识别到 ' + libBlocks.length + ' 个 shape）';
    libFileInfo.classList.add('loaded');
  } else if (cachedShapesHandle) {
    libFileInfo.textContent = '记忆文件：' + (cachedShapesHandle.name || 'shapes.js') + '（正在尝试自动加载…）';
    libFileInfo.classList.remove('loaded'); libBlocks = [];
  } else {
    libFileInfo.textContent = '图形库从云端加载';
    libFileInfo.classList.remove('loaded'); libBlocks = [];
  }
  renderLibList();
  openModal('libModal');
  tryAutoLoadCachedFile();
}
function closeLibModal() { closeModal('libModal'); libConfirm.classList.remove('show'); }
document.getElementById('libCancel').addEventListener('click', closeLibModal);

document.getElementById('libPickFile').addEventListener('click', async () => {
  if (!window.showOpenFilePicker) { alert('当前浏览器不支持直接写入文件（请用 Chrome / Edge）。'); return; }
  let handle = null;
  try {
    const opts = {
      types: [{ description: 'JavaScript 文件', accept: { 'text/javascript': ['.js'] } }],
      excludeAcceptAllOption: false, multiple: false
    };
    const last = libHandle || cachedShapesHandle;
    if (last) opts.startIn = last; else opts.startIn = 'documents';
    [handle] = await window.showOpenFilePicker(opts);
  } catch (e) { return; }
  try {
    const file = await handle.getFile();
    const text = await file.text();
    if (text.indexOf('PhysBoard') < 0) {
      if (!confirm('选中的文件里没有发现 PhysBoard 相关代码，确定继续吗？')) return;
    }
    libHandle = handle; libText = text;
    libBlocks = findShapeBlocks(text);
    cachedShapesHandle = handle;
    await idbSet('shapesJsHandle', handle);
    libFileInfo.textContent = '已加载：' + (handle.name || 'shapes.js') + '（识别到 ' + libBlocks.length + ' 个 shape）';
    libFileInfo.classList.add('loaded');
    renderLibList();
    toast('已加载 ' + handle.name + '，识别到 ' + libBlocks.length + ' 个图形定义');
  } catch (err) { alert('读取文件失败：' + (err && err.message ? err.message : err)); }
});

libFilter.addEventListener('change', renderLibList);
libCat.addEventListener('change', renderLibList);
libSearch.addEventListener('input', renderLibList);   // ← 新增：实时搜索

document.getElementById('libSelAll').addEventListener('click', () => {
  for (const it of getLibItems()) {
    if (!libMatches(it)) continue;
    if (!it.custom && !it.selfFile) continue;   // 只选可删除的（组合 + 开发者）
    libSelected.add(it.key);
  }
  renderLibList();
});
document.getElementById('libSelNone').addEventListener('click', () => {
  libSelected.clear();
  renderLibList();
});

libDelete.addEventListener('click', () => {
  if (!libSelected.size) return;
  const keys = Array.from(libSelected);
  const all = getLibItems();
  const delItems = keys.map(k => {
    const found = all.find(it => it.key === k);
    if (found) return found;
    const s = PB.shapes[k];
    return {
      key: k, label: (s && s.label) || k, cat: (s && s.cat) || '',
      selfFile: !!(s && s._selfFile),
      custom: !!(s && s.custom),
      animatable: !!(s && s.animatable),
      inFile: false
    };
  });
  const usedCount = objects.filter(o => keys.indexOf(o.type) >= 0).length;

  const customCount = delItems.filter(it => it.custom).length;
  const selfCount   = delItems.filter(it => it.selfFile).length;

  let html = '即将删除 <b>' + delItems.length + '</b> 个自定义图形定义：<ul class="del-list">';
  for (const it of delItems) {
    let tagText = '';
    if (it.selfFile) tagText = '[开发者模型 · ' + escapeHtml(it.key) + ']';
    else if (it.custom) tagText = '[组合模型 · ' + escapeHtml(it.key) + ']';
    html += '<li>' + escapeHtml(it.label) +
            ' <span style="color:#97a3b6;font-size:11px;">' + tagText + '</span></li>';
  }
  html += '</ul>';

  if (selfCount > 0) {
    html += '<div style="margin-top:10px;color:#b8c7de;">· <b>' + selfCount +
            '</b> 个来自 <b>shapes-self.js</b>，会从该文件移除对应代码块。</div>';
  }
  if (customCount > 0) {
    html += '<div style="margin-top:10px;color:#b8c7de;">· <b>' + customCount +
            '</b> 个为组合图形，会从本机组合记录中移除。</div>';
  }
  if (usedCount > 0) {
    html += '<div style="margin-top:10px;color:#fca5a5;">⚠ 画布上有 <b>' + usedCount +
            '</b> 个对象正在使用这些图形，将一并删除。</div>';
  }
  html += '<div style="margin-top:10px;color:#97a3b6;font-size:12px;">此操作可用 Ctrl+Z 撤销画布变化；但文件修改不可撤销。</div>';
  libConfirmBody.innerHTML = html;
  libConfirm.classList.add('show');
});

document.getElementById('libConfirmBack').addEventListener('click', () => libConfirm.classList.remove('show'));

document.getElementById('libConfirmOk').addEventListener('click', async () => {
  const keys = Array.from(libSelected).filter(k => {
    const s = PB.shapes[k];
    return s && (s.custom || s._selfFile);
  });
  if (!keys.length) { libConfirm.classList.remove('show'); return; }

  const customKeys   = keys.filter(k => PB.shapes[k].custom);
  const selfFileKeys = keys.filter(k => PB.shapes[k]._selfFile);

  const okBtn = document.getElementById('libConfirmOk');
  okBtn.disabled = true;
  const oldText = okBtn.textContent; okBtn.textContent = '处理中…';

  try {
    let fileModified = false;
    let missingKeys = [];

    /* ---------- 1) 组合图形（原逻辑不动） ---------- */
    if (customKeys.length > 0) {
      let handle = libHandle || null;
      if (!handle && cachedShapesHandle) {
        try {
          const opts = { mode: 'readwrite' };
          let perm = await cachedShapesHandle.queryPermission(opts);
          if (perm === 'prompt') perm = await cachedShapesHandle.requestPermission(opts);
          if (perm === 'granted') handle = cachedShapesHandle;
        } catch (e) {}
      }

      if (handle) {
        let text = null;
        try {
          const f = await handle.getFile();
          text = await f.text();
        } catch (e) { text = libText; }

        if (typeof text === 'string') {
          const blocks = findShapeBlocks(text);
          const present = {};
          for (const b of blocks) present[b.key] = true;
          missingKeys = customKeys.filter(k => !present[k]);

          const toDel = blocks.filter(b => customKeys.indexOf(b.key) >= 0);
          toDel.sort((a, b) => b.start - a.start);
          for (const b of toDel) {
            const idxInBlocks = blocks.indexOf(b);
            const prevEnd = idxInBlocks > 0 ? blocks[idxInBlocks - 1].end : 0;
            const range = getBlockDeleteRange(text, b, prevEnd);
            text = text.slice(0, range.start) + text.slice(range.end);
          }

          const w = await handle.createWritable();
          await w.write(text);
          await w.close();

          fileModified = true;
          libHandle = handle;
          libText = text;
          libBlocks = findShapeBlocks(text);
          cachedShapesHandle = handle;
          try { await idbSet('shapesJsHandle', handle); } catch (e) {}
        }
      }

      for (const k of customKeys) {
        libHidden.delete(k);
        delete PB.shapes[k];
        await csDeleteRecord(k);
      }
    }

    /* ---------- 2) 来自 shapes-self.js 的图形 ---------- */
    let selfFileModified = false;
    if (selfFileKeys.length > 0) {
      try {
        await deleteSelfFileShapes(selfFileKeys);
        selfFileModified = true;
      } catch (e) {
        console.error('[删除 shapes-self.js 失败]', e);
      }
      for (const k of selfFileKeys) {
        libHidden.delete(k);
        delete PB.shapes[k];
      }
    }

    saveLibHidden();

    /* ---------- 3) 清理画布对象 ---------- */
    const before = objects.length;
    objects = objects.filter(o => keys.indexOf(o.type) < 0);
    selection = selection.filter(o => objects.indexOf(o) >= 0);
    const removedObjs = before - objects.length;
    if (keys.indexOf(state.tool) >= 0) setTool('pen', true);

    /* ---------- 4) 修正当前类别 ---------- */
    let hasCurrentCat = false;
    for (const k in PB.shapes) {
      if (PB.shapes[k].cat === state.shapeCat && !PB.shapes[k].hidden) {
        hasCurrentCat = true; break;
      }
    }
    if (!hasCurrentCat) {
      for (const c of getCategories()) {
        for (const k in PB.shapes) {
          if (PB.shapes[k].cat === c.id && !PB.shapes[k].hidden) {
            state.shapeCat = c.id; hasCurrentCat = true; break;
          }
        }
        if (hasCurrentCat) break;
      }
    }

    pushSnapshot();
    buildShapePanel();
    updateSelBar(); render(); drawPreview();
    libSelected.clear(); libConfirm.classList.remove('show'); renderLibList();

    /* ---------- 5) 汇总提示 ---------- */
    let msg = '已删除 ' + keys.length + ' 个图形定义';
    if (customKeys.length > 0) {
      msg += '（组合 ' + customKeys.length + ' 个';
      if (fileModified) msg += '，shapes.js 已更新';
      if (missingKeys.length) msg += '，' + missingKeys.length + ' 个未在文件里';
      msg += '）';
    }
    if (selfFileKeys.length > 0) {
      msg += '（自定义代码 ' + selfFileKeys.length + ' 个' +
             (selfFileModified ? '，shapes-self.js 已更新' : '，文件写入失败') + '）';
    }
    if (removedObjs > 0) msg += '；清理画布对象 ' + removedObjs + ' 个';
    toast(msg, 5200);

  } catch (err) {
    console.error(err);
    alert('删除失败：' + (err && err.message ? err.message : err));
  } finally {
    okBtn.disabled = false; okBtn.textContent = oldText;
  }
});



async function deleteSelfFileShapes(keys) {
  let text = await readSelfShapesFile() || '';
  if (!text || !text.trim()) return;

  const blocks = findShapeBlocks(text);
  const toDel = blocks.filter(b => keys.indexOf(b.key) >= 0);
  if (!toDel.length) return;

  toDel.sort((a, b) => b.start - a.start);
  for (const b of toDel) {
    const idx = blocks.indexOf(b);
    const prevEnd = idx > 0 ? blocks[idx - 1].end : 0;
    const range = getBlockDeleteRange(text, b, prevEnd);
    text = text.slice(0, range.start) + text.slice(range.end);
  }

  text = text.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');

  await writeSelfShapesFile(text);
}

/* =====================================================================
 * 17e. 开发者自定义图形（shapes-self.js）
 * ===================================================================== */
const SELF_SHAPES_FILE = 'shapes-self.js';
let __selfShapesLoadedKeys = new Set();
let __selfShapesToken = 0;

/* ---- 示例代码：五角星（简单图形） ---- */
const __SELF_STAR_CODE = `/* ===== 示例：五角星 =====
 * 覆盖了内置的 star5，加了一圈描边。
 * 关键字段：key（唯一）、cat（类别）、label（显示名）、geom、icon、draw
 */
shape({
  key: 'myStar',
  cat: 'custom',
  label: '我的五角星',
  geom: 'box',
  fill: true,
  icon: '<path d="M12 2l2.9 6.5L22 9.3l-5 4.8 1.3 7L12 17.7 5.7 21l1.3-7-5-4.8 7.1-.8z"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2;
    const cy = b.y1 + b.h / 2;
    const rx = b.w / 2, ry = b.h / 2;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 5;
      const r = (i % 2 === 0) ? 1 : 0.382;
      const x = cx + rx * r * Math.cos(ang);
      const y = cy + ry * r * Math.sin(ang);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.22); c.fill(); }
    c.stroke();
  }
});
`;

/* ---- 示例代码：磁聚焦模型（动画图形） ---- */
const __SELF_MAGFOCUS_CODE = `/* ==========================================================================
 * 磁聚焦模型（磁发散的时间反演）
 *  平行粒子从右侧沿 -x 方向射入圆形磁场，轨迹半径 = 区域半径 R
 *  粒子经磁场偏转后，先后汇聚到区域最低点 O
 * ========================================================================== */
param('mfcN',     { label: '粒子数',   min: 3,  max: 24, step: 1,   def: 10 });
param('mfcSpeed', { label: '速度倍率', min: 0.2, max: 3, step: 0.1, def: 1 });
param('mfcTrack', { label: '显示轨迹', min: 0,  max: 1,  step: 1,   def: 1 });

shape({
  key: 'anim_magFocus',
  cat: 'anim',
  geom: 'box',
  label: '磁聚焦模型',
  icon: '<circle cx="12" cy="12" r="7" fill="none" stroke-dasharray="2 2"/>' +
        '<path d="M21 6 L12 12 M21 12 L12 12 M21 18 L12 12"/>' +
        '<circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  animatable: true,
  params: ['mfcN', 'mfcSpeed', 'mfcTrack'],

  draw(c, o, U) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b = U.bbox(o);
    if (b.w < 100 || b.h < 70) return;

    const N = Math.max(3, Math.min(24, Math.round(o.mfcN ?? 10)));
    const speedMul = Math.max(0.2, Math.min(3, o.mfcSpeed ?? 1));
    const showTrack = (o.mfcTrack ?? 1) >= 0.5;
    const omega = 1.4 * speedMul;
    const x_start = 2.2;
    const pause = 0.9 / speedMul;

    const scale = Math.min(b.w * 0.86 / (x_start + 1.1), (b.h - 45) / 2.1);
    if (scale < 15) return;
    const Ox = (b.x1 + b.x2) / 2 - (x_start - 1) * scale / 2;
    const Oy = b.y2 - 32;

    const T_max_phys = (x_start + Math.PI) / omega;
    const T_cycle = T_max_phys + pause;
    let t = AN.t % T_cycle;
    if (t < 0) t += T_cycle;

    c.save();
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    c.clip();

    c.save();
    const grd = c.createRadialGradient(Ox, Oy - scale, 0, Ox, Oy - scale, scale);
    grd.addColorStop(0, 'rgba(70, 130, 200, 0.10)');
    grd.addColorStop(1, 'rgba(70, 130, 200, 0.02)');
    c.beginPath();
    c.arc(Ox, Oy - scale, scale, 0, Math.PI * 2);
    c.fillStyle = grd;
    c.fill();
    c.strokeStyle = 'rgba(60, 100, 160, 0.55)';
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();

    c.save();
    c.strokeStyle = 'rgba(80, 130, 200, 0.18)';
    c.lineWidth = 1;
    const sp = Math.max(22, scale * 0.32);
    const cyCir = Oy - scale;
    for (let dy = -scale + sp * 0.4; dy < scale; dy += sp) {
      for (let dx = -scale + sp * 0.4; dx < scale; dx += sp) {
        if (dx * dx + dy * dy > (scale - 10) * (scale - 10)) continue;
        const px = Ox + dx, py = cyCir + dy;
        const d = 2.8;
        c.beginPath();
        c.moveTo(px - d, py - d); c.lineTo(px + d, py + d);
        c.moveTo(px + d, py - d); c.lineTo(px - d, py + d);
        c.stroke();
      }
    }
    c.restore();

    c.save();
    c.setLineDash([4, 4]);
    c.strokeStyle = 'rgba(150, 150, 150, 0.4)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(Ox + x_start * scale, b.y1 + 4);
    c.lineTo(Ox + x_start * scale, Oy - 2 * scale - 4);
    c.stroke();
    c.restore();

    let arrivedCount = 0;

    for (let i = 0; i < N; i++) {
      const theta = Math.PI * (i + 0.5) / N;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const t_leave  = (x_start - sinT) / omega;
      const t_arrive = t_leave + theta / omega;

      const hue = Math.round(360 * i / N);
      const color = 'hsl(' + hue + ', 75%, 52%)';

      const arrived = t >= t_arrive;
      if (arrived) arrivedCount++;

      if (showTrack && t > 0.005) {
        c.save();
        c.strokeStyle = color;
        c.lineWidth = Math.max(1.1, 2 - N * 0.04);
        c.globalAlpha = 0.55;
        c.lineCap = 'round';
        c.lineJoin = 'round';

        const t_end = Math.min(t, t_arrive);

        if (t_end > 0) {
          const tLine = Math.min(t_end, t_leave);
          const xEnd = x_start - omega * tLine;
          const yLine = 1 - cosT;
          c.beginPath();
          c.moveTo(Ox + x_start * scale, Oy - yLine * scale);
          c.lineTo(Ox + xEnd * scale, Oy - yLine * scale);

          if (t_end > t_leave) {
            const sEnd = t_end - t_leave;
            const nSeg = Math.max(8, Math.ceil(omega * sEnd / (Math.PI / 40)));
            for (let k = 1; k <= nSeg; k++) {
              const s = sEnd * k / nSeg;
              const x_phys = sinT - Math.sin(omega * s);
              const y_phys = -cosT + Math.cos(omega * s);
              c.lineTo(Ox + x_phys * scale, Oy - y_phys * scale);
            }
          }
          c.stroke();
        }
        c.restore();
      }

      if (!arrived) {
        let px, py;
        if (t < t_leave) {
          const x_phys = x_start - omega * t;
          const y_phys = 1 - cosT;
          px = Ox + x_phys * scale;
          py = Oy - y_phys * scale;
        } else {
          const s = t - t_leave;
          const x_phys = sinT - Math.sin(omega * s);
          const y_phys = -cosT + Math.cos(omega * s);
          px = Ox + x_phys * scale;
          py = Oy - y_phys * scale;
        }

        c.save();
        c.beginPath();
        c.arc(px, py, 3.5, 0, Math.PI * 2);
        c.fillStyle = color;
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.2;
        c.stroke();
        c.restore();
      }
    }

    const glowAlpha = 0.2 + 0.65 * (arrivedCount / N);
    c.save();
    const glow = c.createRadialGradient(Ox, Oy, 0, Ox, Oy, 22);
    glow.addColorStop(0, 'rgba(255, 180, 50, ' + glowAlpha.toFixed(3) + ')');
    glow.addColorStop(1, 'rgba(255, 180, 50, 0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(Ox, Oy, 22, 0, Math.PI * 2);
    c.fill();
    c.restore();

    c.save();
    c.beginPath();
    c.arc(Ox, Oy, 4.5, 0, Math.PI * 2);
    c.fillStyle = '#ff9500';
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();

    c.save();
    c.font = 'bold 12px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = '#1a1a1a';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('O', Ox + 8, Oy + 5);
    c.restore();

    c.save();
    c.font = '11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = 'rgba(30, 30, 30, 0.55)';
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText(
      'R轨迹 = R区域  ·  ' + N + ' 个平行粒子向左射入  ·  先后汇聚到 O 点',
      (b.x1 + b.x2) / 2,
      b.y2 - 4
    );
    c.restore();

    c.restore();
  }
});
`;

/* ---- DeepSeek 提问模板 ---- */
const __SELF_DEEPSEEK_PROMPT = `我在用 PhysBoard 电子白板（一个基于 Canvas 2D 的物理教学工具），想在图形库管理里用开发者功能添加一个自定义图形。请帮我写一个完整的 JavaScript 代码片段。

【运行环境】
- 我的代码会被包在 new Function('shape','cat','param','PhysBoard', 我的代码) 里执行
- 可以直接调用 shape({...})、cat(id, label)、param(key, def)
- 图形对象字段：key, cat, label, geom('box'|'line'|'path'|'text'), icon(SVG字符串), draw(c,o,U), params(参数名数组), animatable(布尔)
- draw(c, o, U) 绘制时：
  - c 是 CanvasRenderingContext2D
  - o 是图形对象，包含包围盒信息
  - U.bbox(o) 返回 {x1,y1,x2,y2,w,h} 包围盒
  - U.alpha(color, a) 生成带透明度的颜色
  - 动画图形可以在 draw 里通过 (window.PhysBoard.animState.t) 拿到全局动画时间（秒）
  - 如果声明 animatable: true，选中图形会出现"播放/暂停"按钮

【param 定义格式 —— 第二个参数必须是对象，不能传数字！】
正确写法：
param('初速度', { label: '初速度', min: 0, max: 1000, step: 10, def: 150 });
param('质量比', { label: '质量比', min: 0.05, max: 50, step: 0.05, def: 1 });
param('阻尼',   { label: '阻尼',   min: 0, max: 5,    step: 0.1, def: 0 });
param('显示轨迹', { label: '显示轨迹', min: 0, max: 1,  step: 1,   def: 1 });
param('振幅',   { label: '振幅',   min: 4, max: 200,  step: 1,   def: 30, unit: 'px' });

对象字段说明：
- label   必填，参数显示名
- min/max/step  滑杆范围（range 类型必填）
- def     必填，默认值
- unit    可选，单位后缀，如 '°'、's'、'kg'、'px'
- type    可选，'select'（下拉）/ 'toggle'（开关）/ 默认 range（滑杆）

读取时用 o[key] 直接访问，例如：
const v0 = o['初速度'] ?? 150;
const damp = o['阻尼'] ?? 0;

❌ 错误写法（参数面板会显示 undefined，千万不要这样写）：
param('初速度', 150);
param('质量比', 1);

【icon 字段】
只放 24×24 视角下的 SVG 子元素（<path>、<rect>、<circle>、<line>、<polygon> 等），
不要外面再套一层 <svg>...</svg>，框架会自动包。
❌ 错误：icon: '<svg xmlns="..." viewBox="0 0 24 24"><path .../></svg>'
✅ 正确：icon: '<circle cx="12" cy="12" r="8"/><path d="M8 12l3 3 5-6"/>'

【我要画的图形】
这里写你想要的图形描述，例如：
- 一条波浪线，可以调节波浪高度和周期数
- 一个抛体运动轨迹动画，小球沿抛物线飞过
- 一个三棱镜色散光谱图
- 一个弹簧振子，可以播放动画

【参考示例：一个完整的动画图形】
下面是「磁聚焦模型」的完整代码。它演示了：
  · param 用对象格式定义参数
  · shape({...}) 声明 animatable: true
  · draw 里读取 window.PhysBoard.animState.t 计算每帧状态
  · 用 U.bbox(o) 拿包围盒，U.alpha(color, a) 拿带透明度的颜色
它比较长，仅供你参考结构，你生成的代码应当比这更精简。

\`\`\`js
${__SELF_MAGFOCUS_CODE.trim()}
\`\`\`

【输出要求】
- 只输出 JavaScript 代码，不要解释
- 必须包含 param(...)（对象格式，不能传数字）和 shape({...})
- icon 字段用 24x24 视角的 SVG 子元素，不要外包围 <svg>
- 如果涉及动画：声明 animatable: true，并在 draw 里读取 window.PhysBoard.animState.t，不要用 setInterval / requestAnimationFrame
- 中文注释保持简洁
`;


/* ---- 文件读写 ---- */
async function readSelfShapesFile() {
  try {
    if (window.__pbFS && typeof window.__pbFS.readFile === 'function') {
      const txt = await window.__pbFS.readFile(SELF_SHAPES_FILE);
      if (txt != null) return txt;
    }
  } catch (e) {}
  try { return localStorage.getItem('__pb_' + SELF_SHAPES_FILE); } catch (e) { return null; }
}

async function writeSelfShapesFile(code) {
  let ok = false;
  if (window.__pbFS && typeof window.__pbFS.writeFile === 'function') {
    try {
      await window.__pbFS.writeFile(SELF_SHAPES_FILE, code);
      ok = true;
    } catch (e) {
      console.warn('[shapes-self] 文件写入失败，回退 localStorage：', e);
    }
  }
  if (!ok) {
    try { localStorage.setItem('__pb_' + SELF_SHAPES_FILE, code); ok = true; } catch (e) {}
  }
  return ok;
}

function execSelfShapesCode(code) {
  if (!code || !code.trim()) return { ok: true, added: 0, keys: [] };
  const PB = window.PhysBoard;
  if (!PB) return { ok: false, error: 'PhysBoard 未初始化' };

  const beforeKeys = new Set(Object.keys(PB.shapes));
  const selfKeys = [];

  const shapeHelper = function (d) {
    if (!d || !d.key) return;
    d._selfFile = true;                         // ← 标记：来自 shapes-self.js
    if (typeof PB.register === 'function') PB.register(d);
    else PB.shapes[d.key] = d;
    selfKeys.push(d.key);
  };
  const catHelper = function (id, label) {
    if (!id) return;
    if ((PB.categories || []).some(c => c.id === id)) return;
    if (typeof PB.category === 'function') PB.category(id, label || id);
    else (PB.categories = PB.categories || []).push({ id, label: label || id });
  };
  const paramHelper = function (key, def) {
    if (!key) return;
    PB.paramDefs = PB.paramDefs || {};
    PB.paramDefs[key] = def;
  };

  try {
    const fn = new Function('shape', 'cat', 'param', 'PhysBoard', code);
    fn(shapeHelper, catHelper, paramHelper, PB);
  } catch (e) {
    // 出错回滚本次新增的图形，避免半成品
    for (const k of Object.keys(PB.shapes)) {
      if (!beforeKeys.has(k)) delete PB.shapes[k];
    }
    return { ok: false, error: (e && e.message) ? e.message : String(e) };
  }

  const newly = Object.keys(PB.shapes).filter(k => !beforeKeys.has(k));
  return { ok: true, added: newly.length, keys: selfKeys };
}

async function loadSelfShapesOnStartup() {
  try {
    const code = await readSelfShapesFile();
    if (!code || !code.trim()) return;
    const r = execSelfShapesCode(code);
    if (r.ok) {
      __selfShapesLoadedKeys = new Set(r.keys);
      console.log('[shapes-self] 已加载，新增 ' + r.added + ' 个图形');
    } else {
      console.warn('[shapes-self] 执行出错：', r.error);
    }
  } catch (e) {
    console.warn('[shapes-self] 加载失败：', e);
  }
}

/* ---- 示例渲染 ---- */
function getSelfExampleData(key) {
  if (key === 'star') return {
    title: '⭐ 简单图形 · 五角星',
    desc: '演示最小化的图形定义：`shape({...})` + 一个 `draw(c, o, U)`。适合画静态图形。',
    code: __SELF_STAR_CODE.trim()
  };
  if (key === 'magfocus') return {
    title: '🎬 动画图形 · 磁聚焦模型',
    desc: '演示动画图形：`animatable: true` + 读取 `window.PhysBoard.animState.t` 计算每帧状态，画出粒子轨迹。底部有多个可调参数。',
    code: __SELF_MAGFOCUS_CODE.trim()
  };
  if (key === 'guide') return {
    title: '🎓 用 DeepSeek 生成你自己的图形',
    desc: '把下面的提示词复制到 DeepSeek（或任何 AI 对话工具），把最后一段改成你想要的图形，AI 就会返回可直接保存的代码。',
    code: __SELF_DEEPSEEK_PROMPT.trim(),
    isPrompt: true
  };
  return null;
}

function renderSelfExample(key, buttonEl) {
  const detail = document.getElementById('selfExampleDetail');
  if (!detail) return;
  document.querySelectorAll('.self-example-btn').forEach(b => b.classList.remove('active'));

  const data = getSelfExampleData(key);
  if (!data) { detail.classList.remove('show'); detail.innerHTML = ''; return; }
  buttonEl.classList.add('active');

  const codeId = 'selfExampleCode_' + key;

  detail.innerHTML = `
    <div class="self-example-detail-head">
      <div class="self-example-detail-title">${data.title}</div>
    </div>
    <div class="self-example-detail-body" id="${codeId}" style="font-size:${data.isPrompt ? '12px' : '11px'};">${
      escapeHtmlSelf(data.code)
    }</div>
    <div class="self-example-actions">
      <button class="mbtn ghost" data-act="copy-example">📋 复制到剪贴板</button>
      ${
        data.isPrompt
          ? '<span style="font-size:11px;color:#6b7c96;align-self:center;margin-left:6px;">复制后到 DeepSeek 对话里粘贴</span>'
          : `<button class="mbtn ghost" data-act="insert-example">⬇ 插入到编辑区</button>
             <span style="font-size:11px;color:#6b7c96;align-self:center;margin-left:6px;">插入时会追加，不会覆盖已有代码</span>`
      }
    </div>
    <div style="padding:0 12px 10px;font-size:11.5px;color:#8fa3c0;line-height:1.6;">${data.desc}</div>
  `;
  detail.classList.add('show');

  const copyBtn = detail.querySelector('[data-act="copy-example"]');
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(data.code);
      if (typeof toast === 'function') toast('已复制到剪贴板', 1800);
      copyBtn.textContent = '✓ 已复制';
      setTimeout(() => { copyBtn.textContent = '📋 复制到剪贴板'; }, 1500);
    } catch (e) {
      if (typeof toast === 'function') toast('复制失败：' + (e && e.message ? e.message : e), 2400);
    }
  });

  const insertBtn = detail.querySelector('[data-act="insert-example"]');
  if (insertBtn) insertBtn.addEventListener('click', () => {
    const ta = document.getElementById('selfShapesCode');
    if (!ta) return;
    const current = ta.value.replace(/\s+$/, '');
    const separator = current ? '\n\n/* ==================== 新增图形 ==================== */\n' : '';
    ta.value = current + separator + data.code + '\n';
    ta.scrollTop = ta.scrollHeight;
    if (typeof toast === 'function') toast('已插入到编辑区，记得点「保存并执行」', 2400);
    const status = document.getElementById('selfShapesStatus');
    if (status) {
      status.style.color = '#7dd3fc';
      status.textContent = '已插入示例代码 · 修改 / 保存后生效';
    }
  });
}

function escapeHtmlSelf(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---- 打开弹窗 ---- */
function openSelfShapesModal() {
  const modal = document.getElementById('selfShapesModal');
  if (!modal) return;
  const ta = document.getElementById('selfShapesCode');
  const status = document.getElementById('selfShapesStatus');
  const detail = document.getElementById('selfExampleDetail');

  document.querySelectorAll('.self-example-btn').forEach(b => b.classList.remove('active'));
  if (detail) { detail.classList.remove('show'); detail.innerHTML = ''; }
  if (ta) ta.value = '';
  if (status) {
    status.style.color = '#8fa3c0';
    status.textContent = '编辑区为空 · 粘贴或写代码，保存后会追加到 shapes-self.js 末尾';
  }

  openModal('selfShapesModal');
}


(function setupSelfShapesUI() {
  const devBtn = document.getElementById('libDevBtn');
  if (devBtn) devBtn.addEventListener('click', openSelfShapesModal);

  /* ★ 新增：示例按钮点击绑定（之前漏掉了） */
  document.querySelectorAll('.self-example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.example;
      if (!key) return;
      renderSelfExample(key, btn);
    });
  });

  const cancelBtn = document.getElementById('selfShapesCancel');
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    __selfShapesToken++;
    closeModal('selfShapesModal');
  });

  const clearBtn = document.getElementById('selfShapesClear');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    const ta = document.getElementById('selfShapesCode');
    if (ta) ta.value = '';
    const status = document.getElementById('selfShapesStatus');
    if (status) {
      status.style.color = '#fca5a5';
      status.textContent = '已清空编辑区（点「保存并执行」才会清空文件）';
    }
  });

  const saveBtn = document.getElementById('selfShapesSave');
  if (saveBtn) saveBtn.addEventListener('click', async () => {
    /* ... 你原来的保存逻辑完全不动 ... */
    const ta = document.getElementById('selfShapesCode');
    const status = document.getElementById('selfShapesStatus');
    if (!ta) return;

    const code = ta.value.trim();
    if (!code) {
      if (status) {
        status.style.color = '#fca5a5';
        status.textContent = '请先输入代码';
      }
      return;
    }

    const oldTxt = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中…';
    if (status) { status.style.color = ''; status.textContent = ''; }

    try {
      const result = execSelfShapesCode(code);
      if (!result.ok) {
        if (status) {
          status.style.color = '#fca5a5';
          status.textContent = '代码执行出错：' + result.error;
        }
        return;
      }

      const existing = (await readSelfShapesFile()) || '';
      const trimmed = existing.replace(/\s+$/, '');
      const stamp = new Date().toLocaleString('zh-CN', { hour12: false });
      const separator = trimmed
        ? '\n\n/* ==================== 新增于 ' + stamp + ' ==================== */\n'
        : '';
      const newText = trimmed + separator + code + '\n';

      const written = await writeSelfShapesFile(newText);
      if (!written) {
        if (status) {
          status.style.color = '#fca5a5';
          status.textContent = '保存失败：无法写入 shapes-self.js';
        }
        return;
      }

      __selfShapesLoadedKeys = new Set([...__selfShapesLoadedKeys, ...result.keys]);

      if (typeof buildShapePanel === 'function') buildShapePanel();
      render();

      ta.value = '';

      if (status) {
        status.style.color = '#4ade80';
        status.textContent = '✓ 已追加并执行成功' +
          (result.added > 0 ? '（新增 ' + result.added + ' 个图形）' : '') +
          '。编辑区已清空，可继续写下一个。';
      }
      if (typeof toast === 'function') {
        toast('已追加自定义图形' +
          (result.added > 0 ? '（' + result.added + ' 个新图形）' : ''), 2600);
      }
    } catch (e) {
      if (status) {
        status.style.color = '#fca5a5';
        status.textContent = '保存失败：' + (e && e.message ? e.message : e);
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = oldTxt;
    }
  });
})();



/* =====================================================================
 * 18. 样式面板
 * ===================================================================== */
function makeSwatch(color, opts) {
  opts = opts || {};
  const b = document.createElement('button');
  b.className = 'swatch' + (opts.none ? ' none' : '') +
                (opts.black ? ' black' : '') + (opts.white ? ' white' : '');
  if (!opts.none && !opts.black && !opts.white) b.style.background = color;
  b.dataset.color = color;
  b.title = opts.none ? '无' : (color === '#000000' ? '黑色' : (color === '#ffffff' ? '白色' : color));
  return b;
}
function makeColorPicker(onPick) {
  const w = document.createElement('label');
  w.className = 'color-pick'; w.title = '自定义颜色';
  const inp = document.createElement('input');
  inp.type = 'color'; inp.value = '#7dd3fc';
  inp.addEventListener('input', e => onPick(e.target.value));
  w.appendChild(inp); return w;
}
function buildPenPanel() {
  penSizesEl.innerHTML = '';
  PEN_SIZES.forEach(sz => {
    const b = document.createElement('button');
    b.className = 'size-btn' + (state.penSize === sz.v ? ' active' : '');
    b.dataset.size = sz.v;
    const d = document.createElement('span');
    d.className = 'dot'; d.style.width = sz.d + 'px'; d.style.height = sz.d + 'px';
    b.appendChild(d);
    b.addEventListener('click', () => {
      state.penSize = sz.v; state.borderSize = sz.v;
      penSizesEl.querySelectorAll('.size-btn').forEach(x =>
        x.classList.toggle('active', +x.dataset.size === sz.v));
    });
    penSizesEl.appendChild(b);
  });
  penColorsEl.innerHTML = '';
  COLORS.forEach(c => {
    const opts = {};
    if (c === '#000000') opts.black = true;
    if (c === '#ffffff') opts.white = true;
    const b = makeSwatch(c, opts);
    b.classList.toggle('active', c.toLowerCase() === state.penColor.toLowerCase());
    b.addEventListener('click', () => {
      state.penColor = c; state.borderColor = c;
      penColorsEl.querySelectorAll('.swatch').forEach(x =>
        x.classList.toggle('active', x.dataset.color.toLowerCase() === c.toLowerCase()));
    });
    penColorsEl.appendChild(b);
  });
  penColorsEl.appendChild(makeColorPicker(c => {
    state.penColor = c; state.borderColor = c;
    penColorsEl.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
  }));
  penStylesEl.innerHTML = '';
  DASH_STYLES.forEach(ds => {
    const b = document.createElement('button');
    b.className = 'line-btn' + (state.penDash === ds.id ? ' active' : '');
    b.dataset.dash = ds.id;
    b.innerHTML = '<svg viewBox="0 0 56 14">' + ds.svg + '</svg>';
    b.addEventListener('click', () => {
      state.penDash = ds.id;
      penStylesEl.querySelectorAll('.line-btn').forEach(x =>
        x.classList.toggle('active', x.dataset.dash === ds.id));
    });
    penStylesEl.appendChild(b);
  });
}
function buildBorderPanel() {
  borderSizesEl.innerHTML = '';
  BORDER_SIZES.forEach(sz => {
    const b = document.createElement('button');
    b.className = 'size-btn'; b.dataset.size = sz.v;
    const d = document.createElement('span');
    d.className = 'dot';
    d.style.width = (5 + sz.v * 2.6) + 'px'; d.style.height = (5 + sz.v * 2.6) + 'px';
    b.appendChild(d);
    b.addEventListener('click', () => {
      state.borderSize = sz.v; state.penSize = sz.v;
      applyToSelection(o => { o.size = sz.v; });
      borderSizesEl.querySelectorAll('.size-btn').forEach(x =>
        x.classList.toggle('active', +x.dataset.size === sz.v));
    });
    borderSizesEl.appendChild(b);
  });
  borderColorsEl.innerHTML = '';
  const noneBtn = makeSwatch('#000000', { none: true });
  noneBtn.dataset.color = '__none__';
  noneBtn.addEventListener('click', () => {
    applyToSelection(o => { o.hasBorder = false; });
    syncBorderUI();
  });
  borderColorsEl.appendChild(noneBtn);
  COLORS.forEach(c => {
    const opts = {};
    if (c === '#000000') opts.black = true;
    if (c === '#ffffff') opts.white = true;
    const b = makeSwatch(c, opts);
    b.addEventListener('click', () => {
      state.borderColor = c; state.penColor = c;
      applyToSelection(o => { o.color = c; o.hasBorder = true; });
      syncBorderUI();
    });
    borderColorsEl.appendChild(b);
  });
  borderColorsEl.appendChild(makeColorPicker(c => {
    state.borderColor = c; state.penColor = c;
    applyToSelection(o => { o.color = c; o.hasBorder = true; });
    syncBorderUI();
  }));
  borderStylesEl.innerHTML = '';
  DASH_STYLES.forEach(ds => {
    const b = document.createElement('button');
    b.className = 'line-btn'; b.dataset.dash = ds.id;
    b.innerHTML = '<svg viewBox="0 0 56 14">' + ds.svg + '</svg>';
    b.addEventListener('click', () => {
      state.penDash = ds.id;
      applyToSelection(o => { o.dash = ds.id; });
      borderStylesEl.querySelectorAll('.line-btn').forEach(x =>
        x.classList.toggle('active', x.dataset.dash === ds.id));
    });
    borderStylesEl.appendChild(b);
  });
}
function syncBorderUI() {
  const one = selection[0];
  if (!one) return;
  const size = one.size || 3;
  borderSizesEl.querySelectorAll('.size-btn').forEach(x =>
    x.classList.toggle('active', +x.dataset.size === size));
  borderColorsEl.querySelectorAll('.swatch').forEach(x => {
    if (x.dataset.color === '__none__') x.classList.toggle('active', one.hasBorder === false);
    else x.classList.toggle('active', one.hasBorder !== false &&
      x.dataset.color.toLowerCase() === (one.color || '').toLowerCase());
  });
  borderStylesEl.querySelectorAll('.line-btn').forEach(x =>
    x.classList.toggle('active', x.dataset.dash === (one.dash || 'solid')));
}
function buildFillPanel() {
  fillColorsEl.innerHTML = '';
  const noneBtn = makeSwatch('#000000', { none: true });
  noneBtn.dataset.color = '__none__';
  noneBtn.addEventListener('click', () => {
    state.fillActive = false;
    applyToSelection(o => { o.fill = false; });
    syncFillUI();
  });
  fillColorsEl.appendChild(noneBtn);
  COLORS.forEach(c => {
    const opts = {};
    if (c === '#000000') opts.black = true;
    if (c === '#ffffff') opts.white = true;
    const b = makeSwatch(c, opts);
    b.addEventListener('click', () => {
      state.fillColor = c; state.fillActive = true;
      applyToSelection(o => { o.fillColor = c; o.fill = true; });
      syncFillUI();
    });
    fillColorsEl.appendChild(b);
  });
  fillColorsEl.appendChild(makeColorPicker(c => {
    state.fillColor = c; state.fillActive = true;
    applyToSelection(o => { o.fillColor = c; o.fill = true; });
    syncFillUI();
  }));
  fillAlphaInput.addEventListener('input', () => {
    const v = +fillAlphaInput.value;
    fillAlphaVal.textContent = v + '%';
    state.fillAlpha = v / 100; state.fillActive = true;
    applyToSelection(o => { o.fillAlpha = v / 100; if (o.fill !== false) o.fill = true; });
  });
}
function syncFillUI() {
  const one = selection[0];
  if (!one) {
    fillColorsEl.querySelectorAll('.swatch').forEach(x => {
      if (x.dataset.color === '__none__') {
        x.classList.toggle('active', state.fillActive === false);
      } else {
        x.classList.toggle('active', state.fillActive !== false &&
          x.dataset.color.toLowerCase() === state.fillColor.toLowerCase());
      }
    });
    const a = Math.round(state.fillAlpha * 100);
    fillAlphaInput.value = a; fillAlphaVal.textContent = a + '%';
    return;
  }
  fillColorsEl.querySelectorAll('.swatch').forEach(x => {
    if (x.dataset.color === '__none__') x.classList.toggle('active', one.fill === false);
    else x.classList.toggle('active', one.fill !== false &&
      x.dataset.color.toLowerCase() === (one.fillColor || '').toLowerCase());
  });
  const a = Math.round((one.fillAlpha != null ? one.fillAlpha : state.fillAlpha) * 100);
  fillAlphaInput.value = a; fillAlphaVal.textContent = a + '%';
}




/* =====================================================================
 * 参数面板 · 文本框示例抽屉（v2 · 支持自定义抽屉 + 长按菜单 + 管理）
 * ===================================================================== */
let __exDrawerEl = null;
let __exDrawerAnchor = null;
let __exDrawerMenuEl = null;
let __exDrawerManagerEl = null;

function __closeExDrawerMenu() {
  if (__exDrawerMenuEl) { __exDrawerMenuEl.remove(); __exDrawerMenuEl = null; }
}
function __closeExDrawerManager() {
  if (__exDrawerManagerEl) { __exDrawerManagerEl.remove(); __exDrawerManagerEl = null; }
}
function __destroyExDrawer() {
  if (__exDrawerEl) { __exDrawerEl.remove(); __exDrawerEl = null; }
  __exDrawerAnchor = null;
  __closeExDrawerMenu();
  document.removeEventListener('pointerdown', __exDrawerOutsideHandler, true);
  window.removeEventListener('scroll', __positionExDrawer, true);
  window.removeEventListener('resize', __positionExDrawer);
}

/* 统一从 window.__pbFuncPlotter 拿组数据；没有 API 时退回 pd.exampleGroups */
function __normalizeExampleGroups(pd) {
  const api = window.__pbFuncPlotter;
  if (api && typeof api.getGroups === 'function') {
    try {
      const groups = api.getGroups();
      if (Array.isArray(groups) && groups.length) {
        return groups.map(g => ({
          id: g.id, name: g.name, builtin: !!g.builtin,
          items: (g.items || []).map(it => ({
            id: it.id, label: it.label || (it.code || '').split('\n')[0].slice(0, 18),
            code: String(it.code || '')
          })).filter(it => it.code)
        })).filter(g => g.items.length || !g.builtin);
      }
    } catch (e) { console.warn('[funcDrawer] getGroups 失败：', e); }
  }
  if (Array.isArray(pd.exampleGroups) && pd.exampleGroups.length) {
    return pd.exampleGroups.map((g, gi) => ({
      id: 'legacy_' + gi, name: g.name || '未命名', builtin: false,
      items: (g.items || []).map((it, ii) => ({
        id: 'li_' + gi + '_' + ii,
        label: it.label || (it.code || '').split('\n')[0].slice(0, 18),
        code: String(it.code || '')
      })).filter(it => it.code)
    })).filter(g => g.items.length);
  }
  return [];
}

function __appendToTextarea(input, code) {
  const cur = input.value;
  const needNl = cur.length > 0 && !/\n$/.test(cur);
  input.value = cur + (needNl ? '\n' : '') + code;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  try {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    input.scrollTop = input.scrollHeight;
  } catch (e) {}
}

function __positionExDrawer() {
  if (!__exDrawerEl || !__exDrawerAnchor) return;
  const inp = __exDrawerAnchor.input;
  if (!inp || !inp.isConnected) { __destroyExDrawer(); return; }

  const rect = inp.getBoundingClientRect();
  const W = __exDrawerEl.offsetWidth;
  const H = __exDrawerEl.offsetHeight;
  const vw = window.innerWidth, vh = window.innerHeight;
  const gap = 10, M = 8;
  const midX = rect.left + rect.width / 2;

  let left;
  if (midX < vw / 2) {
    left = rect.left - W - gap;
    if (left < M) left = rect.right + gap;
  } else {
    left = rect.right + gap;
    if (left + W > vw - M) left = rect.left - W - gap;
  }
  left = Math.max(M, Math.min(vw - W - M, left));

  let top = rect.top;
  if (top + H > vh - M) top = Math.max(M, vh - H - M);
  if (top < M) top = M;

  __exDrawerEl.style.left = left + 'px';
  __exDrawerEl.style.top = top + 'px';
}

/* 通用悬浮菜单 */
function __showFloatingMenu(anchorEl, items) {
  __closeExDrawerMenu();
  if (!items || !items.length) return;
  const menu = document.createElement('div');
  menu.style.cssText =
    'position:fixed; z-index:9999; min-width:150px; ' +
    'background:rgba(16,26,44,.98); ' +
    'border:1px solid rgba(120,180,255,.32); ' +
    'border-radius:10px; padding:4px; ' +
    'box-shadow:0 12px 32px rgba(0,8,24,.65);';
  items.forEach(it => {
    if (it.sep) {
      const sp = document.createElement('div');
      sp.style.cssText = 'height:1px;margin:3px 6px;background:rgba(120,180,255,.15);';
      menu.appendChild(sp);
      return;
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = it.label;
    b.style.cssText =
      'display:block; width:100%; text-align:left; padding:7px 12px; ' +
      'border:none; background:transparent; color:#c8d5ea; ' +
      'font-family:inherit; font-size:12.5px; border-radius:7px; cursor:pointer;';
    b.addEventListener('mouseenter', () => { b.style.background = 'rgba(56,189,248,.18)'; b.style.color = '#7dd3fc'; });
    b.addEventListener('mouseleave', () => { b.style.background = 'transparent'; b.style.color = '#c8d5ea'; });
    b.addEventListener('click', (e) => { e.stopPropagation(); __closeExDrawerMenu(); if (it.onClick) it.onClick(); });
    menu.appendChild(b);
  });
  document.body.appendChild(menu);
  const r = anchorEl.getBoundingClientRect();
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  const vw = window.innerWidth, vh = window.innerHeight;
  let left = r.left, top = r.bottom + 4;
  if (left + mw > vw - 8) left = vw - mw - 8;
  if (top + mh > vh - 8) top = r.top - mh - 4;
  if (left < 8) left = 8;
  if (top < 8) top = 8;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  __exDrawerMenuEl = menu;
}

/* 长按检测：pointerdown 起 500ms 触发 onLongPress，期间 pointerup 取消 */
function __attachLongPress(el, onLongPress, onTap) {
  let timer = null;
  let fired = false;
  let startX = 0, startY = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    fired = false;
    startX = e.clientX; startY = e.clientY;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fired = true;
      try { onLongPress(e); } catch (err) { console.warn(err); }
    }, 500);
  });
  el.addEventListener('pointermove', (e) => {
    if (fired) return;
    if (Math.abs(e.clientX - startX) > 6 || Math.abs(e.clientY - startY) > 6) {
      clearTimeout(timer); timer = null;
    }
  });
  el.addEventListener('pointerup', (e) => {
    clearTimeout(timer); timer = null;
    if (fired) { e.stopPropagation(); e.preventDefault(); return; }
    if (onTap) try { onTap(e); } catch (err) { console.warn(err); }
  });
  el.addEventListener('pointercancel', () => { clearTimeout(timer); timer = null; });
}

/* 打开抽屉 · v3（默认折叠 / 内嵌管理 / 隐藏与删除 / 拖拽排序 / 跨抽屉） */
function __buildExDrawer(groups) {
  const el = document.createElement('div');
  el.className = 'pb-ex-drawer';
  el.style.cssText =
    'position:fixed; z-index:88; width:340px; max-height:min(560px,82vh); ' +
    'background:linear-gradient(160deg, rgba(10,18,32,.98), rgba(16,26,48,.98)); ' +
    'border:1px solid rgba(34,211,238,.42); border-radius:14px; ' +
    'box-shadow:0 0 0 1px rgba(34,211,238,.12) inset, 0 0 40px rgba(34,211,238,.28), 0 20px 60px rgba(0,0,0,.7); ' +
    'backdrop-filter:blur(20px) saturate(1.4); -webkit-backdrop-filter:blur(20px) saturate(1.4); ' +
    'display:flex; flex-direction:column; overflow:hidden; ' +
    'animation:selIn .16s cubic-bezier(.34,1.3,.64,1);';

  let viewMode = 'normal';           // 'normal' | 'manage'
  const expanded = new Set();        // 展开中的组 id（默认空 → 全折叠）

  /* ---------- 小工具 ---------- */
  function makeBtn(text, tip, active, onClick, danger) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.title = tip || '';
    b.style.cssText =
      'flex:none; height:26px; padding:0 10px; border-radius:7px; ' +
      'border:1px solid ' + (danger ? 'rgba(248,113,113,.4)' : (active ? '#22d3ee' : 'rgba(34,211,238,.24)')) + '; ' +
      'background:' + (danger
        ? 'rgba(248,113,113,.08)'
        : (active ? 'linear-gradient(135deg,rgba(34,211,238,.32),rgba(168,85,247,.24))' : 'rgba(34,211,238,.06)')) + '; ' +
      'color:' + (danger ? '#fca5a5' : (active ? '#fff' : '#7dd3fc')) + '; ' +
      'font-family:inherit; font-size:11px; cursor:pointer; transition:all .15s;';
    if (!active && !danger) {
      b.addEventListener('mouseenter', () => {
        b.style.background = 'rgba(34,211,238,.16)';
        b.style.borderColor = '#22d3ee';
        b.style.color = '#22d3ee';
      });
      b.addEventListener('mouseleave', () => {
        b.style.background = 'rgba(34,211,238,.06)';
        b.style.borderColor = 'rgba(34,211,238,.24)';
        b.style.color = '#7dd3fc';
      });
    }
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick && onClick(); });
    return b;
  }

  /* ---------- 头部 ---------- */
  function renderHeader() {
    const head = document.createElement('div');
    head.style.cssText =
      'flex:none; display:flex; align-items:center; gap:5px; padding:10px 12px; ' +
      'border-bottom:1px solid rgba(34,211,238,.18); ' +
      'background:linear-gradient(180deg, rgba(34,211,238,.07), transparent);';

    const title = document.createElement('span');
    title.textContent = viewMode === 'manage' ? '⚙ 抽屉管理' : '📚 函数抽屉';
    title.style.cssText =
      'flex:1; font-size:13px; color:#c9e4f5; font-weight:600; letter-spacing:.6px; ' +
      'font-family:ui-monospace, Menlo, Consolas, monospace; ' +
      'text-shadow:0 0 12px rgba(34,211,238,.35);';
    head.appendChild(title);

    if (viewMode === 'normal') {
      head.appendChild(makeBtn('📋 提示词', '复制 AI 提示词', false, () => {
        const text = (window.__pbFuncPlotter && window.__pbFuncPlotter.getAIPrompt)
          ? window.__pbFuncPlotter.getAIPrompt() : '';
        if (!text) return;
        tryCopyToClipboard(text);
        if (typeof toast === 'function') toast('已复制 AI 提示词到剪贴板', 2400);
      }));
      head.appendChild(makeBtn('＋ 新建', '新建抽屉', false, () => {
        const name = prompt('新抽屉名称：', '我的函数');
        if (!name) return;
        if (window.__pbFuncPlotter) window.__pbFuncPlotter.addGroup(name);
        render();
      }));
      head.appendChild(makeBtn('⚙ 管理', '进入管理模式', false, () => {
        viewMode = 'manage';
        render();
      }));
    } else {
      head.appendChild(makeBtn('← 返回', '退出管理模式', false, () => {
        viewMode = 'normal';
        render();
      }));
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.style.cssText =
      'flex:none; width:26px; height:26px; padding:0; border-radius:7px; border:none; ' +
      'background:transparent; color:#8fa3c0; font-family:inherit; font-size:13px; ' +
      'cursor:pointer; transition:all .15s;';
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(248,113,113,.2)';
      closeBtn.style.color = '#fca5a5';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'transparent';
      closeBtn.style.color = '#8fa3c0';
    });
    closeBtn.addEventListener('click', () => __destroyExDrawer());
    head.appendChild(closeBtn);

    return head;
  }

  /* ---------- 拖拽条目（管理模式下） ---------- */
  function setupChipDrag(chipEl, handleEl, g, it) {
    let dragging = false, ghost = null, dropGid = null;
    handleEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || viewMode !== 'manage') return;
      e.preventDefault();
      dragging = false;
      dropGid = null;
      const sx = e.clientX, sy = e.clientY;
      const move = (ev) => {
        if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
          dragging = true;
          ghost = document.createElement('div');
          ghost.textContent = '📌 ' + it.label;
          ghost.style.cssText =
            'position:fixed; z-index:99999; pointer-events:none; padding:6px 12px; ' +
            'background:linear-gradient(135deg,#22d3ee,#a855f7); color:#fff; ' +
            'border-radius:8px; font-size:12px; font-weight:600; ' +
            'box-shadow:0 8px 24px rgba(34,211,238,.6); transform:translate(-50%,-50%);';
          document.body.appendChild(ghost);
        }
        if (!dragging) return;
        ghost.style.left = ev.clientX + 'px';
        ghost.style.top = ev.clientY + 'px';
        document.querySelectorAll('.pb-ex-drawer [data-group-id]').forEach((n) => {
          n.style.outline = ''; n.style.background = ''; n.style.outlineOffset = '';
        });
        const hovered = document.elementFromPoint(ev.clientX, ev.clientY);
        const groupEl = hovered && hovered.closest && hovered.closest('.pb-ex-drawer [data-group-id]');
        if (groupEl) {
          groupEl.style.outline = '2px dashed #22d3ee';
          groupEl.style.outlineOffset = '3px';
          groupEl.style.background = 'rgba(34,211,238,.10)';
          dropGid = groupEl.dataset.groupId;
        } else {
          dropGid = null;
        }
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (ghost) ghost.remove();
        document.querySelectorAll('.pb-ex-drawer [data-group-id]').forEach((n) => {
          n.style.outline = ''; n.style.background = ''; n.style.outlineOffset = '';
        });
        if (dragging && dropGid && dropGid !== g.id && window.__pbFuncPlotter) {
          window.__pbFuncPlotter.moveItem(g.id, it.id, dropGid, null);
          if (typeof toast === 'function') toast('已移动「' + it.label + '」到其他抽屉', 1800);
          render();
        }
        dragging = false;
        dropGid = null;
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  /* ---------- 单个组 ---------- */
  function renderGroup(g) {
    const wrap = document.createElement('div');
    wrap.dataset.groupId = g.id;
    wrap.style.cssText = 'margin-bottom:6px; border-radius:10px;';
    const isManage = viewMode === 'manage';
    const isOpen = expanded.has(g.id);
    const isHidden = !!g.hidden;
    if (isManage && isHidden) wrap.style.opacity = '0.7';

    /* 组标题 */
    const gBtn = document.createElement('button');
    gBtn.type = 'button';
    gBtn.style.cssText =
      'width:100%; display:flex; align-items:center; gap:6px; padding:8px 10px; ' +
      'border-radius:9px; ' +
      'border:1px solid ' + (isOpen ? 'rgba(34,211,238,.5)' : 'rgba(34,211,238,.14)') + '; ' +
      'background:' + (isOpen
        ? 'linear-gradient(135deg,rgba(34,211,238,.15),rgba(168,85,247,.10))'
        : 'rgba(34,211,238,.04)') + '; ' +
      'color:' + (isOpen ? '#22d3ee' : (isHidden ? '#5a6a80' : '#c9e4f5')) + '; ' +
      'font-family:inherit; font-size:12.5px; font-weight:500; text-align:left; cursor:pointer; ' +
      'transition:all .15s;';
    const gName = document.createElement('span');
    gName.textContent = g.name + (g.builtin ? '' : ' ✱');
    gName.style.cssText = 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
    gBtn.appendChild(gName);
    const gCount = document.createElement('span');
    gCount.textContent = String((g.items || []).length);
    gCount.style.cssText =
      'font-size:10.5px; color:#7dd3fc; padding:1px 6px; background:rgba(34,211,238,.10); ' +
      'border-radius:6px; font-variant-numeric:tabular-nums;';
    gBtn.appendChild(gCount);
    const gArrow = document.createElement('span');
    gArrow.textContent = '▸';
    gArrow.style.cssText =
      'color:#22d3ee; transition:transform .18s; font-size:10px; ' +
      (isOpen ? 'transform:rotate(90deg);' : '');
    gBtn.appendChild(gArrow);
    gBtn.addEventListener('click', () => {
      if (isOpen) expanded.delete(g.id); else expanded.add(g.id);
      setTimeout(render, 0);  // ★ 延迟 0ms 重绘，完美避让事件循环
    });
    wrap.appendChild(gBtn);

    /* 管理动作（组级） */
    if (isManage) {
      const acts = document.createElement('div');
      acts.style.cssText = 'display:flex; gap:4px; margin:4px 0 0;';
      acts.appendChild(makeBtn(
        isHidden ? '👁 恢复显示' : '👁 隐藏抽屉',
        isHidden ? '让这个抽屉重新出现在列表里' : '从主列表隐藏这个抽屉',
        false,
        () => {
          if (window.__pbFuncPlotter && window.__pbFuncPlotter.setGroupHidden) {
            window.__pbFuncPlotter.setGroupHidden(g.id, !g.hidden);
          }
          render();
        }
      ));
      if (!g.builtin) {
        acts.appendChild(makeBtn('↑', '上移', false, () => {
          if (window.__pbFuncPlotter) window.__pbFuncPlotter.moveGroup(g.id, 'up');
          render();
        }));
        acts.appendChild(makeBtn('↓', '下移', false, () => {
          if (window.__pbFuncPlotter) window.__pbFuncPlotter.moveGroup(g.id, 'down');
          render();
        }));
        acts.appendChild(makeBtn('✕ 删除', '删除抽屉', false, () => {
          if (!confirm('删除抽屉「' + g.name + '」及其所有函数？')) return;
          if (window.__pbFuncPlotter) window.__pbFuncPlotter.deleteGroup(g.id);
          expanded.delete(g.id);
          render();
        }, true));
      }
      wrap.appendChild(acts);
    }

    /* 展开内容 */
    if (isOpen) {
      const bodyBox = document.createElement('div');
      bodyBox.style.cssText = 'display:flex; flex-direction:column; gap:5px; padding:6px 0 4px;';

      if (!g.items || !g.items.length) {
        const empty = document.createElement('div');
        empty.textContent = isManage
          ? '（空）可把其他抽屉里的函数拖进来'
          : '（空）在「⚙ 管理」里新增，或拖动函数到此处';
        empty.style.cssText =
          'padding:10px 12px; color:#6b7a90; font-size:11.5px; font-style:italic;';
        bodyBox.appendChild(empty);
      } else {
        g.items.forEach((it) => {
          if (it.hidden && !isManage) return;

          const chip = document.createElement('div');
          chip.style.cssText = 'position:relative;';

          const chipBtn = document.createElement('button');
          chipBtn.type = 'button';
          chipBtn.title = it.code;
          chipBtn.textContent = it.label;
          chipBtn.style.cssText =
            'width:100%; text-align:left; padding:8px 11px; ' +
            'background:rgba(8,16,32,.55); ' +
            'border:1px solid rgba(34,211,238,.16); border-radius:8px; ' +
            'color:' + (it.hidden ? '#5a6a80' : '#c9e4f5') + '; ' +
            'font-family:inherit; font-size:12px; line-height:1.4; ' +
            'cursor:' + (isManage ? 'grab' : 'pointer') + '; ' +
            'white-space:nowrap; overflow:hidden; text-overflow:ellipsis; ' +
            'transition:all .15s; opacity:' + (it.hidden ? '.55' : '1') + ';';
          if (!isManage) {
            chipBtn.addEventListener('mouseenter', () => {
              chipBtn.style.background = 'rgba(34,211,238,.15)';
              chipBtn.style.color = '#22d3ee';
              chipBtn.style.borderColor = 'rgba(34,211,238,.5)';
            });
            chipBtn.addEventListener('mouseleave', () => {
              chipBtn.style.background = 'rgba(8,16,32,.55)';
              chipBtn.style.color = '#c9e4f5';
              chipBtn.style.borderColor = 'rgba(34,211,238,.16)';
            });
            chipBtn.addEventListener('click', () => {
              if (!__exDrawerAnchor || !__exDrawerAnchor.input) return;
              __appendToTextarea(__exDrawerAnchor.input, it.code);
              chipBtn.style.background = 'rgba(74,222,128,.3)';
              chipBtn.style.color = '#fff';
              setTimeout(() => {
                chipBtn.style.background = 'rgba(8,16,32,.55)';
                chipBtn.style.color = '#c9e4f5';
              }, 500);
            });
          }
          chip.appendChild(chipBtn);

          if (isManage) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; gap:4px; margin-top:3px;';

            row.appendChild(makeBtn(it.hidden ? '👁 恢复' : '👁 隐藏', '', false, () => {
              if (window.__pbFuncPlotter && window.__pbFuncPlotter.setItemHidden) {
                window.__pbFuncPlotter.setItemHidden(g.id, it.id, !it.hidden);
              }
              render();
            }));

            if (!g.builtin && !it.builtin) {
              row.appendChild(makeBtn('✕ 删除', '', false, () => {
                if (!confirm('删除「' + it.label + '」？')) return;
                if (window.__pbFuncPlotter) window.__pbFuncPlotter.deleteItem(g.id, it.id);
                render();
              }, true));
            }
            chip.appendChild(row);

            setupChipDrag(chip, chipBtn, g, it);
          }

          bodyBox.appendChild(chip);
        });
      }
      wrap.appendChild(bodyBox);
    }

    return wrap;
  }

  /* ---------- 主体 ---------- */
  function render() {
    el.innerHTML = '';
    el.appendChild(renderHeader());

    const body = document.createElement('div');
    body.style.cssText =
      'flex:1; overflow-y:auto; padding:8px 10px 12px; scrollbar-width:thin; ' +
      'scrollbar-color: rgba(34,211,238,.4) transparent;';
    body.className = 'pb-ex-drawer-body';

    const all = (window.__pbFuncPlotter && window.__pbFuncPlotter.getGroups)
      ? window.__pbFuncPlotter.getGroups() : [];
    const visible = viewMode === 'manage' ? all : all.filter((g) => !g.hidden);

    if (!visible.length) {
      const empty = document.createElement('div');
      empty.textContent = viewMode === 'manage'
        ? '还没有任何抽屉 · 点上方「＋ 新建」开始'
        : '（暂无可见抽屉 · 点上方「⚙ 管理」显示已隐藏的抽屉）';
      empty.style.cssText =
        'padding:34px 14px; text-align:center; color:#6b7a90; font-size:12px; line-height:1.8;';
      body.appendChild(empty);
    } else {
      visible.forEach((g) => body.appendChild(renderGroup(g)));
    }

    el.appendChild(body);

    // ★ 用 requestAnimationFrame 确保 DOM 高度计算完毕再定位，避免展开时跳动
    requestAnimationFrame(() => {
      if (typeof __positionExDrawer === 'function') __positionExDrawer();
    });
  }

  el._render = render;
  el._getViewMode = () => viewMode;
  render();
 document.body.appendChild(el);   // ★ 加上这一行，把抽屉挂载到页面上
  return el;
}

/* 全局刷新入口（供 tagFuncSave 等外部调用） */
window.__exDrawerElRefresh = function () {
  if (__exDrawerEl && typeof __exDrawerEl._render === 'function') {
    __exDrawerEl._render();
  } else if (typeof __refreshDrawer === 'function') {
    __refreshDrawer();
  }
};

function __exDrawerOutsideHandler(e) {
  if (__exDrawerMenuEl && __exDrawerMenuEl.contains(e.target)) return;
  if (__exDrawerManagerEl && __exDrawerManagerEl.contains(e.target)) return;
  if (__exDrawerEl && __exDrawerEl.contains(e.target)) return;
  if (__exDrawerAnchor && __exDrawerAnchor.input && e.target === __exDrawerAnchor.input) return;
  if (__exDrawerMenuEl) { __closeExDrawerMenu(); return; }
  __destroyExDrawer();
}

/* 刷新：保持锚点，重建抽屉 */
/* 刷新：优先原地重建（保留展开状态），失败再整体重建 */
function __refreshDrawer() {
  if (!__exDrawerEl || !__exDrawerAnchor) return;
  if (typeof __exDrawerEl._render === 'function') {
    __exDrawerEl._render();
    if (typeof __positionExDrawer === 'function') __positionExDrawer();
    return;
  }
  const input = __exDrawerAnchor.input;
  const pd = __exDrawerAnchor.pd;
  const groups = __normalizeExampleGroups(pd);
  __exDrawerEl.remove();
  __exDrawerEl = null;
  const el = __buildExDrawer(groups);
  __exDrawerEl = el;
  if (typeof __positionExDrawer === 'function') __positionExDrawer();
}
window.__pbOpenFuncManager = function (anchorInput) {
  const ta = anchorInput || document.querySelector('textarea[data-param-key="智能指令"]');
  if (!ta) { if (typeof toast === 'function') toast('找不到函数输入框', 2200); return; }
  __openManagerModal(ta);
};

/* 打开管理模态框 */
function __openManagerModal(input) {
  __closeExDrawerManager();
  const mask = document.createElement('div');
  mask.style.cssText =
    'position:fixed; inset:0; z-index:10000; background:rgba(4,10,22,.72); ' +
    'backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); ' +
    'display:flex; align-items:center; justify-content:center; padding:20px;';

  const card = document.createElement('div');
  card.style.cssText =
    'width:100%; max-width:640px; max-height:86vh; ' +
    'background:linear-gradient(160deg,rgba(24,36,60,.98),rgba(14,22,40,.98)); ' +
    'border:1px solid rgba(120,180,255,.28); border-radius:18px; ' +
    'display:flex; flex-direction:column; overflow:hidden; ' +
    'box-shadow:0 30px 80px rgba(0,8,24,.75);';

  const head = document.createElement('div');
  head.style.cssText =
    'padding:14px 18px; border-bottom:1px solid rgba(120,180,255,.14); ' +
    'display:flex; align-items:center; gap:10px;';
  const title = document.createElement('span');
  title.textContent = '⚙ 函数抽屉管理';
  title.style.cssText = 'flex:1; font-size:15px; color:#fff; font-weight:600;';
  head.appendChild(title);

  const mkBtn = (text, handler, primary) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.style.cssText =
      'height:28px; padding:0 12px; border-radius:7px; ' +
      'font-family:inherit; font-size:12px; cursor:pointer; ' +
      (primary
        ? 'background:linear-gradient(135deg,#38bdf8,#818cf8); color:#fff; border:none;'
        : 'background:rgba(120,180,255,.08); color:#b8c7de; border:1px solid rgba(120,180,255,.22);');
    b.addEventListener('click', handler);
    return b;
  };
  head.appendChild(mkBtn('＋ 新建抽屉', () => {
    const name = prompt('新抽屉名称：', '我的函数');
    if (!name) return;
    window.__pbFuncPlotter.addGroup(name);
    renderList();
    __refreshDrawer();
  }, true));
  head.appendChild(mkBtn('↺ 复原排列', () => {
    if (confirm('确定复原所有顺序吗？内置将回到默认，自定义排末尾。')) {
      if (window.__pbFuncPlotter && window.__pbFuncPlotter.resetOrder) {
        window.__pbFuncPlotter.resetOrder();
      }
      renderList();
      __refreshDrawer();
      if (typeof toast === 'function') toast('顺序已复原', 1800);
    }
  }, true));

  const closeBtn = mkBtn('✕', () => { mask.remove(); __exDrawerManagerEl = null; });
  head.appendChild(closeBtn);
  card.appendChild(head);

  const body = document.createElement('div');
  body.style.cssText = 'flex:1; overflow-y:auto; padding:12px 14px;';
  card.appendChild(body);

  function renderList() {
    body.innerHTML = '';
    const groups = window.__pbFuncPlotter.getGroups();
    groups.forEach(g => {
      const row = document.createElement('div');
      row.style.cssText =
        'padding:10px 12px; margin-bottom:8px; ' +
        'background:rgba(120,180,255,.04); border:1px solid rgba(120,180,255,.14); ' +
        'border-radius:10px;';

      const hRow = document.createElement('div');
      hRow.style.cssText = 'display:flex; align-items:center; gap:6px; margin-bottom:6px;';
      const nm = document.createElement('div');
      nm.textContent = g.name + (g.builtin ? '（内置）' : '');
      nm.style.cssText = 'flex:1; font-size:13.5px; color:#fff; font-weight:500;';
      hRow.appendChild(nm);

      if (!g.builtin) {
        hRow.appendChild(mkSmallBtn('↑', () => { window.__pbFuncPlotter.moveGroup(g.id, 'up'); renderList(); __refreshDrawer(); }));
        hRow.appendChild(mkSmallBtn('↓', () => { window.__pbFuncPlotter.moveGroup(g.id, 'down'); renderList(); __refreshDrawer(); }));
        hRow.appendChild(mkSmallBtn('✎', () => {
          const nn = prompt('新名称：', g.name);
          if (nn) { window.__pbFuncPlotter.renameGroup(g.id, nn); renderList(); __refreshDrawer(); }
        }));
        hRow.appendChild(mkSmallBtn('＋', () => {
          const code = prompt('函数文本（可多行）：', 'y = x^2');
          if (!code) return;
          const label = prompt('名称（可留空）：', '') || '';
          window.__pbFuncPlotter.addItem(g.id, label, code);
          renderList(); __refreshDrawer();
        }));
        hRow.appendChild(mkSmallBtn('✕', () => {
          if (!confirm('删除抽屉「' + g.name + '」及其所有函数？')) return;
          window.__pbFuncPlotter.deleteGroup(g.id);
          renderList(); __refreshDrawer();
        }, true));
      }
      row.appendChild(hRow);

      (g.items || []).forEach(it => {
        const iRow = document.createElement('div');
        iRow.style.cssText =
          'display:flex; align-items:center; gap:6px; padding:4px 8px; ' +
          'border-radius:6px; margin-top:3px; background:rgba(8,16,32,.5);';
        const lb = document.createElement('span');
        lb.textContent = it.label;
        lb.title = it.code;
        lb.style.cssText = 'flex:1; font-size:12px; color:#c8d5ea; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
        iRow.appendChild(lb);
        if (!g.builtin) {
          iRow.appendChild(mkSmallBtn('✎', () => {
            const code = prompt('编辑文本：', it.code);
            if (code == null) return;
            const label = prompt('名称：', it.label);
            if (label == null) return;
            window.__pbFuncPlotter.updateItem(g.id, it.id, { label: label || it.label, code });
            renderList(); __refreshDrawer();
          }));
          iRow.appendChild(mkSmallBtn('✕', () => {
            if (!confirm('删除「' + it.label + '」？')) return;
            window.__pbFuncPlotter.deleteItem(g.id, it.id);
            renderList(); __refreshDrawer();
          }, true));
        }
        row.appendChild(iRow);
      });

      body.appendChild(row);
    });

    /* 导入导出 */
    const ioRow = document.createElement('div');
    ioRow.style.cssText = 'display:flex; gap:8px; margin-top:12px; padding-top:12px; border-top:1px dashed rgba(120,180,255,.15);';
    ioRow.appendChild(mkBtn('📤 导出 JSON', () => {
      const text = window.__pbFuncPlotter.exportCustomGroups();
      tryCopyToClipboard(text);
      if (typeof toast === 'function') toast('已复制自定义抽屉 JSON 到剪贴板', 2200);
    }));
    ioRow.appendChild(mkBtn('📥 导入 JSON', () => {
      const text = prompt('粘贴 JSON（会追加到现有自定义抽屉）：');
      if (!text) return;
      if (window.__pbFuncPlotter.importCustomGroups(text, false)) {
        renderList(); __refreshDrawer();
        if (typeof toast === 'function') toast('已导入', 1800);
      } else {
        alert('导入失败：JSON 格式不对');
      }
    }));
    body.appendChild(ioRow);
  }

  function mkSmallBtn(text, handler, danger) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.style.cssText =
      'width:24px; height:24px; padding:0; border-radius:6px; ' +
      'border:1px solid ' + (danger ? 'rgba(248,113,113,.4)' : 'rgba(120,180,255,.25)') + '; ' +
      'background:' + (danger ? 'rgba(248,113,113,.1)' : 'rgba(120,180,255,.08)') + '; ' +
      'color:' + (danger ? '#fca5a5' : '#7dd3fc') + '; ' +
      'font-family:inherit; font-size:12px; cursor:pointer; flex:none;';
    b.addEventListener('click', handler);
    return b;
  }

  renderList();
  mask.appendChild(card);
  document.body.appendChild(mask);
  __exDrawerManagerEl = mask;
}

function tryCopyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }
}

/* 主入口：给 textarea 绑定点击 → 打开抽屉 · 容错版 */
/* 主入口：给 textarea 绑定点击 → 打开抽屉 · 容错版 */
function __attachExDrawerToTextarea(input, pd) {
  if (input.__pbExBound) return;
  input.__pbExBound = true;

  input.addEventListener('click', () => {
    // 再点一次同输入框 = 关闭
    if (__exDrawerEl && __exDrawerAnchor && __exDrawerAnchor.input === input) {
      __destroyExDrawer();
      return;
    }

    __destroyExDrawer();
    __exDrawerAnchor = { input, pd };

    // 每次打开时重新计算 groups
    const groups = __normalizeExampleGroups(pd);

    // 诊断日志（打开 F12 就能看到问题）
    console.log(
      '[funcDrawer] 打开抽屉：',
      'groups=', groups.length,
      '| __pbFuncPlotter=', !!window.__pbFuncPlotter,
      '| pd.exampleGroups=',
      (pd && pd.exampleGroups) ? pd.exampleGroups.length : 'undefined'
    );

    if (!groups.length) {
      const hasApi = !!(window.__pbFuncPlotter && typeof window.__pbFuncPlotter.getGroups === 'function');
      const hasLegacy = !!(pd && Array.isArray(pd.exampleGroups) && pd.exampleGroups.length);
      let msg = '抽屉打不开：';
      if (!hasApi && !hasLegacy) {
        msg += '未检测到 window.__pbFuncPlotter 和 exampleGroups，请检查 shapes-self.js 是否加载成功（F12 查看红色报错）';
      } else if (hasApi && !hasLegacy) {
        msg += 'window.__pbFuncPlotter.getGroups() 返回空，请检查数据层';
      } else {
        msg += '数据异常，请打开 F12 查看 [funcDrawer] 日志';
      }
      if (typeof toast === 'function') toast(msg, 6000);
      console.error('[funcDrawer] 诊断信息', {
        api: window.__pbFuncPlotter,
        groupsResult: (function () {
          try { return window.__pbFuncPlotter.getGroups(); }
          catch (e) { return 'ERROR: ' + (e && e.message); }
        })(),
        pdExampleGroups: pd && pd.exampleGroups
      });
      return;
    }

    const el = __buildExDrawer(groups);
    __exDrawerEl = el;
    __positionExDrawer();
  });
  
} // ★★★ 就是这行大括号，你刚才的代码里漏掉了它！



function buildParamsPanel() {
  const one = selection[0];
  if (!one) return;
  const def = PB.shapes[one.type];
  if (!def || !def.params || !def.params.length) {
    paramsBody.innerHTML = '<div style="color:#8fa3c0;font-size:13px;padding:8px;">该图形没有可调参数</div>';
    return;
  }
  paramsBody.innerHTML = '';
  for (const key of def.params) {
    const pd = PB.paramDefs && PB.paramDefs[key];
    if (!pd) continue;
    if (one[key] === undefined) one[key] = (pd.def !== undefined ? pd.def : pd.min);

    const block = document.createElement('div');
    block.className = 'pblock';

    if (pd.type === 'select') {
      const label = document.createElement('div');
      label.className = 'plabel';
      label.textContent = pd.label;
      const sel = document.createElement('select');
      sel.className = 'gm-input';
      (pd.options || []).forEach(op => {
        const o2 = document.createElement('option');
        o2.value = op.value; o2.textContent = op.label;
        if (op.css) o2.style.fontFamily = op.css;
        sel.appendChild(o2);
      });
      sel.value = one[key];
      sel.addEventListener('change', () => {
        one[key] = sel.value;
        if (isTextObj(one)) measureText(one);
        render(); drawPreview();
      });
      block.append(label, sel);
    }
    else if (pd.type === 'toggle') {
      const label = document.createElement('div');
      label.className = 'plabel';
      label.textContent = pd.label;
      const btn = document.createElement('button');
      btn.className = 'te-tg' + (one[key] ? ' on' : '');
      btn.textContent = one[key] ? '已开启' : '已关闭';
      btn.style.width = '100%';
      btn.addEventListener('click', () => {
        one[key] = !one[key];
        btn.classList.toggle('on', one[key]);
        btn.textContent = one[key] ? '已开启' : '已关闭';
        if (isTextObj(one)) measureText(one);
        render(); drawPreview();
      });
      block.append(label, btn);
    }
    /* ===== 单行 / 多行文本框 ===== */
    else if (pd.type === 'text' || pd.type === 'string' || pd.type === 'textarea') {
      const label = document.createElement('div');
      label.className = 'plabel';
      label.textContent = pd.label;

      const isMulti = pd.type === 'textarea';
      const inp = document.createElement(isMulti ? 'textarea' : 'input');
      if (!isMulti) inp.type = 'text';
      inp.className = 'gm-input';
      inp.value = one[key] == null ? '' : one[key];
      inp.style.fontFamily = 'ui-monospace, Menlo, Consolas, monospace';
      inp.style.fontSize = '13px';
      inp.style.letterSpacing = '0';
      if (pd.placeholder) inp.placeholder = pd.placeholder;
      if (isMulti) {
        inp.rows = pd.rows || 3;
        inp.style.height = 'auto';
        inp.style.minHeight = ((pd.rows || 3) * 20 + 16) + 'px';
        inp.style.resize = 'vertical';
        inp.style.paddingTop = '8px';
        inp.style.paddingBottom = '8px';
      }

      /* ★ 新增：给 textarea 加 data-param-key，供外部脚本（shapes-self.js）精确定位 */
      inp.dataset.paramKey = key;

      let timer = null;
      const commit = () => {
        one[key] = inp.value;
        if (isTextObj(one)) measureText(one);
        render(); drawPreview();
      };
      inp.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(commit, 180);
      });
      inp.addEventListener('change', () => { clearTimeout(timer); commit(); });
      if (!isMulti) {
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); commit(); }
        });
      }

      block.append(label, inp);

      /* 若该参数带 examples / exampleGroups，点击 textarea 时弹出示例抽屉 */
      if (typeof __attachExDrawerToTextarea === 'function') {
        __attachExDrawerToTextarea(inp, pd);
      }
    }
    /* ★ 新增：按钮类型 */
    else if (pd.type === 'button') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mbtn';
      btn.style.cssText =
        'width:100%; height:38px; margin-top:4px; font-size:13px; ' +
        (pd.danger ? 'background:linear-gradient(135deg,#f87171,#ef4444);' : '');
      btn.textContent = pd.label || '按钮';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          if (typeof pd.action === 'function') pd.action(one, e);
        } catch (err) {
          console.error('[param button]', err);
          if (typeof toast === 'function') toast('操作失败：' + (err && err.message ? err.message : err), 3000);
        }
      });
      block.appendChild(btn);
    }
    /* ===== range 滑杆分支 ===== */
    else {
      const label = document.createElement('div');
      label.className = 'plabel';
      label.innerHTML = escapeHtml(pd.label) + ' <b>' + one[key] + (pd.unit || '') + '</b>';
      const inp = document.createElement('input');
      inp.type = 'range'; inp.min = pd.min; inp.max = pd.max; inp.step = pd.step;
      inp.value = one[key];
      inp.addEventListener('input', () => {
        const v = +inp.value;
        one[key] = v;
        label.innerHTML = escapeHtml(pd.label) + ' <b>' + v + (pd.unit || '') + '</b>';
        if (isTextObj(one)) measureText(one);
        render(); drawPreview();
      });
      block.append(label, inp);
    }
    paramsBody.appendChild(block);
  }
}

function applyToSelection(fn) {
  for (const o of selection) fn(o);
  pages[pageIndex] = objects;
  render(); drawPreview(); updateSelBarPosition();
}

/* =====================================================================
 * 18b. 图片一键清晰
 * ===================================================================== */
let __enhTimer = null;
let __enhVersion = 0;

function loadImageFromSrc(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);       // ← 干净版本
    im.onerror = rej;
    im.src = src;
  });
}

function sharpenImageData(ctx, w, h, strength) {
  if (strength <= 0.01) return;
  let img;
  try { img = ctx.getImageData(0, 0, w, h); } catch (e) { return; }
  const d = img.data;
  const out = new Uint8ClampedArray(d);
  const s = Math.max(0, Math.min(1, strength));
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const center = d[i + ch] * (1 + 8 * s);
        const around = d[i - 4 + ch] + d[i + 4 + ch] +
                       d[i - w * 4 + ch] + d[i + w * 4 + ch] +
                       d[i - w * 4 - 4 + ch] + d[i - w * 4 + 4 + ch] +
                       d[i + w * 4 - 4 + ch] + d[i + w * 4 + 4 + ch];
        out[i + ch] = Math.max(0, Math.min(255, center - around * s));
      }
    }
  }
  try { ctx.putImageData(new ImageData(out, w, h), 0, 0); } catch (e) {}
}

async function enhanceImageObject(o, params) {
  if (!o || o.type !== '__image') return;
  if (!o._origImg) {
    try { o._origImg = await loadImageFromSrc(o.src); } catch (e) { return; }
  }
  const src = o._origImg;
  if (!src || !src.naturalWidth) return;
  const MAX = 2000;
  let w = src.naturalWidth, h = src.naturalHeight;
  const k = Math.min(1, MAX / Math.max(w, h));
  w = Math.max(1, Math.round(w * k));
  h = Math.max(1, Math.round(h * k));

  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c2 = cv.getContext('2d');
  try {
    c2.filter = 'contrast(' + params.contrast + ') brightness(' + params.brightness + ')';
  } catch (e) {}
  c2.drawImage(src, 0, 0, w, h);
  try { c2.filter = 'none'; } catch (e) {}

  sharpenImageData(c2, w, h, params.sharpen);

  let dataURL;
  try { dataURL = cv.toDataURL('image/jpeg', 0.92); }
  catch (e) { dataURL = cv.toDataURL('image/png'); }

  try {
    const newImg = await loadImageFromSrc(dataURL);
    o._img = newImg;
    o._enhanced = true;
    o._enhanceParams = { contrast: params.contrast, brightness: params.brightness, sharpen: params.sharpen };
    render(); drawPreview();
  } catch (e) {}
}

function scheduleEnhance(o, params) {
  clearTimeout(__enhTimer);
  const ver = ++__enhVersion;
  __enhTimer = setTimeout(async () => {
    if (ver !== __enhVersion) return;
    await enhanceImageObject(o, params);
  }, 150);
}

function readEnhanceParams() {
  return {
    contrast: parseFloat(document.getElementById('enhContrast').value) || 1,
    brightness: parseFloat(document.getElementById('enhBright').value) || 1,
    sharpen: parseFloat(document.getElementById('enhSharpen').value) || 0
  };
}

function buildEnhancePanel() {
  const one = selection[0];
  if (!one || one.type !== '__image') return;
  const p = one._enhanceParams || { contrast: 1.25, brightness: 1.08, sharpen: 0.4 };
  document.getElementById('enhContrast').value = p.contrast;
  document.getElementById('enhBright').value = p.brightness;
  document.getElementById('enhSharpen').value = p.sharpen;
  document.getElementById('enhContrastVal').textContent = (+p.contrast).toFixed(2);
  document.getElementById('enhBrightVal').textContent = (+p.brightness).toFixed(2);
  document.getElementById('enhSharpenVal').textContent = (+p.sharpen).toFixed(2);
}

['enhContrast','enhBright','enhSharpen'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    const p = readEnhanceParams();
    document.getElementById('enhContrastVal').textContent = p.contrast.toFixed(2);
    document.getElementById('enhBrightVal').textContent = p.brightness.toFixed(2);
    document.getElementById('enhSharpenVal').textContent = p.sharpen.toFixed(2);
    const one = selection[0];
    if (one && one.type === '__image') scheduleEnhance(one, p);
  });
});
document.getElementById('enhApply').addEventListener('click', () => {
  const one = selection[0];
  if (!one || one.type !== '__image') return;
  enhanceImageObject(one, readEnhanceParams());
});
document.getElementById('enhReset').addEventListener('click', () => {
  const one = selection[0];
  if (!one || one.type !== '__image') return;
  if (one._origImg) {
    one._img = one._origImg;
  } else if (one.src) {
    loadImageFromSrc(one.src).then(im => {
      one._img = im; one._origImg = im;
      render(); drawPreview();
    }).catch(() => {});
  }
  one._enhanced = false;
  one._enhanceParams = null;
  render(); drawPreview();
  toast('已恢复原图');
});

/* =====================================================================
 * 18c. 视频编辑面板
 * ===================================================================== */
function buildVideoEditPanel() {
  const one = selection[0];
  if (!one || one.type !== '__video') return;
  const sInp = document.getElementById('vidTrimStart');
  const eInp = document.getElementById('vidTrimEnd');
  sInp.value = (one.trimStart || 0).toFixed(1);
  eInp.value = (one.trimEnd || one.duration || 0).toFixed(1);
  const maxV = (one.duration || 999).toFixed(1);
  sInp.max = maxV; eInp.max = maxV;
  sInp.min = 0; eInp.min = 0;
}

document.getElementById('vidTrimStart').addEventListener('change', () => {
  const one = selection[0];
  if (!one || one.type !== '__video') return;
  let v = Math.max(0, parseFloat(document.getElementById('vidTrimStart').value) || 0);
  const endV = (one.trimEnd != null ? one.trimEnd : (one.duration || 0));
  if (v >= endV) v = Math.max(0, endV - 0.1);
  one.trimStart = v;
  document.getElementById('vidTrimStart').value = v.toFixed(1);
  if (one._videoEl) try { one._videoEl.currentTime = v; } catch (e) {}
});
document.getElementById('vidTrimEnd').addEventListener('change', () => {
  const one = selection[0];
  if (!one || one.type !== '__video') return;
  let v = Math.max(0.1, parseFloat(document.getElementById('vidTrimEnd').value) || 0);
  if (one.duration && v > one.duration) v = one.duration;
  if (v <= (one.trimStart || 0)) v = (one.trimStart || 0) + 0.1;
  one.trimEnd = v;
  document.getElementById('vidTrimEnd').value = v.toFixed(1);
});
document.getElementById('vidSetStart').addEventListener('click', () => {
  const one = selection[0];
  if (!one || one.type !== '__video' || !one._videoEl) { toast('视频尚未加载完成'); return; }
  const t = one._videoEl.currentTime;
  one.trimStart = t;
  document.getElementById('vidTrimStart').value = t.toFixed(1);
});
document.getElementById('vidSetEnd').addEventListener('click', () => {
  const one = selection[0];
  if (!one || one.type !== '__video' || !one._videoEl) { toast('视频尚未加载完成'); return; }
  const t = one._videoEl.currentTime;
  one.trimEnd = t;
  document.getElementById('vidTrimEnd').value = t.toFixed(1);
});
document.getElementById('vidPreview').addEventListener('click', () => {
  const one = selection[0];
  if (!one || one.type !== '__video' || !one._videoEl) { toast('视频尚未加载完成'); return; }
  try { one._videoEl.currentTime = one.trimStart || 0; } catch (e) {}
  try { one._videoEl.play(); } catch (e) {}
  one.playing = true;
  startAnimLoop();
  updateSelBar();
});
/* =====================================================================
 * 19. 对象创建
 * ===================================================================== */
function newBase(def) {
  const base = {
    color: state.penColor, size: state.penSize, hasBorder: true,
    dash: state.penDash || 'solid',
    fill: false,
    fillColor: state.fillColor,
    fillAlpha: state.fillAlpha,
    rotation: 0
  };
  if (def) {
    const bc = def.color || def.stroke || def.strokeColor || def.borderColor;
    if (typeof bc === 'string') base.color = bc;
    if (typeof def.lineWidth === 'number') base.size = def.lineWidth;
    else if (typeof def.strokeWidth === 'number') base.size = def.strokeWidth;
    else if (typeof def.size === 'number') base.size = def.size;
    const bd = def.dash || def.lineStyle;
    if (typeof bd === 'string') base.dash = bd;
    if (def.hasBorder === false || def.noBorder === true) base.hasBorder = false;

    const fc = def.fillColor || def.fillStyle;
    if (typeof fc === 'string') base.fillColor = fc;
    if (typeof def.fillAlpha === 'number') base.fillAlpha = def.fillAlpha;

    if (def.defaultFill === true) {
      base.fill = true;
    }

    if (state.fillActive) {
      base.fill = true;
      base.fillColor = state.fillColor;
      base.fillAlpha = state.fillAlpha;
    }

    if (def.geom === 'text') {
      const td = (def.textDefaults && typeof def.textDefaults === 'object') ? def.textDefaults : def;
      if (typeof td.fontFamily === 'string') base.fontFamily = td.fontFamily;
      if (typeof td.fontSize === 'number') base.fontSize = td.fontSize;
      if (typeof td.bold === 'boolean') base.bold = td.bold;
      if (typeof td.italic === 'boolean') base.italic = td.italic;
      if (typeof td.underline === 'boolean') base.underline = td.underline;
      if (typeof td.textAlign === 'string') base.textAlign = td.textAlign;
      if (typeof td.color === 'string') base.color = td.color;
    }
  }
  return base;
}

function createShapeAt(p) {
  const type = state.tool;
  const def = PB.shapes[type];
  if (!def) return null;
  const base = newBase(def);
  let o;
  if (def.geom === 'path') o = Object.assign({ type, points: [{x:p.x, y:p.y}] }, base);
  else if (def.geom === 'text') {
    o = Object.assign({
      type, x:p.x, y:p.y, text:'',
      fontSize: base.fontSize || state.textSize || 32,
      fontFamily: base.fontFamily || state.textFontFamily || 'system',
      bold: (base.bold != null) ? base.bold : !!state.textBold,
      italic: (base.italic != null) ? base.italic : !!state.textItalic,
      underline: (base.underline != null) ? base.underline : !!state.textUnderline,
      textAlign: base.textAlign || 'left'
    }, base);
  }
  else {
    o = Object.assign({ type, x1:p.x, y1:p.y, x2:p.x, y2:p.y }, base);
    if (def.params && PB.paramDefs) {
      for (const k of def.params) if (PB.paramDefs[k]) o[k] = PB.paramDefs[k].def;
    }
  }
  if (def.animatable) { o.animT = 0; o.animPlaying = false; o.animSpeed = 1; }
if (def.defaultSize) { o.x2 = o.x1 + def.defaultSize.w; o.y2 = o.y1 + def.defaultSize.h; }
  return o;
}
function isMeaningful(o) {
  if (!o) return false;
  if (o.points) return o.points.length > 0;
  if (isTextObj(o)) return !!o.text;
  return Math.hypot(o.x2 - o.x1, o.y2 - o.y1) > 4 / view.scale;
}

/* =====================================================================
 * 20. 橡皮擦逻辑
 * ===================================================================== */
function doEraseAt(worldPt, radius) {
  const touched = findObjectsAt(worldPt, radius);
  if (!touched.length) return;
  eraseDirty = true;
  for (const o of touched) {
    if (!erasedThisStroke.has(o)) {
      erasedThisStroke.add(o);
      if (o._mask) {
        o._mask = cloneCanvas(o._mask);
      } else {
        ensureMask(o);
      }
    }
    applyEraseToObj(o, worldPt, radius);
  }
}
function eraseStart(e) {
  drawing = true; erasing = true; eraseDirty = false;
  erasedThisStroke = new Set();
  const pt = screenToWorld(e.clientX, e.clientY);
  lastErasePt = pt; lastHoverPt = pt;
  lastEraserRadius = getEraserRadius(e);
  doEraseAt(pt, lastEraserRadius);
  render(); drawPreview();
}
function eraseMove(e) {
  const pt = screenToWorld(e.clientX, e.clientY);
  lastHoverPt = pt;
  lastEraserRadius = getEraserRadius(e);
  if (!lastErasePt) {
    lastErasePt = pt;
    doEraseAt(pt, lastEraserRadius);
  } else {
    const dx = pt.x - lastErasePt.x, dy = pt.y - lastErasePt.y;
    const dist = Math.hypot(dx, dy);
    const step = Math.max(1, Math.min(lastEraserRadius * 0.4, 6 / view.scale));
    const steps = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      doEraseAt({ x: lastErasePt.x + dx * t, y: lastErasePt.y + dy * t }, lastEraserRadius);
    }
    lastErasePt = pt;
  }
  render(); drawPreview();
}
function eraseEnd() {
  erasing = false; drawing = false;
  if (eraseDirty) {
    for (const o of erasedThisStroke) {
      if (o._mask) thresholdMask(o._mask);
    }
    pushSnapshot();
    eraseDirty = false;
  }
  lastErasePt = null;
  erasedThisStroke = new Set();
}

/* =====================================================================
 * 20.5 特殊点吸附
 * ===================================================================== */
const SNAP_DEFAULT_RADIUS = 12;
const SNAP_LS_ENABLED = 'pb_snap_enabled';
const SNAP_LS_RADIUS  = 'pb_snap_radius';
let snapRadius = SNAP_DEFAULT_RADIUS;
let snapCache = null;
let snapIndicator = null;
let snapEnabled = true;

function loadSnapSettings() {
  try {
    const se = localStorage.getItem(SNAP_LS_ENABLED);
    if (se === 'off') snapEnabled = false;
    else if (se === 'on') snapEnabled = true;
    const sr = parseInt(localStorage.getItem(SNAP_LS_RADIUS), 10);
    if (!isNaN(sr)) snapRadius = Math.max(4, Math.min(40, sr));
  } catch (e) {}
  syncSnapUI();
}
function syncSnapUI() {
  const row = document.getElementById('snapToggleRow');
  if (row) {
    row.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', (b.dataset.val === 'on') === snapEnabled);
    });
  }
  const slider = document.getElementById('snapRadius');
  const valEl  = document.getElementById('snapRadiusVal');
  const block  = document.getElementById('snapRadiusBlock');
  if (slider) {
    slider.value = snapRadius;
    slider.disabled = !snapEnabled;
  }
  if (block) {
    block.style.opacity = snapEnabled ? '1' : '.45';
    block.style.pointerEvents = snapEnabled ? '' : 'none';
  }
  if (valEl) valEl.textContent = snapRadius + ' px';
}
function collectSnapPoints(excludeSet) {
  const pts = [];
  const add = (x, y) => {
    if (typeof x === 'number' && typeof y === 'number' && isFinite(x) && isFinite(y)) {
      pts.push({ x: x, y: y });
    }
  };
  for (const o of objects) {
    if (excludeSet && excludeSet.has(o)) continue;
    const b = getWorldBBox(o);
    if (!isFinite(b.x1) || !isFinite(b.y1) || !isFinite(b.x2) || !isFinite(b.y2)) continue;
    const cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
    add(b.x1, b.y1); add(b.x2, b.y1); add(b.x2, b.y2); add(b.x1, b.y2);
    add(cx, cy);
    add(cx, b.y1); add(cx, b.y2); add(b.x1, cy); add(b.x2, cy);

    const ctr = objCenter(o);
    const rot = o.rotation || 0;

    if (o.points && o.points.length) {
      const arr = o.points;
      const step = Math.max(1, Math.ceil(arr.length / 50));
      for (let i = 0; i < arr.length; i += step) {
        const w = rotatePt(arr[i], ctr, rot);
        add(w.x, w.y);
      }
      const wp = rotatePt(arr[arr.length - 1], ctr, rot);
      add(wp.x, wp.y);
    } else {
      const verts = getVertices(o);
      if (verts && verts.length) {
        const wv = [];
        for (let i = 0; i < verts.length; i++) wv.push(rotatePt(verts[i], ctr, rot));
        for (let i = 0; i < wv.length; i++) add(wv[i].x, wv[i].y);
        if (wv.length <= 40) {
          for (let i = 0; i < wv.length; i++) {
            const a = wv[i], c = wv[(i + 1) % wv.length];
            add((a.x + c.x) / 2, (a.y + c.y) / 2);
          }
        }
      }
    }
  }
  return pts;
}
function beginSnap(excludeSet) {
  if (!snapEnabled) { snapCache = null; snapIndicator = null; return; }
  snapCache = collectSnapPoints(excludeSet);
  snapIndicator = null;
}
function endSnap() {
  snapCache = null;
  snapIndicator = null;
}
function findSnap(pt, radius) {
  if (!snapEnabled || !snapCache || !snapCache.length) return null;
  const R = (radius || snapRadius) / view.scale;
  let best = null, bestD = R;
  for (let i = 0; i < snapCache.length; i++) {
    const c = snapCache[i];
    const d = Math.hypot(c.x - pt.x, c.y - pt.y);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
function computeSnapFix(items) {
  if (!snapEnabled || !snapCache || !snapCache.length) { snapIndicator = null; return null; }
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const it of items) {
    const b = getWorldBBox(it.obj);
    if (!isFinite(b.x1)) continue;
    if (b.x1 < x1) x1 = b.x1;
    if (b.y1 < y1) y1 = b.y1;
    if (b.x2 > x2) x2 = b.x2;
    if (b.y2 > y2) y2 = b.y2;
  }
  if (!isFinite(x1)) { snapIndicator = null; return null; }
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const probes = [
    { x:x1, y:y1 }, { x:x2, y:y1 }, { x:x2, y:y2 }, { x:x1, y:y2 },
    { x:mx, y:my }, { x:mx, y:y1 }, { x:mx, y:y2 },
    { x:x1, y:my }, { x:x2, y:my }
  ];
  let best = null, bestD = snapRadius / view.scale;
  for (const p of probes) {
    const s = findSnap(p);
    if (!s) continue;
    const d = Math.hypot(s.x - p.x, s.y - p.y);
    if (d < bestD) { bestD = d; best = { from: p, to: s }; }
  }
  if (!best) { snapIndicator = null; return null; }
  snapIndicator = best.to;
  return { dx: best.to.x - best.from.x, dy: best.to.y - best.from.y };
}
function drawSnapIndicator() {
  if (!snapIndicator) return;
  const k = 1 / view.scale;
  const x = snapIndicator.x, y = snapIndicator.y;
  pctx.save();
  pctx.lineWidth = 1.6 * k;
  pctx.strokeStyle = 'rgba(56,189,248,.95)';
  pctx.shadowColor = 'rgba(56,189,248,.8)';
  pctx.shadowBlur = 8 * k;
  pctx.beginPath();
  pctx.arc(x, y, 6.5 * k, 0, Math.PI * 2);
  pctx.stroke();
  pctx.beginPath();
  pctx.moveTo(x - 13 * k, y); pctx.lineTo(x - 5 * k, y);
  pctx.moveTo(x + 5 * k, y);  pctx.lineTo(x + 13 * k, y);
  pctx.moveTo(x, y - 13 * k); pctx.lineTo(x, y - 5 * k);
  pctx.moveTo(x, y + 5 * k);  pctx.lineTo(x, y + 13 * k);
  pctx.stroke();
  pctx.restore();
}

function snapLineAngle(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < LINE_SNAP_MIN_LEN) return null;

  const a = Math.atan2(dy, dx);
  let folded, toTarget;
  if (a >= 0 && a <= Math.PI / 2)      { folded = a;             toTarget = r => r; }
  else if (a > Math.PI / 2)            { folded = Math.PI - a;   toTarget = r => Math.PI - r; }
  else if (a >= -Math.PI / 2)          { folded = -a;            toTarget = r => -r; }
  else                                 { folded = Math.PI + a;   toTarget = r => r - Math.PI; }

  let bestR = null, bestD = LINE_SNAP_TOL;
  for (let i = 0; i < LINE_SNAP_ANGLES.length; i++) {
    const r = LINE_SNAP_ANGLES[i] * Math.PI / 180;
    const diff = Math.abs(folded - r);
    if (diff < bestD) { bestD = diff; bestR = r; }
  }
  if (bestR === null) return null;

  const target = toTarget(bestR);
  return { x: x1 + Math.cos(target) * len, y: y1 + Math.sin(target) * len };
}
const TRI_SNAP_ANGLES = [30, 37, 45, 53, 60];
const TRI_SNAP_TOL = 2 * Math.PI / 180;

function snapTriAngle(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < LINE_SNAP_MIN_LEN) return null;

  const angle = Math.atan2(Math.abs(dy), Math.abs(dx));
  let bestR = null, bestD = TRI_SNAP_TOL;
  for (let i = 0; i < TRI_SNAP_ANGLES.length; i++) {
    const r = TRI_SNAP_ANGLES[i] * Math.PI / 180;
    const diff = Math.abs(angle - r);
    if (diff < bestD) { bestD = diff; bestR = r; }
  }
  if (bestR === null) return null;

  const signX = dx >= 0 ? 1 : -1;
  const signY = dy >= 0 ? 1 : -1;
  return {
    x: x1 + signX * len * Math.cos(bestR),
    y: y1 + signY * len * Math.sin(bestR)
  };
}

/* =====================================================================
 * 21. 指针交互
 * ===================================================================== */
function tryStartInteractiveDrag(pt, e) {
  if (e.ctrlKey || e.metaKey) return false;   // Ctrl 用于克隆拖动

  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    const d = PB.shapes[o.type];
    if (!d || !d.interactive) continue;
    if (!hitTest(o, pt)) continue;

    /* 已选中 + 落在控制点/顶点上 → 交回 selectDown（缩放 / 旋转） */
    if (selection.length === 1 && selection[0] === o) {
      if (hitHandle(o, pt) || hitVertex(o, pt) !== null) return false;
    }

    /* ★ 新增：靠近外边框 → 移动整体（不改视图） */
    const b = getBBox(o);
    const k = 1 / view.scale;
    const edgeBand = Math.min(12 * k, Math.min(b.w, b.h) * 0.15);
    const minDist = Math.min(
      pt.x - b.x1, b.x2 - pt.x,
      pt.y - b.y1, b.y2 - pt.y
    );
    if (e.altKey || minDist < edgeBand) {
      return false;   // 交回 selectDown 走 move 分支
    }


    /* ★ 优先让图形自己处理点击（滑杆、按钮等内部控件） */
    if (typeof d.onClick === 'function') {
      const handled = d.onClick(o, {
        worldPt: pt,
        requestRedraw: () => { render(); drawPreview(); }
      });
      if (handled) {
        interactiveDrag = {
          obj: o,
          startPt: pt,
          startView: Object.assign({}, o._view),
          gestureHandled: true
        };
        drawing = true;
        setCursor('grabbing');
        if (selection.length !== 1 || selection[0] !== o) {
          selection = [o];
          updateSelBar();
        }
        return true;
      }
    }



    /* 内部拖动 → 平移视图 */
    if (!o._view) o._view = { cx: 0, cy: 0, xHalf: 6, yHalf: 4 };
    if (typeof o._bw !== 'number' || typeof o._bh !== 'number') {
      o._bw = b.w; o._bh = b.h;
    }
    if (typeof o._bx1 !== 'number') o._bx1 = b.x1;
    if (typeof o._by1 !== 'number') o._by1 = b.y1;

    interactiveDrag = {
      obj: o,
      startPt: pt,
      startView: Object.assign({}, o._view)
    };
    drawing = true;
    setCursor('grabbing');
    if (selection.length !== 1 || selection[0] !== o) {
      selection = [o];
      updateSelBar();
    }
    return true;
  }
  return false;
}


function onPointerDown(e) {
  if (e.pointerType === 'mouse') {
    if (e.button === 1) {
      e.preventDefault();
      panState = { id: e.pointerId, startX: e.clientX, startY: e.clientY,
                   ox: view.offsetX, oy: view.offsetY };
      setCursor('grabbing');
      return;
    }
    if (e.button !== 0) return;
  }

  if (e.pointerType === 'pen') penActive = true;

  const onCanvas = e.target && e.target.tagName === 'CANVAS';

  if (e.pointerType === 'touch' && isPalm(e)) {
    if (penActive || activePointers.size > 0) return;
    palmPointerId = e.pointerId;
    if (palmPrevTool === null) {
      palmPrevTool = state.tool;
      if (state.tool !== 'eraser') setTool('eraser');
    }
    eraseStart(e);
    return;
  }

  if (e.pointerType !== 'mouse' && onCanvas) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size >= 2) {
      abortCurrentOp();
      startGesture();
      return;
    }
  }

if (textEditorEl) {
  const isMathLive = e.target && e.target.closest && (
    e.target.closest('math-field') || 
    e.target.closest('math-virtual-keyboard') || 
    e.target.closest('.ML__keyboard') ||
    e.target.closest('.ML__popover')
  );

  /* ★ 新增：允许点击 / 拖拽 ghost 浮块，不关闭编辑器 */
  const isGhost = e.target && e.target.closest && e.target.closest('.te-formula-ghost');

  if (textEditorEl.contains(e.target) || isMathLive || isGhost) {
    return;
  }

  commitTextEditor();
  return;
}

  if (!onCanvas) return;
  e.preventDefault();
  hideMenu();

  const pt = screenToWorld(e.clientX, e.clientY);
if (state.tool === 'select') {
  if (tryStartInteractiveDrag(pt, e)) return;   // ★ 新增
  selectDown(pt, e);
}
  else if (state.tool === 'pen') penDown(pt);
  else if (state.tool === 'eraser') eraseStart(e);
  else if (isShapeTool(state.tool)) shapeDown(pt);
}

function onPointerMove(e) {
  if (panState && e.pointerId === panState.id) {
    view.offsetX = panState.ox + (e.clientX - panState.startX);
    view.offsetY = panState.oy + (e.clientY - panState.startY);
    render(); drawPreview();
    if (selBar.classList.contains('show')) updateSelBarPosition();
    if (typeof positionTextEditor === 'function') positionTextEditor();
    return;
  }

  if (activePointers.has(e.pointerId)) {
    const p = activePointers.get(e.pointerId);
    p.x = e.clientX; p.y = e.clientY;
  }

  if (gesture && activePointers.size >= 2) {
    applyGesture();
    if (selBar.classList.contains('show')) updateSelBarPosition();
    if (typeof positionTextEditor === 'function') positionTextEditor();
    return;
  }

  if (e.pointerId === palmPointerId) {
    if (erasing) eraseMove(e);
    return;
  }

  if (ignorePointers.has(e.pointerId)) return;

  if (state.tool === 'eraser') {
    lastHoverPt = screenToWorld(e.clientX, e.clientY);
    lastEraserRadius = getEraserRadius(e);
    if (erasing) eraseMove(e);
    else drawPreview();
    return;
  }

  /* ★ 新增：图形内交互平移 */
  if (interactiveDrag) {
    const pt = screenToWorld(e.clientX, e.clientY);
    const o = interactiveDrag.obj;
    const def = PB.shapes[o.type];

    /* ★ 优先交给图形自己的 onDrag 处理 */
    if (def && typeof def.onDrag === 'function') {
      const handled = def.onDrag(o, {
        worldPt: pt,
        startPt: interactiveDrag.startPt,
        requestRedraw: () => { render(); drawPreview(); }
      });
      if (handled) {
        render(); drawPreview();
        if (selBar.classList.contains('show')) updateSelBarPosition();
        return;
      }
    }


    if (def && typeof def.onPan === 'function' && interactiveDrag.startView) {
      def.onPan(o,
        pt.x - interactiveDrag.startPt.x,
        pt.y - interactiveDrag.startPt.y,
        interactiveDrag.startView);
    }
    render(); drawPreview();
    if (selBar.classList.contains('show')) updateSelBarPosition();
    return;
  }

  if (!drawing) {
    if (state.tool === 'select' && e.target.tagName === 'CANVAS') hoverCursor(e);
    return;
  }
  const pt = screenToWorld(e.clientX, e.clientY);
  if (state.tool === 'select') { selectMove(pt, e); return; }
  if (!current) return;

  if (current.points) {
    const last = current.points[current.points.length - 1];
    if (Math.hypot(pt.x - last.x, pt.y - last.y) < 1.2 / view.scale) return;
    current.points.push(pt);
  } else {
    const def = PB.shapes[current.type];
    const isLine = !!(def && def.geom === 'line');
    let end = pt;
    let angleLocked = false;

    if (e.shiftKey) {
      const dx = pt.x - current.x1, dy = pt.y - current.y1;
      if (isLine) {
        const len = Math.hypot(dx, dy), step = Math.PI / 4;
        const ang = Math.round(Math.atan2(dy, dx) / step) * step;
        end = { x: current.x1 + Math.cos(ang) * len, y: current.y1 + Math.sin(ang) * len };
      } else {
        const s = Math.max(Math.abs(dx), Math.abs(dy));
        end = { x: current.x1 + Math.sign(dx || 1) * s, y: current.y1 + Math.sign(dy || 1) * s };
      }
    } else if (isLine && !e.altKey) {
      const sa = snapLineAngle(current.x1, current.y1, pt.x, pt.y);
      if (sa) {
        end = { x: sa.x, y: sa.y };
        angleLocked = true;
      }
    } else if (current.type === 'isoTriangle' && !e.altKey) {
      const dxW = Math.abs(pt.x - current.x1);
      const dyH = Math.abs(pt.y - current.y1);
      if (dxW > 6 && dyH > 6) {
        const theta = Math.atan2(dyH, dxW / 2) * 180 / Math.PI;
        if (Math.abs(theta - 60) < 3) {
          const targetH = (dxW / 2) * Math.sqrt(3);
          const signY = (pt.y >= current.y1) ? 1 : -1;
          end = { x: pt.x, y: current.y1 + signY * targetH };
          angleLocked = true;
        }
      }
    } else if (current.type === 'rightTriangle' && !e.altKey) {
      const sa = snapTriAngle(current.x1, current.y1, pt.x, pt.y);
      if (sa) {
        end = { x: sa.x, y: sa.y };
        angleLocked = true;
      }
    }

    if (e.altKey) {
      snapIndicator = null;
    } else if (angleLocked) {
      snapIndicator = { x: end.x, y: end.y };
    } else {
      const sp = findSnap(end);
      if (sp) { end = { x: sp.x, y: sp.y }; snapIndicator = sp; }
      else snapIndicator = null;
    }

    current.x2 = end.x; current.y2 = end.y;
  }
  drawPreview();
}

function onPointerUp(e) {
  if (e.pointerType === 'pen') penActive = false;

  if (panState && e.pointerId === panState.id) {
    panState = null;
    setCursor(state.tool === 'select' ? 'default' : (state.tool === 'eraser' ? 'none' : 'crosshair'));
    return;
  }

  if (e.pointerId === palmPointerId) {
    eraseEnd();
    palmPointerId = null;
    if (palmPrevTool !== null && palmPrevTool !== 'eraser') setTool(palmPrevTool, true);
    palmPrevTool = null;
    return;
  }

  if (ignorePointers.has(e.pointerId)) {
    ignorePointers.delete(e.pointerId);
    activePointers.delete(e.pointerId);
    return;
  }

  if (activePointers.has(e.pointerId)) activePointers.delete(e.pointerId);

  if (gesture) {
    if (activePointers.size < 2) {
      gesture = null;
      for (const id of activePointers.keys()) ignorePointers.add(id);
    }
    return;
  }

  if (!drawing) return;

  /* ★ 新增：结束图形内交互 */
  if (interactiveDrag) {
    const o = interactiveDrag.obj;
    const def = o && PB.shapes[o.type];
    if (def && typeof def.onDragEnd === 'function') {
      try {
        def.onDragEnd(o, {
          requestRedraw: () => { render(); drawPreview(); }
        });
      } catch (err) { console.warn('[interactiveDrag] onDragEnd 出错：', err); }
    }
    interactiveDrag = null;
    drawing = false;
    setCursor(state.tool === 'select' ? 'default' : 'crosshair');
    render(); drawPreview();
    return;
  }


  if (erasing) { eraseEnd(); endSnap(); return; }
  endSnap();
  drawing = false;
  if (state.tool === 'select') {
    if (selState && selState.mode === 'marquee') finalizeMarquee();
    else if (selState && selState.changed && !selState.snapshotDone) {
      if (selState.mode === 'resize' && selState.lastAnchor && selection[0] && selection[0]._mask) {
        try {
          remapMask(selection[0], selState.startBBox, selState.lastAnchor,
                    selState.lastSX || 1, selState.lastSY || 1);
        } catch (err) {}
      }
      pushSnapshot();
    }
    selState = null; marquee = null;
    render(); drawPreview(); updateSelBar();
    return;
  }
  if (current && isMeaningful(current)) {
    objects.push(current);
    pages[pageIndex] = objects;
    pushSnapshot();
    const wasShape = isShapeTool(state.tool);
    current = null;
    render(); drawPreview();
    if (wasShape) setTool('select');
  } else {
    current = null;
    render(); drawPreview();
  }
}

function penDown(pt) {
  current = {
    type: '__freehand', points: [{x:pt.x, y:pt.y}],
    color: state.penColor, size: state.penSize,
    hasBorder: true, dash: state.penDash || 'solid',
    fill: false, rotation: 0
  };
  drawing = true; drawPreview();
}
function shapeDown(pt) {
  const def = PB.shapes[state.tool];
  if (def && def.geom === 'text') {
    startNewText(pt);
    return;
  }
  current = createShapeAt(pt);
  if (!current) return;
  beginSnap(null);
  drawing = true; drawPreview();
}
function selectDown(pt, e) {
  const ctrl = e.ctrlKey || e.metaKey;
  const shift = e.shiftKey;
  if (selection.length === 1 && !ctrl && !shift) {
    const o = selection[0];
    const vi = hitVertex(o, pt);
    if (vi !== null) {
      selState = { mode:'vertex', index:vi, startGeo:cloneGeo(o), startPt:pt, changed:false };
      beginSnap(new Set([o]));
      drawing = true; return;
    }
    const h = hitHandle(o, pt);
    if (h) {
      selState = {
        mode: h.id === 'rotate' ? 'rotate' : 'resize',
        handleId: h.id, startGeo: cloneGeo(o), startBBox: getBBox(o),
        startPt: pt, startRotation: o.rotation || 0, changed: false,
        lastAnchor: null, lastSX: 1, lastSY: 1
      };
      beginSnap(new Set([o]));
      drawing = true; return;
    }
  }
  let hit = null;
  for (let i = objects.length - 1; i >= 0; i--) {
    if (hitTest(objects[i], pt)) { hit = objects[i]; break; }
  }
  if (hit) {
    /* 【新】Ctrl+左键拖动 = 克隆拖动；Ctrl+Shift+左键拖动 = 克隆并锁定轴向 */
    if (ctrl) {
      let sources;
      if (selection.indexOf(hit) >= 0 && selection.length > 0) {
        sources = selection.slice();
      } else {
        sources = [hit];
        selection = [hit];
        updateSelBar();
      }
      selState = {
        mode: 'clone',
        sources: sources,
        startGeos: sources.map(o => cloneGeo(o)),
        startPt: pt,
        clones: null,
        changed: false,
        snapshotDone: false,
        lockAxis: !!shift
      };
      drawing = true; setCursor('copy'); return;
    }
    if (cloneMode) {
      let sources;
      if (selection.indexOf(hit) >= 0 && selection.length > 0) {
        sources = selection.slice();
      } else {
        sources = [hit];
        selection = [hit];
        updateSelBar();
      }
      selState = {
        mode: 'clone',
        sources: sources,
        startGeos: sources.map(o => cloneGeo(o)),
        startPt: pt,
        clones: null,
        changed: false,
        snapshotDone: false,
        lockAxis: false
      };
      drawing = true; setCursor('copy'); return;
    }
    if (shift) {
      const i = selection.indexOf(hit);
      if (i >= 0) selection.splice(i, 1); else selection.push(hit);
      updateSelBar(); drawPreview(); return;
    }
    if (selection.indexOf(hit) < 0) selection = [hit];
    updateSelBar();
    selState = {
      mode: 'move', startPt: pt, changed: false,
      items: selection.map(o => ({ obj:o, geo:cloneGeo(o) }))
    };
    beginSnap(new Set(selection));
    drawing = true; setCursor('move');
    return;
  }
  if (!ctrl && !shift) { selection = []; updateSelBar(); }
  marquee = { points: [{ x: pt.x, y: pt.y }] };
  selState = { mode:'marquee', startPt:pt, additive: ctrl || shift };
  drawing = true; setCursor('crosshair');
}
function finalizeMarquee() {
  if (!marquee || !marquee.points) return;
  const poly = marquee.points;
  if (poly.length < 3) return;

  /* 太小就当作单击空白，不选任何东西 */
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  if ((maxX - minX) < 4 / view.scale && (maxY - minY) < 4 / view.scale) return;

  const picked = objects.filter(o => polygonIntersectsObject(poly, o));
  if (selState.additive) {
    for (const o of picked) if (selection.indexOf(o) < 0) selection.push(o);
  } else {
    selection = picked;
  }
}
function selectMove(pt, e) {
  if (!drawing || !selState) return;

   if (selState.mode === 'clone') {
    let dx = pt.x - selState.startPt.x, dy = pt.y - selState.startPt.y;
    /* 【新】锁定轴向：Ctrl+Shift 拖动时只允许水平或竖直 */
    if (selState.lockAxis) {
      if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
      else dx = 0;
    }
    if (!selState.clones) {
      if (Math.hypot(dx, dy) < 4 / view.scale) return;
      selState.clones = selState.sources.map(o => {
        const c = copyObj(o);
        if (o._mask) c._mask = cloneCanvas(o._mask);
        if (o._img) c._img = o._img;
        if (o._videoEl) { c._videoEl = o._videoEl; c._blobUrl = o._blobUrl; }
        if (o._origImg) c._origImg = o._origImg;
        return c;
      });
      objects.push(...selState.clones);
      pages[pageIndex] = objects;
      selection = selState.clones.slice();
      selState.changed = true;
      selState.snapshotDone = true;
      pushSnapshot();
      updateSelBar();
    }
    for (let i = 0; i < selState.clones.length; i++) {
      const c = selState.clones[i];
      applyGeo(c, selState.startGeos[i]);
      translateObj(c, dx, dy);
    }
    render(); drawPreview(); updateSelBarPosition();
    return;
  }

  if (selState.mode === 'marquee') {
    if (!marquee) marquee = { points: [{ x: selState.startPt.x, y: selState.startPt.y }] };
    const pts = marquee.points;
    const last = pts[pts.length - 1];
    const minDist = 2 / view.scale;   // 屏幕 2px 以内不记录，防止点爆
    if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= minDist) {
      pts.push({ x: pt.x, y: pt.y });
    }
    drawPreview(); return;
  }
  if (selState.mode === 'move') {
    let dx = pt.x - selState.startPt.x, dy = pt.y - selState.startPt.y;
    if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    if (dx || dy) selState.changed = true;
    for (const it of selState.items) { applyGeo(it.obj, it.geo); translateObj(it.obj, dx, dy); }
    if (!e.altKey) {
      const fix = computeSnapFix(selState.items);
      if (fix) for (const it of selState.items) translateObj(it.obj, fix.dx, fix.dy);
    } else {
      snapIndicator = null;
    }
    render(); drawPreview(); updateSelBarPosition();
    return;
  }
  const o = selection[0];
  if (!o) return;
  selState.changed = true;
  if (selState.mode === 'vertex') {
    applyGeo(o, selState.startGeo);
    const rot = o.rotation || 0;
    let tx = pt.x, ty = pt.y;
    if (!e.altKey) {
      const sp = findSnap({ x: tx, y: ty });
      if (sp) { tx = sp.x; ty = sp.y; snapIndicator = sp; }
      else snapIndicator = null;
    } else snapIndicator = null;
    const dx = tx - selState.startPt.x, dy = ty - selState.startPt.y;
    const cos = Math.cos(-rot), sin = Math.sin(-rot);
    const ldx = dx*cos - dy*sin, ldy = dx*sin + dy*cos;
    if (o.points) { o.points[selState.index].x += ldx; o.points[selState.index].y += ldy; }
    else {
      const def = PB.shapes[o.type];
      if (def && def.geom === 'line') {
        if (selState.index === 0) { o.x1 += ldx; o.y1 += ldy; }
        else { o.x2 += ldx; o.y2 += ldy; }
      }
    }
  }
  else if (selState.mode === 'rotate') {
    const ctr = objCenter(o);
    const a0 = Math.atan2(selState.startPt.y - ctr.y, selState.startPt.x - ctr.x);
    const a1 = Math.atan2(pt.y - ctr.y, pt.x - ctr.x);
    o.rotation = selState.startRotation + (a1 - a0);
    if (e.shiftKey) { const step = Math.PI / 12; o.rotation = Math.round(o.rotation / step) * step; }
    snapIndicator = null;
  }
  else if (selState.mode === 'resize') {
    const b = selState.startBBox;
    const rot = o.rotation || 0;
    const bcx = (b.x1 + b.x2) / 2, bcy = (b.y1 + b.y2) / 2;
    const ctr = { x:bcx, y:bcy };

    let px = pt.x, py = pt.y;
    if (!e.altKey) {
      const sp = findSnap({ x:px, y:py });
      if (sp) { px = sp.x; py = sp.y; snapIndicator = sp; }
      else snapIndicator = null;
    } else snapIndicator = null;

    const dx = px - ctr.x, dy = py - ctr.y;
    const cos = Math.cos(-rot), sin = Math.sin(-rot);
    const lx = ctr.x + dx*cos - dy*sin, ly = ctr.y + dx*sin + dy*cos;

    let ax = bcx, ay = bcy, hx = bcx, hy = bcy, doX = false, doY = false;
    switch (selState.handleId) {
      case 'nw': ax=b.x2; ay=b.y2; hx=b.x1; hy=b.y1; doX=doY=true; break;
      case 'n':  ax=bcx;  ay=b.y2; hx=bcx;  hy=b.y1; doY=true; break;
      case 'ne': ax=b.x1; ay=b.y2; hx=b.x2; hy=b.y1; doX=doY=true; break;
      case 'e':  ax=b.x1; ay=bcy;  hx=b.x2; hy=bcy;  doX=true; break;
      case 'se': ax=b.x1; ay=b.y1; hx=b.x2; hy=b.y2; doX=doY=true; break;
      case 's':  ax=bcx;  ay=b.y1; hx=bcx;  hy=b.y2; doY=true; break;
      case 'sw': ax=b.x2; ay=b.y1; hx=b.x1; hy=b.y2; doX=doY=true; break;
      case 'w':  ax=b.x2; ay=bcy;  hx=b.x1; hy=bcy;  doX=true; break;
    }
    let sx = 1, sy = 1;
    if (doX && Math.abs(hx - ax) > 0.5) sx = (lx - ax) / (hx - ax);
    if (doY && Math.abs(hy - ay) > 0.5) sy = (ly - ay) / (hy - ay);
    if (e.shiftKey && doX && doY) {
      const s = Math.max(Math.abs(sx), Math.abs(sy));
      sx = s * Math.sign(sx || 1); sy = s * Math.sign(sy || 1);
    }
    sx = Math.max(0.03, sx); sy = Math.max(0.03, sy);
    applyGeo(o, selState.startGeo);
    scaleObj(o, { x:ax, y:ay }, sx, sy);
    selState.lastAnchor = { x:ax, y:ay };
    selState.lastSX = sx;
    selState.lastSY = sy;
  }
  render(); drawPreview(); updateSelBarPosition();
}
function hoverCursor(e) {
  if (drawing) return;
  const pt = screenToWorld(e.clientX, e.clientY);
  let cur = 'default';
  if (state.tool === 'pen' || isShapeTool(state.tool)) cur = 'crosshair';
  else if (state.tool === 'select') {

    /* ★ 交互图形优先 */
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      const d = PB.shapes[o.type];
      if (!d || !d.interactive) continue;
      if (!hitTest(o, pt)) continue;

      if (selection.length === 1 && selection[0] === o &&
          (hitVertex(o, pt) !== null || hitHandle(o, pt))) break;

      /* 边框带 / Alt → move；内部 → grab */
      const b = getBBox(o);
      const k = 1 / view.scale;
      const edgeBand = Math.min(12 * k, Math.min(b.w, b.h) * 0.15);
      const minDist = Math.min(
        pt.x - b.x1, b.x2 - pt.x,
        pt.y - b.y1, b.y2 - pt.y
      );

      if (e.altKey || minDist < edgeBand) {
        setCursor(cloneMode ? 'copy' : 'move');
      } else {
        setCursor('grab');
      }
      return;
    }
    /* ★ 交互图形优先结束 */

    if (selection.length === 1) {
      const o = selection[0];
      if (hitVertex(o, pt) !== null) cur = 'pointer';
      else {
        const h = hitHandle(o, pt);
        if (h) {
          if (h.id === 'rotate') cur = 'grab';
          else if (h.id === 'n' || h.id === 's') cur = 'ns-resize';
          else if (h.id === 'e' || h.id === 'w') cur = 'ew-resize';
          else if (h.id === 'nw' || h.id === 'se') cur = 'nwse-resize';
          else cur = 'nesw-resize';
        } else if (hitTest(o, pt)) cur = cloneMode ? 'copy' : 'move';
      }
    }
    if (cur === 'default') {
      for (let i = objects.length - 1; i >= 0; i--) {
        if (hitTest(objects[i], pt)) { cur = cloneMode ? 'copy' : 'move'; break; }
      }
    }
  }
  setCursor(cur);
}
board.addEventListener('dblclick', e => {
  if (textEditorEl) return;
  const pt = screenToWorld(e.clientX, e.clientY);
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    if (!isTextObj(o)) continue;
    if (hitTest(o, pt)) {
      if (state.tool !== 'select') setTool('select');
      selection = [o];
      updateSelBar();
      openTextEditor(o, false);
      return;
    }
  }
});

/* =====================================================================
 * 22. 快捷键
 * ===================================================================== */
window.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  const inField = tag === 'input' || tag === 'textarea' || tag === 'select';

  if (e.key === 'Escape') {
    if (textEditorEl) { cancelTextEditor(); return; }
    if (document.querySelector('.modal.show')) {
      if (videoRunning) return;
      if (libConfirm.classList.contains('show')) { libConfirm.classList.remove('show'); return; }
      document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
      return;
    }
    if (eraseSliderEl) { eraseSliderEl.remove(); eraseSliderEl = null; return; }
    if (selection.length) { selection = []; updateSelBar(); drawPreview(); }
    hideMenu(); hideSubPanels(); thumbPanel.classList.remove('show');
    return;
  }
  if (textEditorEl) return;
  if (inField) return;
  if (document.querySelector('.modal.show')) return;
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && (e.key === 'z' || e.key === 'Z')) {
    e.preventDefault(); if (e.shiftKey) redo(); else undo(); return;
  }
  if (ctrl && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return; }
  if (ctrl && (e.key === 'a' || e.key === 'A')) {
    e.preventDefault();
    if (state.tool !== 'select') setTool('select');
    selection = objects.slice();
    updateSelBar(); drawPreview();
    toast('已选中 ' + selection.length + ' 个图形');
    return;
  }

  if (ctrl && (e.key === 'c' || e.key === 'C')) {
    if (selection.length) {
      e.preventDefault();
      copySelectionToClipboard();
    }
    return;
  }
  if (ctrl && (e.key === 'g' || e.key === 'G')) {
    e.preventDefault();
    if (selection.length >= 2) openGroupModal();
    else toast('请先选中至少两个图形');
    return;
  }
  if (ctrl && (e.key === 'l' || e.key === 'L')) {
    e.preventDefault();
    openLibModal();
    return;
  }
  if (ctrl && (e.key === 'd' || e.key === 'D')) {
    e.preventDefault();
    if (!selection.length) return;
    const copies = selection.map(o => {
      const c = copyObj(o);
      if (o._mask) c._mask = cloneCanvas(o._mask);
      if (o._img) c._img = o._img;
      if (o._videoEl) { c._videoEl = o._videoEl; c._blobUrl = o._blobUrl; }
      if (o._origImg) c._origImg = o._origImg;
      translateObj(c, 20, 20); return c;
    });
    objects.push(...copies);
    pages[pageIndex] = objects;
    selection = copies;
    pushSnapshot(); updateSelBar(); render(); drawPreview();
    return;
  }
  if (e.code === 'Space') { e.preventDefault(); togglePlayAll(); return; }
  if ((e.key === 'r' || e.key === 'R') && !ctrl) { e.preventDefault(); resetAnimAll(); return; }
  if (e.key === '0' && !ctrl) {
    e.preventDefault();
    resetView();
    toast('已重置视图（缩放 100%）');
    return;
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!selection.length) return;
    e.preventDefault();
    objects = objects.filter(o => selection.indexOf(o) < 0);
    pages[pageIndex] = objects;
    selection = [];
    pushSnapshot(); updateSelBar(); render(); drawPreview();
    if (!objects.length) setTool('pen', true);
    return;
  }
  if (e.key.startsWith('Arrow') && selection.length) {
    e.preventDefault();
    const step = (e.shiftKey ? 10 : 1) / view.scale;
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
    for (const o of selection) translateObj(o, dx, dy);
    render(); drawPreview(); updateSelBarPosition();
  }
});
window.addEventListener('wheel', e => {
  if (e.ctrlKey || e.metaKey) {
    if (e.target.tagName !== 'CANVAS') return;
    e.preventDefault();
    zoomAtScreen(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    render(); drawPreview();
    if (selBar.classList.contains('show')) updateSelBarPosition();
    if (typeof positionTextEditor === 'function') positionTextEditor();
    return;
  }

  /* ★ 新增：图形内滚轮缩放（必须在下面 eraser 判断之前） */
  if (state.tool === 'select' && e.target.tagName === 'CANVAS') {
    const pt = screenToWorld(e.clientX, e.clientY);
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      const d = PB.shapes[o.type];
      if (d && d.interactive && typeof d.onWheel === 'function' && hitTest(o, pt)) {
        e.preventDefault();
        d.onWheel(o, {
          deltaY: e.deltaY, deltaX: e.deltaX,
          shiftKey: e.shiftKey, altKey: e.altKey,
          worldPt: pt
        });
        render(); drawPreview();
        if (selBar.classList.contains('show')) updateSelBarPosition();
        return;
      }
    }
  }
  /* ★ 新增结束 */

  if (state.tool !== 'eraser') return;
  if (e.target.tagName !== 'CANVAS') return;
  e.preventDefault();
  eraserSizeMul += -Math.sign(e.deltaY) * 0.15;
  eraserSizeMul = Math.max(0.3, Math.min(3, eraserSizeMul));
  lastEraserRadius = getEraserRadius({ pointerType: 'mouse' });
  drawPreview();
  toast('橡皮大小：' + Math.round(eraserSizeMul * 100) + '%');
}, { passive: false });

/* =====================================================================
 * 23. 设置 / 菜单 / 弹窗
 * ===================================================================== */
function applyBg(id) {
  if (id === 'custom' && !loadCustomBgPreset()) {
    id = 'tech';
  }
  const preset = findBgPreset(id);
  state.bg = preset.id;
  /* 浅色背景 → 给 body 加 pb-light，文字编辑器 / 公式键盘切浅色 */
  document.body.classList.toggle('pb-light', !!preset.light);
  document.body.style.background = (preset.id === 'transparent') ? 'transparent' : preset.css;
  try { localStorage.setItem('pb_bg_id', preset.id); } catch (e) {
    console.warn('[applyBg] 保存背景失败（可能是 localStorage 已满）:', e);
  }
  buildBgRow();
  preloadBgImage();

  if (preset.id === 'transparent') {
    state.borderColor = '#ff0000';
    state.penColor = '#ff0000';
  } else if (preset.light) {
    if (state.borderColor === '#e6edf7' || state.borderColor === '#ff0000') {
      state.borderColor = '#1a1a1a'; state.penColor = '#1a1a1a';
    }
  } else {
    if (state.borderColor === '#1a1a1a' || state.borderColor === '#ff0000') {
      state.borderColor = '#e6edf7'; state.penColor = '#e6edf7';
    }
  }
  buildPenPanel();
  buildBorderPanel();
  /* 同步已打开的文字编辑器 iframe */
  syncEmbeddedEditorsTheme();
}


function buildBgRow() {
  const row = document.getElementById('bgRow');
  row.innerHTML = '';
  getAllBgPresets().forEach(p => {
    const b = document.createElement('button');
    b.className = 'bg-opt' + (state.bg === p.id ? ' active' : '');
    b.innerHTML = '<span class="bg-dot" style="background:' + p.swatch + '"></span>' +
                  '<span>' + escapeHtml(p.name) + '</span>';
    b.addEventListener('click', () => applyBg(p.id));
    row.appendChild(b);
  });
}



function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
['settingsModal','aboutModal','helpModal','exportModal','videoModal','groupModal','libModal','miniappModal','importModal','exportChooserModal'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', e => {
    if (e.target.id !== id) return;
    if (videoRunning) return;
    if (id === 'libModal' && libConfirm.classList.contains('show')) return;
    closeModal(id);
  });
});
document.getElementById('settingsClose').addEventListener('click', () => closeModal('settingsModal'));
document.getElementById('aboutClose').addEventListener('click', () => closeModal('aboutModal'));
document.getElementById('helpClose').addEventListener('click', () => closeModal('helpModal'));
document.getElementById('miniappClose').addEventListener('click', () => closeModal('miniappModal'));
function hideMenu() { menuPop.classList.remove('show'); }
document.getElementById('menuBtn').addEventListener('click', e => {
  e.stopPropagation(); menuPop.classList.toggle('show');
});
menuPop.addEventListener('click', e => {
  const btn = e.target.closest('.menu-item');
  if (!btn) return;
  const act = btn.dataset.act;
  hideMenu();
  if (act === 'miniapp') openMiniappLauncher();
  else if (act === 'import') openModal('importModal');
  else if (act === 'export') openModal('exportChooserModal');
  else if (act === 'lib') openLibModal();
  else if (act === 'about') openModal('aboutModal');
  else if (act === 'help') openModal('helpModal');
  else if (act === 'settings') openModal('settingsModal');

});
document.addEventListener('click', e => {
  if (!menuPop.contains(e.target) && !e.target.closest('#menuBtn')) hideMenu();
});

document.getElementById('importModal').addEventListener('click', e => {
  const opt = e.target.closest('[data-import]');
  if (!opt) return;
  closeModal('importModal');
  const kind = opt.dataset.import;
  if (kind === 'image') openImagePicker();
  else if (kind === 'video') openVideoPicker();
  else if (kind === 'file') loadDocFile();
});
document.getElementById('importCancel').addEventListener('click', () => closeModal('importModal'));

document.getElementById('exportChooserModal').addEventListener('click', e => {
  const opt = e.target.closest('[data-export]');
  if (!opt) return;
  closeModal('exportChooserModal');
  const kind = opt.dataset.export;
  if (kind === 'image') openExportModal();
  else if (kind === 'video') openVideoModal();
  else if (kind === 'file') exportDocFile();
});
document.getElementById('exportChooserCancel').addEventListener('click', () => closeModal('exportChooserModal'));

(function setupSnapControls() {
  const row = document.getElementById('snapToggleRow');
  if (row) {
    row.addEventListener('click', e => {
      const b = e.target.closest('.seg-btn');
      if (!b) return;
      snapEnabled = b.dataset.val === 'on';
      try { localStorage.setItem(SNAP_LS_ENABLED, snapEnabled ? 'on' : 'off'); } catch (err) {}
      syncSnapUI();
      toast(snapEnabled
        ? '已开启吸附（半径 ' + snapRadius + ' px）'
        : '已关闭吸附');
    });
  }
  const slider = document.getElementById('snapRadius');
  const valEl  = document.getElementById('snapRadiusVal');
  if (slider) {
    slider.addEventListener('input', () => {
      snapRadius = parseInt(slider.value, 10) || SNAP_DEFAULT_RADIUS;
      if (valEl) valEl.textContent = snapRadius + ' px';
      try { localStorage.setItem(SNAP_LS_RADIUS, String(snapRadius)); } catch (err) {}
    });
  }
})();

function updateSaveDirUI() {
  const info = document.getElementById('saveDirInfo');
  const resetBtn = document.getElementById('resetSaveDirBtn');
  const tip = document.getElementById('exportDirTip');
  if (info) {
    if (saveDirHandle) {
      info.textContent = '📁 ' + (saveDirHandle.name || '已选择文件夹');
      info.classList.add('custom');
    } else {
      info.textContent = '默认下载位置';
      info.classList.remove('custom');
    }
  }
  if (resetBtn) resetBtn.style.display = saveDirHandle ? '' : 'none';
  if (tip) {
    tip.innerHTML = '保存位置：' + (saveDirHandle
      ? '<b>' + (saveDirHandle.name || '文件夹') + '</b>'
      : '默认下载位置');
  }
}

document.getElementById('pickSaveDirBtn').addEventListener('click', async () => {
  if (!window.showDirectoryPicker) {
    alert('当前浏览器不支持选择文件夹，请使用 Chrome / Edge，并通过 http(s) 或 localhost 打开页面。');
    return;
  }
  try {
    const h = await window.showDirectoryPicker({ mode: 'readwrite' });
    let perm = await h.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') perm = await h.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') { toast('未获得文件夹写入权限'); return; }
    saveDirHandle = h;
    await idbSet('saveDirHandle', h);
    updateSaveDirUI();
    toast('已设置保存位置：' + (h.name || '文件夹'));
  } catch (e) {}
});

document.getElementById('resetSaveDirBtn').addEventListener('click', async () => {
  saveDirHandle = null;
  await idbSet('saveDirHandle', null);
  updateSaveDirUI();
  toast('已恢复为默认下载位置');
});

(async () => {
  try {
    const h = await idbGet('saveDirHandle');
    if (h) { saveDirHandle = h; updateSaveDirUI(); }
  } catch (e) {}
})();

function dataURLToBlob(dataURL) {
  const arr = dataURL.split(',');
  const m = arr[0].match(/:(.*?);/);
  const mime = m ? m[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8 = new Uint8Array(n);
  while (n--) u8[n] = bstr.charCodeAt(n);
  return new Blob([u8], { type: mime });
}

async function saveImageBlob(blob, filename) {
  if (saveDirHandle) {
    try {
      let perm = await saveDirHandle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') perm = await saveDirHandle.requestPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        const fh = await saveDirHandle.getFileHandle(filename, { create: true });
        const w = await fh.createWritable();
        await w.write(blob);
        await w.close();
        return { ok: true, location: (saveDirHandle.name || '文件夹') + ' / ' + filename };
      }
    } catch (e) {
      console.warn('写入指定文件夹失败，回退下载：', e);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  return { ok: true, location: '下载文件夹 / ' + filename };
}

function showEraseSlider() {
  if (eraseSliderEl) { eraseSliderEl.remove(); eraseSliderEl = null; }
  const btn = document.querySelector('.dbtn[data-tool="eraser"]');
  if (!btn) return;
  eraseSliderEl = document.createElement('div');
  eraseSliderEl.className = 'erase-slider-panel';
  eraseSliderEl.innerHTML =
    '<div class="erase-slider-label">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M8.5 20l-4.2-4.2a2 2 0 0 1 0-2.8l7.3-7.3a2 2 0 0 1 2.8 0l4.7 4.7a2 2 0 0 1 0 2.8L13.2 20H8.5z"/>' +
        '<path d="M20 20h-9"/></svg>' +
      '向右滑动清除本页' +
    '</div>' +
    '<input type="range" min="0" max="100" value="0" step="1">';
  document.body.appendChild(eraseSliderEl);
  const r = btn.getBoundingClientRect();
  const pw = eraseSliderEl.offsetWidth, ph = eraseSliderEl.offsetHeight;
  let left = r.left + r.width / 2 - pw / 2;
  let top = r.top - ph - 12;
  if (left < 12) left = 12;
  if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
  if (top < 12) top = r.bottom + 12;
  eraseSliderEl.style.left = left + 'px';
  eraseSliderEl.style.top = top + 'px';
  const inp = eraseSliderEl.querySelector('input');
  inp.addEventListener('input', () => {
    if (+inp.value >= 100) {
      objects.length = 0;
      pages[pageIndex] = objects;
      selection = [];
      pushSnapshot(); updateSelBar(); render(); drawPreview();
      toast('已清除本页');
      setTool('pen', true);
      setTimeout(() => {
        if (eraseSliderEl) { eraseSliderEl.remove(); eraseSliderEl = null; }
      }, 150);
    }
  });
  setTimeout(() => {
    document.addEventListener('mousedown', function closeOnOutside(ev) {
      if (eraseSliderEl && !eraseSliderEl.contains(ev.target) && ev.target !== btn && !btn.contains(ev.target)) {
        eraseSliderEl.remove();
        eraseSliderEl = null;
        document.removeEventListener('mousedown', closeOnOutside);
      }
    });
  }, 50);
}

/* =====================================================================
 * 23.5 图片 / 视频插入 / 粘贴
 * ===================================================================== */
function createImageObject(dataURL, worldCenter, naturalW, naturalH) {
  const MAX = 640;
  let w = naturalW || 400;
  let h = naturalH || 300;
  const k = Math.min(1, MAX / Math.max(w, h));
  w *= k; h *= k;
  const x1 = worldCenter.x - w / 2;
  const y1 = worldCenter.y - h / 2;
  const o = {
    type: '__image',
    x1, y1, x2: x1 + w, y2: y1 + h,
    src: dataURL, rotation: 0,
    color: '#e6edf7', size: 2, hasBorder: false, fill: false, dash: 'solid',
    _img: null, _origImg: null, _enhanced: false, _enhanceParams: null
  };
  const img = new Image();
  img.onload = () => {
    o._img = img;
    o._origImg = img;
    if (img.naturalWidth && img.naturalHeight) {
      const ar = img.naturalWidth / img.naturalHeight;
      let nw = o.x2 - o.x1, nh = o.y2 - o.y1;
      if (Math.abs(nw / nh - ar) > 0.01) {
        if (nw / nh > ar) { nw = nh * ar; o.x2 = o.x1 + nw; }
        else { nh = nw / ar; o.y2 = o.y1 + nh; }
      }
    }
    render(); drawPreview(); updateSelBarPosition();
  };
  img.src = dataURL;
  return o;
}

async function insertImageFile(file) {
  if (!file || !/^image\//.test(file.type)) { toast('不是有效的图片文件'); return; }
  let dataURL;
  try {
    dataURL = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
  } catch (e) { toast('读取图片失败'); return; }

  const nat = await new Promise(res => {
    const im = new Image();
    im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
    im.onerror = () => res({ w: 400, h: 300 });
    im.src = dataURL;
  });

  const center = screenToWorld(W / 2, H / 2);
  const o = createImageObject(dataURL, center, nat.w, nat.h);
  objects.push(o);
  pages[pageIndex] = objects;
  selection = [o];
  setTool('select', true);
  pushSnapshot();
  updateSelBar();
  render(); drawPreview();
  toast('已插入图片，可点「清晰」增强');
}

/* ===== 内部剪贴板：Ctrl+C / Ctrl+V ===== */
function copySelectionToClipboard() {
  if (!selection.length) { toast('未选中图形'); return; }
  internalClipboard = selection.map(o => {
    const c = copyObj(o);
    if (o._mask) c._mask = cloneCanvas(o._mask);
    if (o._img) c._img = o._img;
    if (o._videoEl) { c._videoEl = o._videoEl; c._blobUrl = o._blobUrl; }
    if (o._origImg) c._origImg = o._origImg;
    return c;
  });
  pasteCount = 0;
  toast('已复制 ' + internalClipboard.length + ' 个图形');
}

function pasteInternalClipboard() {
  if (!internalClipboard.length) return;
  pasteCount++;
  const off = 20 * pasteCount;
  const copies = internalClipboard.map(o => {
    const c = copyObj(o);
    if (o._mask) c._mask = cloneCanvas(o._mask);
    if (o._img) c._img = o._img;
    if (o._videoEl) { c._videoEl = o._videoEl; c._blobUrl = o._blobUrl; }
    if (o._origImg) c._origImg = o._origImg;
    translateObj(c, off, off);
    return c;
  });
  objects.push(...copies);
  pages[pageIndex] = objects;
  selection = copies;
  pushSnapshot();
  updateSelBar();
  render(); drawPreview();
  toast('已粘贴 ' + copies.length + ' 个图形');
}





function openImagePicker() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*';
  inp.style.display = 'none';
  document.body.appendChild(inp);
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    setTimeout(() => inp.remove(), 0);
    if (f) insertImageFile(f);
  };
  inp.click();
}

/* ---- 视频插入 ---- */
function createVideoObject(blobUrl, worldCenter, naturalW, naturalH, duration) {
  const MAX = 640;
  let w = naturalW || 640;
  let h = naturalH || 360;
  const k = Math.min(1, MAX / Math.max(w, h));
  w *= k; h *= k;
  const x1 = worldCenter.x - w / 2;
  const y1 = worldCenter.y - h / 2;
  const d = (typeof duration === 'number' && isFinite(duration) && duration > 0) ? duration : 0;
  const o = {
    type: '__video',
    x1, y1, x2: x1 + w, y2: y1 + h,
    rotation: 0,
    color: '#e6edf7', size: 2, hasBorder: false, fill: false, dash: 'solid',
    _videoEl: null, _blobUrl: blobUrl,
    duration: d,
    trimStart: 0,
    trimEnd: d,
    playing: false,
    _videoMissing: false
  };
  const v = document.createElement('video');
  v.src = blobUrl;
  v.preload = 'auto';
  v.muted = true;
  v.playsInline = true;
  v.loop = false;
  v.onloadeddata = () => {
    o._videoEl = v;
    if (!o.duration && isFinite(v.duration)) {
      o.duration = v.duration;
      o.trimEnd = v.duration;
    }
    render(); drawPreview(); updateSelBarPosition();
  };
  v.onerror = () => {
    o._videoMissing = true;
    render(); drawPreview();
  };
  return o;
}

async function insertVideoFile(file) {
  if (!file || !/^video\//.test(file.type)) { toast('不是有效的视频文件'); return; }
  let blobUrl;
  try { blobUrl = URL.createObjectURL(file); }
  catch (e) { toast('创建视频 URL 失败'); return; }

  const nat = await new Promise(res => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => res({ w: v.videoWidth || 640, h: v.videoHeight || 360, d: isFinite(v.duration) ? v.duration : 0 });
    v.onerror = () => res({ w: 640, h: 360, d: 0 });
    v.src = blobUrl;
  });

  const center = screenToWorld(W / 2, H / 2);
  const o = createVideoObject(blobUrl, center, nat.w, nat.h, nat.d);
  objects.push(o);
  pages[pageIndex] = objects;
  selection = [o];
  setTool('select', true);
  pushSnapshot();
  updateSelBar();
  render(); drawPreview();
  toast('已导入视频，选中后可点「视频」剪切时长');
}

function openVideoPicker() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'video/mp4,video/webm,video/*';
  inp.style.display = 'none';
  document.body.appendChild(inp);
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    setTimeout(() => inp.remove(), 0);
    if (f) insertVideoFile(f);
  };
  inp.click();
}

/* 粘贴图片（Ctrl+V） */
window.addEventListener('paste', async e => {
  if (textEditorEl) return;
  const tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (document.querySelector('.modal.show')) return;

  const items = e.clipboardData && e.clipboardData.items;

  /* ① 优先处理图片粘贴 */
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.type && it.type.indexOf('image/') === 0) {
        const file = it.getAsFile();
        if (file) { e.preventDefault(); await insertImageFile(file); return; }
      }
    }
  }

  /* ② 内部对象粘贴（Ctrl+C 复制的图形） */
  if (internalClipboard && internalClipboard.length) {
    e.preventDefault();
    pasteInternalClipboard();
  }
});

/* =====================================================================
 * 24. 导出（图片）
 * ===================================================================== */
function openExportModal() {
  document.getElementById('exportCurrentNum').textContent = (pageIndex + 1);
  document.querySelector('input[name="exportMode"][value="current"]').checked = true;
  document.getElementById('exportRange').value = '';
  updateSaveDirUI();
  openModal('exportModal');
}
document.querySelectorAll('.export-opt').forEach(opt => {
  opt.addEventListener('click', e => {
    if (e.target && e.target.id === 'exportRange') return;
    const radio = opt.querySelector('input[type=radio]');
    if (radio) {
      radio.checked = true;
      if (radio.value === 'range') {
        setTimeout(() => {
          const inp = document.getElementById('exportRange');
          if (inp) inp.focus();
        }, 0);
      }
    }
  });
});
document.getElementById('exportCancel').addEventListener('click', () => closeModal('exportModal'));
document.getElementById('exportOk').addEventListener('click', () => {
  const mode = (document.querySelector('input[name="exportMode"]:checked') || {}).value || 'current';
  closeModal('exportModal');
  if (mode === 'current') exportPageImage(pageIndex);
  else if (mode === 'all') exportAllPages();
  else if (mode === 'range') {
    const txt = (document.getElementById('exportRange').value || '').trim();
    const list = parsePageRange(txt, pages.length);
    if (!list.length) { toast('页码范围无效'); return; }
    exportPagesList(list);
  }
});
function parsePageRange(txt, total) {
  if (!txt) return [];
  const res = new Set();
  const parts = txt.split(/[,，\s]+/).filter(Boolean);
  for (const p of parts) {
    const m = p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    let a = parseInt(m[1], 10);
    let b = m[2] ? parseInt(m[2], 10) : a;
    if (isNaN(a) || isNaN(b)) continue;
    if (a > b) { const t = a; a = b; b = t; }
    a = Math.max(1, a); b = Math.min(total, b);
    for (let i = a; i <= b; i++) res.add(i - 1);
  }
  return [...res].sort((x, y) => x - y);
}

function makeExportCanvas(pageObjs) {
  let wx1, wy1, ww, wh;
  if (!pageObjs.length) {
    const w0 = screenToWorld(0, 0), w1 = screenToWorld(W, H);
    wx1 = w0.x; wy1 = w0.y; ww = w1.x - w0.x; wh = w1.y - w0.y;
  } else {
    const bb = unionBBox(pageObjs);
    const pad = 40;
    wx1 = bb.x1 - pad; wy1 = bb.y1 - pad;
    ww = Math.max(1, bb.x2 - bb.x1 + pad * 2);
    wh = Math.max(1, bb.y2 - bb.y1 + pad * 2);
  }

  const MAX_PX = 4000;
  const scale = Math.min(MAX_PX / ww, MAX_PX / wh, 2);

  const tmp = document.createElement('canvas');
  tmp.width = Math.max(1, Math.round(ww * scale * dpr));
  tmp.height = Math.max(1, Math.round(wh * scale * dpr));
  const tc = tmp.getContext('2d');

tc.setTransform(1, 0, 0, 1, 0, 0);
paintBackgroundToCanvas(tc, tmp.width, tmp.height);

  const s = dpr * scale;
  tc.setTransform(s, 0, 0, s, -wx1 * s, -wy1 * s);

  const saved = objects;
  objects = pageObjs;
  try {
    for (const o of pageObjs) {
      try { drawObject(tc, o); } catch (e) {}
    }
  } finally { objects = saved; }
  return tmp;
}
async function exportPageImage(idx) {
await preloadBgImage();   
  const tmp = makeExportCanvas(pages[idx]);
  const filename = '白板_第' + (idx + 1) + '页_' +
                   new Date().toISOString().slice(0,19).replace(/[:T]/g,'-') + '.png';
  const blob = dataURLToBlob(tmp.toDataURL('image/png'));
  const r = await saveImageBlob(blob, filename);
  toast('已保存到：' + r.location, 3600);
}
async function exportAllPages() {
await preloadBgImage();          // ← 新增
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  let lastLoc = '';
  let n = 0;
  for (let i = 0; i < pages.length; i++) {
    const tmp = makeExportCanvas(pages[i]);
    const filename = '白板_第' + (i + 1) + '页_' + ts + '.png';
    const blob = dataURLToBlob(tmp.toDataURL('image/png'));
    const r = await saveImageBlob(blob, filename);
    lastLoc = r.location;
    n++;
    if (i < pages.length - 1) await new Promise(res => setTimeout(res, 120));
  }
  const dir = lastLoc.includes(' / ') ? lastLoc.split(' / ')[0] : lastLoc;
  toast('已保存 ' + n + ' 张到：' + dir, 3600);
}
async function exportPagesList(list) {
 await preloadBgImage();          // ← 新增
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  let lastLoc = '';
  let n = 0;
  for (let k = 0; k < list.length; k++) {
    const idx = list[k];
    const tmp = makeExportCanvas(pages[idx]);
    const filename = '白板_第' + (idx + 1) + '页_' + ts + '.png';
    const blob = dataURLToBlob(tmp.toDataURL('image/png'));
    const r = await saveImageBlob(blob, filename);
    lastLoc = r.location;
    n++;
    if (k < list.length - 1) await new Promise(res => setTimeout(res, 120));
  }
  const dir = lastLoc.includes(' / ') ? lastLoc.split(' / ')[0] : lastLoc;
  toast('已保存 ' + n + ' 张到：' + dir, 3600);
}

/* =====================================================================
 * 24.5 动画视频导出
 * ===================================================================== */
let videoRunning = false;
let videoAbort = false;
let videoRec = null;

function pickVideoMime() {
  const list = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ];
  for (const m of list) {
    try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) {}
  }
  return '';
}
function extFromMime(t) { return /mp4/i.test(t || '') ? 'mp4' : 'webm'; }

function paintVideoFrame(c2, cv, objs) {
  c2.setTransform(1, 0, 0, 1, 0, 0);
  paintBackgroundToCanvas(c2, cv.width, cv.height);

  const s = cv.width / W;
  c2.setTransform(s, 0, 0, s, 0, 0);
  for (const o of objs) {
    try { drawObject(c2, o); } catch (e) {}
  }
  c2.setTransform(1, 0, 0, 1, 0, 0);
}

async function recordPageVideo(pageIdx, opts, onProgress) {
await preloadBgImage();          // ← 新增：确保背景图已加载
  const duration = opts.duration;
  const fps = opts.fps;
  const scale = opts.scale;

  let baseScale = Math.min(window.devicePixelRatio || 1, 2) * scale;
  const maxPixels = 1920 * 1080 * 4;
  const px = W * H * baseScale * baseScale;
  if (px > maxPixels) baseScale *= Math.sqrt(maxPixels / px);

  const outW = Math.max(16, Math.round(W * baseScale));
  const outH = Math.max(16, Math.round(H * baseScale));

  const cv = document.createElement('canvas');
  cv.width = outW; cv.height = outH;
  const c2 = cv.getContext('2d');

  const mime = pickVideoMime();
  if (!mime) throw new Error('浏览器不支持视频录制（MediaRecorder）');

  const stream = cv.captureStream(fps);

  let rec;
  try {
    rec = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: Math.min(
        16000000,
        Math.max(2500000, Math.round(outW * outH * fps * 0.08))
      )
    });
  } catch (e) {
    rec = new MediaRecorder(stream);
  }

  const chunks = [];
  rec.ondataavailable = ev => { if (ev.data && ev.data.size) chunks.push(ev.data); };
  const stopped = new Promise(res => rec.addEventListener('stop', res, { once: true }));

  const savedObjects = objects;
  const savedDpr = dpr;
  const pageObjs = pages[pageIdx];
  const animObjs = pageObjs.filter(isAnimObj);

  stopAnimLoop();
  for (const o of animObjs) {
    ensureAnimFields(o);
    o.animPlaying = false;
    o.animT = 0;
  }

  objects = pageObjs;
  dpr = baseScale;

  paintVideoFrame(c2, cv, pageObjs);

  rec.start(250);
  videoRec = rec;

  await new Promise(r => setTimeout(r, 120));

  const t0 = performance.now();
  let lastSent = -1;

  await new Promise(resolve => {
    const step = () => {
      if (videoAbort) { resolve(); return; }
      const el = (performance.now() - t0) / 1000;
      if (el >= duration) { resolve(); return; }

      for (const o of animObjs) o.animT = el * (o.animSpeed || 1);
      paintVideoFrame(c2, cv, pageObjs);

      const p = Math.min(1, el / duration);
      if (onProgress && p - lastSent > 0.01) {
        lastSent = p;
        onProgress(p);
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  const aborted = videoAbort;

  for (const o of animObjs) o.animT = duration * (o.animSpeed || 1);
  paintVideoFrame(c2, cv, pageObjs);
  await new Promise(r => setTimeout(r, 280));

  if (rec.state !== 'inactive') rec.stop();
  await stopped;
  videoRec = null;

  dpr = savedDpr;
  objects = savedObjects;
  for (const o of animObjs) {
    o.animT = 0;
    o.animPlaying = false;
  }
  updatePlayButtons();
  render();
  drawPreview();

  if (aborted) return null;
  return new Blob(chunks, { type: mime.split(';')[0] });
}

document.querySelectorAll('.seg-row').forEach(row => {
  row.addEventListener('click', e => {
    const b = e.target.closest('.seg-btn');
    if (!b) return;
    if (row.id === 'snapToggleRow') return;
    row.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('active', x === b));
  });
});
function segVal(id) {
  const b = document.querySelector('#' + id + ' .seg-btn.active');
  return b ? b.dataset.val : null;
}

(function () {
  const dur = document.getElementById('videoDur');
  const lab = document.getElementById('videoDurVal');
  if (!dur) return;
  dur.addEventListener('input', () => {
    lab.textContent = (+dur.value).toFixed(1) + 's';
  });
})();

function openVideoModal() {
  openModal('videoModal');
}

document.getElementById('videoCancel').addEventListener('click', () => {
  if (videoRunning) { videoAbort = true; return; }
  closeModal('videoModal');
});

document.getElementById('videoOk').addEventListener('click', async () => {
  if (videoRunning) return;

  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    toast('当前浏览器不支持视频录制，请使用 Chrome / Edge');
    return;
  }

  const scope = segVal('videoScopeRow') || 'current';
  const duration = Math.max(0.5, +document.getElementById('videoDur').value || 5);
  const fps = +(segVal('videoFpsRow') || 30);
  const scale = +(segVal('videoResRow') || 1);

  const list = scope === 'all' ? pages.map((_, i) => i) : [pageIndex];

  const okBtn = document.getElementById('videoOk');
  const cancelBtn = document.getElementById('videoCancel');
  const progWrap = document.getElementById('videoProgressWrap');
  const progFill = document.getElementById('videoProgressFill');
  const progText = document.getElementById('videoProgressText');

  videoRunning = true;
  videoAbort = false;
  okBtn.disabled = true;
  okBtn.textContent = '录制中…';
  cancelBtn.textContent = '停止';
  progWrap.classList.add('show');
  progFill.style.width = '0%';
  progText.textContent = '0%';

  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  let savedCount = 0;
  let lastLoc = '';

  try {
    for (let k = 0; k < list.length; k++) {
      if (videoAbort) break;
      const idx = list[k];

      const blob = await recordPageVideo(idx, { duration, fps, scale }, p => {
        const overall = (k + p) / list.length;
        progFill.style.width = (overall * 100).toFixed(1) + '%';
        progText.textContent = Math.round(overall * 100) + '%';
      });

      if (videoAbort || !blob) break;

      const ext = extFromMime(blob.type);
      const filename = '白板动画_第' + (idx + 1) + '页_' + ts + '.' + ext;
      const r = await saveImageBlob(blob, filename);
      lastLoc = r.location;
      savedCount++;

      progFill.style.width = ((k + 1) / list.length * 100).toFixed(1) + '%';
      progText.textContent = Math.round((k + 1) / list.length * 100) + '%';
    }

    if (savedCount > 0) {
      const dir = lastLoc.includes(' / ') ? lastLoc.split(' / ')[0] : lastLoc;
      toast('已导出 ' + savedCount + ' 个视频到：' + dir, 3800);
    } else {
      toast('已取消导出');
    }
  } catch (err) {
    console.error(err);
    toast('导出失败：' + (err && err.message ? err.message : '未知错误'), 3200);
  } finally {
    videoRunning = false;
    videoAbort = false;
    videoRec = null;
    okBtn.disabled = false;
    okBtn.textContent = '开始录制';
    cancelBtn.textContent = '取消';
    progWrap.classList.remove('show');
    progFill.style.width = '0%';
    closeModal('videoModal');
    render();
    drawPreview();
  }
});

/* =====================================================================
 * 24.7 工程文件
 * ===================================================================== */
const PB_FILE_TYPE = 'physboard-doc';
const PB_FILE_VERSION = 1;

function serializeObject(o) {
  const t = copyObj(o);
  delete t._mask;
  delete t._img;
  delete t._origImg;
  delete t._videoEl;
  delete t._blobUrl;
  delete t._lineData;          // ← 新增
  delete t._lineDataFs;        // ← 新增
  delete t._lineDataColor;     // ← 新增
  delete t._bw;           // ★ 新增
  delete t._bh;           // ★ 新增
  delete t._viewScale;    // ★ 新增
  if (o._mask) {
    try { t._maskData = o._mask.toDataURL('image/png'); } catch (e) {}
    t._maskPad = o._maskPad || MASK_PAD;
  }
  return t;
}

function loadMaskInto(o, dataURL) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width  = img.naturalWidth  || img.width  || 1;
        cv.height = img.naturalHeight || img.height || 1;
        cv.getContext('2d').drawImage(img, 0, 0);
        o._mask = cv;
        if (!o._maskPad) o._maskPad = MASK_PAD;
      } catch (e) {}
      resolve();
    };
    img.onerror = () => resolve();
    img.src = dataURL;
  });
}

function serializeDoc() {
  const customShapes = {};
  for (const k in PB.shapes) {
    const s = PB.shapes[k];
    if (s.custom && s.parts) {
      const catObj = (PB.categories || []).find(c => c.id === s.cat);
      customShapes[k] = {
        key: k,
        label: s.label || k,
        cat: s.cat,
        catLabel: catObj ? catObj.label : s.cat,
        baseW: s.baseW,
        baseH: s.baseH,
        parts: s.parts,
        icon: s.icon || CUSTOM_ICON
      };
    }
  }
  return {
    app: '唐长老超级物理白板',
    type: PB_FILE_TYPE,
    version: PB_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    bg: state.bg,
    view: { scale: view.scale, offsetX: view.offsetX, offsetY: view.offsetY },
    pageIndex: pageIndex,
    pages: pages.map(pg => pg.map(serializeObject)),
    customShapes: customShapes
  };
}

async function exportDocFile() {
  let doc;
  try { doc = serializeDoc(); }
  catch (e) { toast('导出失败：' + (e && e.message ? e.message : e)); return; }

  const text = JSON.stringify(doc);
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const filename = '白板工程_' +
    new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';

  try {
    const r = await saveImageBlob(blob, filename);
    const pagesN = doc.pages.length;
    const shapesN = Object.keys(doc.customShapes).length;
    let hasVideo = false;
    for (const pg of doc.pages) for (const o of pg) if (o && o.type === '__video') hasVideo = true;
    toast('已导出 ' + pagesN + ' 页' +
          (shapesN ? '（含 ' + shapesN + ' 个自定义图形）' : '') +
          (hasVideo ? '（视频文件未写入，需重新导入）' : '') +
          ' → ' + r.location, 4600);
  } catch (e) {
    toast('导出失败：' + (e && e.message ? e.message : e), 3400);
  }
}

function stopAllAnimations() {
  for (const pg of pages) {
    for (const o of pg) {
      if (isAnimObj(o)) { ensureAnimFields(o); o.animPlaying = false; }
      if (o.type === '__video' && o.playing) {
        if (o._videoEl) try { o._videoEl.pause(); } catch (e) {}
        o.playing = false;
      }
    }
  }
  stopAnimLoop();
  updatePlayButtons();
}

async function applyDoc(doc) {
  if (!doc || typeof doc !== 'object') throw new Error('文件内容为空或格式错误');
  if (doc.type && doc.type !== PB_FILE_TYPE) throw new Error('这不是本白板导出的工程文件');
  if (!Array.isArray(doc.pages) || !doc.pages.length) throw new Error('文件中没有页面数据');
  if (doc.version && doc.version > PB_FILE_VERSION) {
    if (!confirm('该文件由更新版本导出（v' + doc.version + '），可能无法完整加载。\n仍要继续吗？')) return;
  }
  if (!confirm('加载文件会替换当前所有页面。\n当前内容仍可用 Ctrl+Z 撤销。\n\n确定继续吗？')) return;

  let newShapes = 0;
  if (doc.customShapes && typeof doc.customShapes === 'object') {
    for (const k in doc.customShapes) {
      const rec = doc.customShapes[k];
      if (!rec || !Array.isArray(rec.parts) || !rec.parts.length) continue;
      if (PB.shapes[k]) continue;

      const catId = rec.cat || 'custom';
      PB.shapes[k] = buildCustomDef({
        id: k,
        label: rec.label || k,
        cat: catId,
        baseW: rec.baseW || 100,
        baseH: rec.baseH || 100,
        parts: rec.parts,
        icon: rec.icon || CUSTOM_ICON
      });
      ensureCategory(catId, rec.catLabel || catId);
      newShapes++;

      try {
        await csSaveRecord({
          id: k, label: rec.label || k,
          catId: catId, catLabel: rec.catLabel || catId,
          baseW: rec.baseW || 100, baseH: rec.baseH || 100,
          parts: rec.parts, icon: rec.icon || CUSTOM_ICON
        });
      } catch (e) {}
    }
  }

  const maskTasks = [];
  const imgTasks = [];
  let unknown = 0;
  let skippedVideo = 0;

  const newPages = doc.pages.map(pg => {
    const arr = [];
    if (!Array.isArray(pg)) return arr;
    for (const raw of pg) {
      if (!raw || typeof raw !== 'object' || !raw.type) continue;
      if (raw.type === '__video') { skippedVideo++; continue; }
      if (!PB.shapes[raw.type]) { unknown++; continue; }

      const o = copyObj(raw);
      const maskData = o._maskData;
      delete o._maskData;
      if (!o._maskPad) o._maskPad = MASK_PAD;

      if (isTextObj(o)) { try { measureText(o); } catch (e) {} }
      arr.push(o);

      if (o.type === '__image' && typeof o.src === 'string') {
        imgTasks.push(new Promise(resolve => {
          const img = new Image();
          img.onload = () => { o._img = img; o._origImg = img; resolve(); };
          img.onerror = () => resolve();
          img.src = o.src;
        }));
      }

      if (typeof maskData === 'string' && maskData.slice(0, 11) === 'data:image/') {
        maskTasks.push(loadMaskInto(o, maskData));
      }
    }
    return arr;
  });

  if (!newPages.length) newPages.push([]);
  await Promise.all(maskTasks);
  await Promise.all(imgTasks);

  stopAllAnimations();
  pushSnapshot();

  pages = newPages;
  pageIndex = Math.min(Math.max(0, parseInt(doc.pageIndex, 10) || 0), pages.length - 1);
  objects = pages[pageIndex];
  selection = [];
  current = null;
  drawing = false;
  erasing = false;
  marquee = null;
  selState = null;

  if (doc.bg && BG_PRESETS.some(p => p.id === doc.bg)) applyBg(doc.bg);
  if (doc.view && typeof doc.view.scale === 'number') {
    view.scale = Math.max(view.minScale, Math.min(view.maxScale, doc.view.scale));
    view.offsetX = doc.view.offsetX || 0;
    view.offsetY = doc.view.offsetY || 0;
  }

  buildShapePanel();
  setTool('select', true);
  updateSelBar();
  updatePageUI();
  updateHistoryButtons();
  render();
  drawPreview();
  if (thumbPanel.classList.contains('show')) buildThumbnails();

  let msg = '已加载 ' + pages.length + ' 页内容';
  if (newShapes) msg += '，新增 ' + newShapes + ' 个自定义图形';
  if (unknown) msg += '（' + unknown + ' 个图形未识别，已跳过）';
  if (skippedVideo) msg += '（' + skippedVideo + ' 个视频需重新导入）';
  toast(msg, 4600);
}

function loadDocFile() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json,application/json';
  inp.style.display = 'none';
  document.body.appendChild(inp);

  inp.onchange = async () => {
    const f = inp.files && inp.files[0];
    setTimeout(() => inp.remove(), 0);
    if (!f) return;
    try {
      const text = await f.text();
      const doc = JSON.parse(text);
      await applyDoc(doc);
    } catch (e) {
      console.error(e);
      toast('加载失败：' + (e && e.message ? e.message : e), 3600);
    }
  };
  inp.click();
}

(function setupDocDrop() {
  let dragDepth = 0;
  window.addEventListener('dragenter', e => {
    if (!e.dataTransfer) return;
    const hasFile = Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0;
    if (!hasFile) return;
    dragDepth++;
  });
  window.addEventListener('dragover', e => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  });
  window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); });
  window.addEventListener('drop', async e => {
    dragDepth = 0;
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    if (/\.json$/i.test(f.name)) {
      e.preventDefault();
      try {
        const text = await f.text();
        const doc = JSON.parse(text);
        await applyDoc(doc);
      } catch (err) {
        console.error(err);
        toast('加载失败：' + (err && err.message ? err.message : err), 3600);
      }
    } else if (/^image\//.test(f.type || '')) {
      e.preventDefault();
      await insertImageFile(f);
    } else if (/^video\//.test(f.type || '')) {
      e.preventDefault();
      await insertVideoFile(f);
    }
  });
})();

/* =====================================================================
 * 25. 缩略图
 * ===================================================================== */
pgLabel.addEventListener('click', () => {
  if (thumbPanel.classList.contains('show')) thumbPanel.classList.remove('show');
  else { buildThumbnails(); thumbPanel.classList.add('show'); }
});
document.addEventListener('click', e => {
  if (!thumbPanel.classList.contains('show')) return;
  if (thumbPanel.contains(e.target)) return;
  if (e.target.closest('.corner-br')) return;
  thumbPanel.classList.remove('show');
});
function buildThumbnails() {
  thumbScroll.innerHTML = '';
  const frag = document.createDocumentFragment();
  pages.forEach((pg, i) => {
    const item = document.createElement('div');
    item.className = 'thumb-item' + (i === pageIndex ? ' active' : '');
    item.title = '第 ' + (i + 1) + ' 页';
    const cvs = document.createElement('canvas');
    const thumbW = 240, thumbH = 150;
    cvs.width = thumbW; cvs.height = thumbH;
    const tctx = cvs.getContext('2d');

paintBackgroundToCanvas(tctx, thumbW, thumbH, { solidFallback: true });

    if (pg.length) {
      const bb = unionBBox(pg);
      const pad = 10;
      const ww = Math.max(1, bb.x2 - bb.x1 + pad * 2);
      const wh = Math.max(1, bb.y2 - bb.y1 + pad * 2);
      const s = Math.min(thumbW / ww, thumbH / wh);
      tctx.save();
      tctx.translate(
        (thumbW - ww * s) / 2 - (bb.x1 - pad) * s,
        (thumbH - wh * s) / 2 - (bb.y1 - pad) * s
      );
      tctx.scale(s, s);
      for (const o of pg) { try { drawObject(tctx, o); } catch (err) {} }
      tctx.restore();
    }

    const img = document.createElement('img');
    img.src = cvs.toDataURL('image/png');
    img.alt = '第 ' + (i + 1) + ' 页';
    item.appendChild(img);
    const num = document.createElement('div');
    num.className = 'thumb-num';
    num.textContent = i + 1;
    item.appendChild(num);
    item.addEventListener('click', (e) => {
      if (item._noClick) return;
      e.stopPropagation();
      goPage(i);
    });
    attachThumbDragDelete(item, i);
    frag.appendChild(item);
  });
  thumbScroll.appendChild(frag);
  thumbCount.textContent = '共 ' + pages.length + ' 页';
}
function attachThumbDragDelete(item, idx) {
  let pid = null, sx = 0, sy = 0, dx = 0, decided = false, dragging = false;
  const THRESH = 96, ARM = 60;

  item.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    pid = e.pointerId; sx = e.clientX; sy = e.clientY;
    dx = 0; decided = false; dragging = false;
    item.style.transition = 'none';
  });

  item.addEventListener('pointermove', e => {
    if (pid !== e.pointerId) return;
    const mx = e.clientX - sx, my = e.clientY - sy;

    if (!decided) {
      if (Math.abs(mx) > 8 && Math.abs(mx) >= Math.abs(my)) {
        decided = true; dragging = true;
        item.classList.add('tdragging');
        try { item.setPointerCapture(e.pointerId); } catch (err) {}
      } else if (Math.abs(my) > 10) {
        decided = true; dragging = false;
      } else return;
    }
    if (!dragging) return;

    if (e.cancelable) e.preventDefault();
    dx = Math.max(-30, mx);
    item.style.transform = 'translateX(' + dx + 'px)';
    item.style.opacity = String(1 - Math.min(1, Math.max(0, dx) / THRESH) * 0.45);
    item.classList.toggle('tarmed', dx >= ARM);
  }, { passive: false });

  const end = e => {
    if (pid !== e.pointerId) return;
    pid = null;
    if (!dragging) { item.style.transition = ''; decided = false; return; }

    item._noClick = true;
    setTimeout(() => { item._noClick = false; }, 450);
    item.classList.remove('tdragging');
    item.style.transition = 'transform .2s ease, opacity .2s ease';

    if (dx >= THRESH) {
      item.classList.add('tarmed');
      item.style.transform = 'translateX(135%)';
      item.style.opacity = '0';
      setTimeout(() => deletePage(idx), 180);
    } else {
      item.classList.remove('tarmed');
      item.style.transform = '';
      item.style.opacity = '';
    }
    dragging = false; decided = false;
  };
  item.addEventListener('pointerup', end);
  item.addEventListener('pointercancel', end);

  item.addEventListener('click', e => {
    if (item._noClick) { e.stopPropagation(); e.preventDefault(); }
  }, true);
}

/* =====================================================================
 * 26. 小程序
 * ===================================================================== */
const widgetLayer = document.getElementById('widgetLayer');
let widgetZ = 62;
let widgetSpawnCount = 0;
const openWidgets = new Map();

function makeWidgetDraggable(el) {
  const handle = el.querySelector('.widget-head');
  if (!handle) return;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0, activeId = null;

  const onDown = e => {
    if (e.target.closest('.widget-close, .widget-zoom, button, input, textarea, select, .mini-btn')) return;
    const rect = el.getBoundingClientRect();
    startX = e.clientX; startY = e.clientY;
    startLeft = rect.left; startTop = rect.top;
    el.style.left = startLeft + 'px';
    el.style.top = startTop + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    widgetZ++;
    el.style.zIndex = widgetZ;
    activeId = e.pointerId;
    try { handle.setPointerCapture(activeId); } catch (err) {}
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  };
  const onMove = e => {
    if (e.pointerId !== activeId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let nl = startLeft + dx, nt = startTop + dy;
    const rect = el.getBoundingClientRect();
    const maxL = window.innerWidth - rect.width - 4;
    const maxT = window.innerHeight - rect.height - 4;
    nl = Math.max(-rect.width + 60, Math.min(maxL, nl));
    nt = Math.max(0, Math.min(maxT, nt));
    el.style.left = nl + 'px';
    el.style.top = nt + 'px';
  };
  const onUp = e => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onUp);
    handle.removeEventListener('pointercancel', onUp);
  };
  handle.addEventListener('pointerdown', onDown);
}

const WIDGET_ZOOM_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M4 10V4h6"/><path d="M20 14v6h-6"/>' +
  '<path d="M4 4l6 6"/><path d="M20 20l-6-6"/></svg>';

const WIDGET_ZOOM_STEPS = [1, 2, 4];

function applyWidgetScale(el, s) {
  el._scale = s;
  el.style.transform = (s === 1) ? '' : 'scale(' + s + ')';
  const zb = el.querySelector('.widget-zoom');
  if (zb) zb.classList.toggle('on', s !== 1);

  const w = el.offsetWidth * s;
  const h = el.offsetHeight * s;
  let l = parseFloat(el.style.left);
  let t = parseFloat(el.style.top);
  if (!isFinite(l)) l = el.getBoundingClientRect().left;
  if (!isFinite(t)) t = el.getBoundingClientRect().top;
  if (l + w > window.innerWidth - 8) l = window.innerWidth - w - 8;
  if (t + h > window.innerHeight - 8) t = window.innerHeight - h - 8;
  if (l < 8) l = 8;
  if (t < 8) t = 8;
  el.style.left = l + 'px';
  el.style.top = t + 'px';
}

function setupAutoHide(el, delay) {
  delay = delay || 4000;
  let timer = null;
  let hovering = false;

  function enterImmersive() {
    if (hovering) return;
    el.classList.add('immersive');
  }
  function exitImmersive() {
    el.classList.remove('immersive');
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(enterImmersive, delay);
  }

  el.addEventListener('pointerenter', () => {
    hovering = true;
    clearTimeout(timer);
    exitImmersive();
  });
  el.addEventListener('pointerleave', () => {
    hovering = false;
    schedule();
  });
  el.addEventListener('pointerdown', () => {
    clearTimeout(timer);
    exitImmersive();
  });
  el.addEventListener('pointerup', () => {
    schedule();
  });

  el._cleanupAutoHide = () => { clearTimeout(timer); };
  el._exitImmersive = exitImmersive;
  el._scheduleAutoHide = schedule;

  schedule();
}

function createWidget(appId, title, iconSvg) {
  if (openWidgets.has(appId)) {
    const w = openWidgets.get(appId);
    widgetZ++;
    w.el.style.zIndex = widgetZ;
    w.el.classList.remove('immersive');
    if (w.el._scheduleAutoHide) w.el._scheduleAutoHide();
    return w.el;
  }
  const el = document.createElement('div');
  el.className = 'widget';
  // 阻止内部点击事件冒泡到全局，防止触发 canvas 的拖拽或关闭逻辑
  el.addEventListener('pointerdown', e => e.stopPropagation());
  el.dataset.app = appId;
  const offset = widgetSpawnCount % 6;
  widgetSpawnCount++;
  el.style.left = (60 + offset * 26) + 'px';
  el.style.top = (110 + offset * 24) + 'px';
  el.style.zIndex = ++widgetZ;

  el.innerHTML =
    '<div class="widget-head">' +
      '<div class="widget-title">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + iconSvg + '</svg>' +
        '<span>' + escapeHtml(title) + '</span>' +
      '</div>' +
      '<button class="widget-zoom" title="放大 / 还原（1× → 2× → 4×）">' + WIDGET_ZOOM_ICON + '</button>' +
      '<button class="widget-close" title="关闭">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="widget-body"></div>';
  widgetLayer.appendChild(el);
  makeWidgetDraggable(el);

  el._scale = 1;
  el._scaleIdx = 0;
  el.querySelector('.widget-zoom').addEventListener('click', ev => {
    ev.stopPropagation();
    el._scaleIdx = (el._scaleIdx + 1) % WIDGET_ZOOM_STEPS.length;
    widgetZ++;
    el.style.zIndex = widgetZ;
    applyWidgetScale(el, WIDGET_ZOOM_STEPS[el._scaleIdx]);
  });

  const cleanup = [];
  const api = {
    el,
    body: el.querySelector('.widget-body'),
    addCleanup: fn => cleanup.push(fn),
    onClose: null
  };
  const destroy = () => {
    if (api.onClose) { try { api.onClose(); } catch (e) {} }
    cleanup.forEach(fn => { try { fn(); } catch (e) {} });
    if (el._cleanupAutoHide) { try { el._cleanupAutoHide(); } catch (e) {} }
    el.remove();
    openWidgets.delete(appId);
  };
  el.querySelector('.widget-close').addEventListener('click', destroy);
  openWidgets.set(appId, { el, destroy });
  return el;
}

function wireWidgetActions(el, handlers) {
  el.addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]');
    if (!btn || !el.contains(btn)) return;
    const act = btn.dataset.act;
    if (handlers[act]) handlers[act](btn, e);
  });
}

const pad2 = n => String(n).padStart(2, '0');
const pad3 = n => String(n).padStart(3, '0');

function openClockApp() {
  const el = createWidget('clock', '本地时间',
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
  setupAutoHide(el, 4000);
  const body = el.querySelector('.widget-body');
  body.innerHTML =
    '<div class="mini-display" data-el="time">--:--:--</div>' +
    '<div class="mini-sub" data-el="date">加载中…</div>' +
    '<div class="mini-row center">' +
      '<button class="mini-btn" data-act="fmt">24 小时制</button>' +
      '<button class="mini-btn" data-act="sec">显示秒</button>' +
      '<button class="mini-btn" data-act="date">显示日期</button>' +
    '</div>';
  const timeEl = body.querySelector('[data-el=time]');
  const dateEl = body.querySelector('[data-el=date]');
  let fmt24 = true;
  let showSec = true;
  let showDate = true;

  const weekdays = ['日','一','二','三','四','五','六'];
  function tick() {
    const d = new Date();
    let h = d.getHours();
    let ampm = '';
    if (!fmt24) {
      ampm = h >= 12 ? ' PM' : ' AM';
      h = h % 12;
      if (h === 0) h = 12;
    }
    let t = pad2(h) + ':' + pad2(d.getMinutes());
    if (showSec) t += ':' + pad2(d.getSeconds());
    timeEl.textContent = t + ampm;
    if (showDate) {
      dateEl.textContent = d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() +
        '日 星期' + weekdays[d.getDay()];
      dateEl.style.display = '';
    } else {
      dateEl.style.display = 'none';
    }
  }
  tick();
  const timer = setInterval(tick, 200);
  el._cleanup = () => clearInterval(timer);

  const w = openWidgets.get('clock');
  const origDestroy = w.destroy;
  w.destroy = () => { clearInterval(timer); origDestroy(); };

  wireWidgetActions(el, {
    fmt: btn => {
      fmt24 = !fmt24;
      btn.textContent = fmt24 ? '24 小时制' : '12 小时制';
      tick();
    },
    sec: btn => {
      showSec = !showSec;
      btn.textContent = showSec ? '显示秒' : '隐藏秒';
      btn.classList.toggle('primary', showSec);
      tick();
    },
    date: btn => {
      showDate = !showDate;
      btn.textContent = showDate ? '显示日期' : '隐藏日期';
      btn.classList.toggle('primary', showDate);
      tick();
    }
  });
}

function openCountdownApp() {
  const el = createWidget('countdown', '倒计时',
    '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>');
  setupAutoHide(el, 4000);
  const body = el.querySelector('.widget-body');
  body.innerHTML =
    '<div class="mini-display md" data-el="disp">00:05:00</div>' +
    '<div class="mini-row center" data-el="setRow">' +
      '<span class="mini-label">时</span>' +
      '<input type="number" class="mini-input cd-inp" data-el="hh" min="0" max="99" value="0">' +
      '<span class="mini-label">分</span>' +
      '<input type="number" class="mini-input cd-inp" data-el="mm" min="0" max="59" value="5">' +
      '<span class="mini-label">秒</span>' +
      '<input type="number" class="mini-input cd-inp" data-el="ss" min="0" max="59" value="0">' +
    '</div>' +
    '<div class="mini-row center">' +
      '<button class="mini-btn primary" data-act="start">开始</button>' +
      '<button class="mini-btn" data-act="reset">重置</button>' +
    '</div>';

  const disp = body.querySelector('[data-el=disp]');
  const hhInp = body.querySelector('[data-el=hh]');
  const mmInp = body.querySelector('[data-el=mm]');
  const ssInp = body.querySelector('[data-el=ss]');
  const startBtn = body.querySelector('[data-act=start]');

  let remain = 300;
  let running = false;
  let endTs = 0;
  let tickId = null;
  let blinkTimer = null;

  function fmt(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return pad2(h) + ':' + pad2(m) + ':' + pad2(s);
  }
  function renderDisplay() {
    disp.textContent = fmt(remain);
    const warn = remain <= 10 && remain > 0;
    disp.style.color = warn ? '#fca5a5' : '#7dd3fc';
    disp.style.textShadow = warn
      ? '0 0 20px rgba(248,113,113,.6)'
      : '0 0 20px rgba(56,189,248,.5)';
  }
  function readInputs() {
    const hh = Math.max(0, Math.min(99, parseInt(hhInp.value, 10) || 0));
    const mm = Math.max(0, Math.min(59, parseInt(mmInp.value, 10) || 0));
    const ss = Math.max(0, Math.min(59, parseInt(ssInp.value, 10) || 0));
    hhInp.value = hh; mmInp.value = mm; ssInp.value = ss;
    remain = hh * 3600 + mm * 60 + ss;
    renderDisplay();
  }
  function clearTick() {
    if (tickId) { clearInterval(tickId); tickId = null; }
  }
  function clearBlink() {
    if (blinkTimer) { clearInterval(blinkTimer); blinkTimer = null; }
    disp.style.opacity = '1';
  }
  function startBlink() {
    clearBlink();
    let on = true;
    blinkTimer = setInterval(() => { on = !on; disp.style.opacity = on ? '1' : '0.15'; }, 400);
  }
  function finish() {
    running = false;
    clearTick();
    remain = 0;
    renderDisplay();
    startBlink();
    startBtn.textContent = '开始';
    startBtn.classList.add('primary');
    if (el._exitImmersive) el._exitImmersive();
    toast('倒计时结束');
  }
  function tick() {
    const left = Math.max(0, Math.ceil((endTs - performance.now()) / 1000));
    if (left !== remain) { remain = left; renderDisplay(); }
    if (left <= 0) finish();
  }
  function start() {
    if (running) return;
    clearBlink();
    if (remain <= 0) {
      readInputs();
      if (remain <= 0) { toast('请先设置时间'); return; }
    }
    running = true;
    endTs = performance.now() + remain * 1000;
    clearTick();
    tickId = setInterval(tick, 100);
    startBtn.textContent = '暂停';
    startBtn.classList.remove('primary');
  }
  function pause() {
    if (!running) return;
    running = false;
    remain = Math.max(0, Math.ceil((endTs - performance.now()) / 1000));
    clearTick();
    renderDisplay();
    startBtn.textContent = '继续';
    startBtn.classList.add('primary');
  }
  function reset() {
    running = false;
    clearTick();
    clearBlink();
    readInputs();
    startBtn.textContent = '开始';
    startBtn.classList.add('primary');
  }

  [hhInp, mmInp, ssInp].forEach(inp => {
    inp.addEventListener('change', () => { if (!running) readInputs(); });
  });
  readInputs();

  wireWidgetActions(el, {
    start: () => { if (running) pause(); else start(); },
    reset
  });

  const w = openWidgets.get('countdown');
  const origDestroy = w.destroy;
  w.destroy = () => { running = false; clearTick(); clearBlink(); origDestroy(); };
}

function openStopwatchApp() {
  const el = createWidget('stopwatch', '秒表',
    '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5"/><path d="M9 3h6"/>');
  setupAutoHide(el, 4000);
  const body = el.querySelector('.widget-body');
  body.innerHTML =
    '<div class="mini-display" data-el="disp">00:00.00</div>' +
    '<div class="mini-row center">' +
      '<button class="mini-btn primary" data-act="start">开始</button>' +
      '<button class="mini-btn" data-act="lap">计次</button>' +
      '<button class="mini-btn danger" data-act="reset">重置</button>' +
    '</div>' +
    '<div class="lap-list" data-el="laps"></div>';
  const disp = body.querySelector('[data-el=disp]');
  const lapList = body.querySelector('[data-el=laps]');

  let running = false;
  let startTs = 0;
  let accumMs = 0;
  let rafId = null;
  let laps = [];

  function fmtMs(ms) {
    const total = Math.floor(ms);
    const m = Math.floor(total / 60000);
    const s = Math.floor((total % 60000) / 1000);
    const cs = Math.floor((total % 1000) / 10);
    return pad2(m) + ':' + pad2(s) + '.' + pad2(cs);
  }
  function currentMs() {
    return accumMs + (running ? (performance.now() - startTs) : 0);
  }
  function updateDisplay() {
    disp.textContent = fmtMs(currentMs());
  }
  function loop() {
    if (!running) return;
    updateDisplay();
    rafId = requestAnimationFrame(loop);
  }
  function start() {
    if (running) return;
    running = true;
    startTs = performance.now();
    const startBtn = body.querySelector('[data-act=start]');
    startBtn.textContent = '暂停';
    startBtn.classList.remove('primary');
    rafId = requestAnimationFrame(loop);
  }
  function pause() {
    if (!running) return;
    accumMs += performance.now() - startTs;
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    const startBtn = body.querySelector('[data-act=start]');
    startBtn.textContent = '继续';
    startBtn.classList.add('primary');
    updateDisplay();
  }
  function reset() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    accumMs = 0;
    laps = [];
    lapList.innerHTML = '';
    updateDisplay();
    const startBtn = body.querySelector('[data-act=start]');
    startBtn.textContent = '开始';
    startBtn.classList.add('primary');
  }
  function lap() {
    const t = currentMs();
    if (t === 0) return;
    laps.push(t);
    const diff = laps.length > 1 ? t - laps[laps.length - 2] : t;
    const row = document.createElement('div');
    row.className = 'lap-row';
    row.innerHTML = '<span>#' + laps.length + '</span><b>' + fmtMs(diff) + '</b><span>' + fmtMs(t) + '</span>';
    lapList.insertBefore(row, lapList.firstChild);
    if (laps.length > 50) {
      laps.shift();
      if (lapList.lastChild) lapList.removeChild(lapList.lastChild);
    }
  }
  updateDisplay();

  wireWidgetActions(el, {
    start: () => { if (running) pause(); else start(); },
    lap,
    reset
  });

  const w = openWidgets.get('stopwatch');
  const origDestroy = w.destroy;
  w.destroy = () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    origDestroy();
  };
}

const ROLLCALL_LS_KEY = 'pb_rollcall_names';
let rollcallNames = (function () {
  try {
    const raw = localStorage.getItem(ROLLCALL_LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
})();
function saveRollcallNames() {
  try { localStorage.setItem(ROLLCALL_LS_KEY, JSON.stringify(rollcallNames)); } catch (e) {}
}

function openRollcallApp() {
  const el = createWidget('rollcall', '点名器',
    '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>');
  const body = el.querySelector('.widget-body');
  body.innerHTML =
    '<div class="rollcall-stage" data-el="stage">' +
      '<div class="rollcall-name" data-el="name">准备就绪</div>' +
    '</div>' +
    '<div class="rollcall-results" data-el="results"></div>' +
    '<div class="mini-row center" style="margin-top:10px;">' +
      '<span class="mini-label">抽取</span>' +
      '<select class="mini-input" data-el="count" style="width:auto;padding:0 8px;">' +
        '<option>1</option><option>2</option><option>3</option>' +
        '<option>4</option><option>5</option><option>6</option>' +
        '<option>7</option><option>8</option><option>9</option><option>10</option>' +
      '</select>' +
      '<span class="mini-label">人</span>' +
      '<button class="mini-btn primary" data-act="roll" style="margin-left:4px;">开始抽取</button>' +
    '</div>' +
    '<div class="mini-row center" style="margin-top:6px;">' +
      '<button class="mini-btn" data-act="toggleNames">名单管理</button>' +
      '<button class="mini-btn" data-act="reset" title="清空本轮结果">重置</button>' +
    '</div>' +
    '<div class="rollcall-names-panel" data-el="namesPanel">' +
      '<textarea data-el="namesInput" placeholder="每行一个名字，例如：&#10;张三&#10;李四&#10;王五"></textarea>' +
      '<div class="mini-row" style="margin-top:6px;">' +
        '<button class="mini-btn primary" data-act="saveNames">保存名单</button>' +
        '<button class="mini-btn" data-act="loadDemo">示例名单</button>' +
        '<button class="mini-btn danger" data-act="clearNames">清空</button>' +
        '<span class="mini-label" data-el="nameCount" style="margin-left:auto;"></span>' +
      '</div>' +
      '<div class="rollcall-hint">名单会自动保存在本机浏览器中。抽取人数可在上方下拉框选择。</div>' +
    '</div>';

  const stage = body.querySelector('[data-el=stage]');
  const results = body.querySelector('[data-el=results]');
  const countSel = body.querySelector('[data-el=count]');
  const namesPanel = body.querySelector('[data-el=namesPanel]');
  const namesInput = body.querySelector('[data-el=namesInput]');
  const nameCount = body.querySelector('[data-el=nameCount]');

  let rolling = false;
  let rollTimer = null;
  let usedInRound = new Set();

  function updateNameCount() {
    nameCount.textContent = '共 ' + rollcallNames.length + ' 人';
  }
  function refreshNamesInput() {
    namesInput.value = rollcallNames.join('\n');
    updateNameCount();
  }
  refreshNamesInput();

  function pickRandomNames(count) {
    let pool = rollcallNames.filter(n => !usedInRound.has(n));
    if (pool.length < count) {
      usedInRound.clear();
      pool = rollcallNames.slice();
      if (pool.length === 0) return [];
      toast('本轮已抽完，自动开始新一轮');
    }
    const picked = [];
    const tmp = pool.slice();
    for (let i = 0; i < count && tmp.length > 0; i++) {
      const idx = Math.floor(Math.random() * tmp.length);
      picked.push(tmp[idx]);
      tmp.splice(idx, 1);
    }
    return picked;
  }

  function renderPicked(picked, settled) {
    stage.innerHTML = '';
    if (!picked.length) {
      const d = document.createElement('div');
      d.className = 'rollcall-name';
      d.textContent = rollcallNames.length ? '准备就绪' : '请先添加名单';
      stage.appendChild(d);
      return;
    }
    picked.forEach(n => {
      const d = document.createElement('div');
      d.className = 'rollcall-name' + (settled ? ' settled' : '');
      d.textContent = n;
      stage.appendChild(d);
    });
  }

  function startRoll() {
    if (rolling) return;
    if (rollcallNames.length === 0) { toast('请先在「名单管理」里添加学生'); return; }
    const count = Math.max(1, parseInt(countSel.value) || 1);
    const finalPick = pickRandomNames(count);
    if (!finalPick.length) return;
    rolling = true;
    const rollBtn = body.querySelector('[data-act=roll]');
    rollBtn.textContent = '抽取中…';
    rollBtn.disabled = true;

    const duration = 2200;
    const t0 = performance.now();
    let lastUpdate = 0;

    function step(now) {
      const el2 = now - t0;
      const t = Math.min(1, el2 / duration);
      const interval = 40 + 190 * Math.pow(t, 3);
      if (el2 - lastUpdate >= interval) {
        lastUpdate = el2;
        const tmp = [];
        for (let i = 0; i < count; i++) {
          tmp.push(rollcallNames[Math.floor(Math.random() * rollcallNames.length)]);
        }
        renderPicked(tmp, false);
      }
      if (t >= 1) {
        renderPicked(finalPick, true);
        finalPick.forEach(n => usedInRound.add(n));
        rolling = false;
        rollBtn.textContent = '开始抽取';
        rollBtn.disabled = false;
        const prev = results.textContent.trim();
        const line = finalPick.join('、');
        if (prev) results.textContent = prev + '  |  ' + line;
        else results.textContent = '本轮：' + line;
        return;
      }
      rollTimer = requestAnimationFrame(step);
    }
    rollTimer = requestAnimationFrame(step);
  }

  wireWidgetActions(el, {
    roll: startRoll,
    reset: () => {
      usedInRound.clear();
      results.textContent = '';
      renderPicked([], true);
      toast('已重置本轮结果');
    },
    toggleNames: () => {
      namesPanel.classList.toggle('show');
    },
    saveNames: () => {
      const lines = namesInput.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      rollcallNames = lines;
      saveRollcallNames();
      usedInRound.clear();
      updateNameCount();
      toast('已保存 ' + lines.length + ' 位学生');
    },
    loadDemo: () => {
      const demo = ['张三','李四','王五','赵六','钱七','孙八','周九','吴十',
                    '郑一','王二','冯三','陈四','褚五','卫六','蒋七','沈八'];
      namesInput.value = demo.join('\n');
      toast('已填入示例名单，点「保存名单」生效');
    },
    clearNames: () => {
      namesInput.value = '';
      rollcallNames = [];
      saveRollcallNames();
      usedInRound.clear();
      updateNameCount();
      renderPicked([], true);
      toast('已清空名单');
    }
  });

  const w = openWidgets.get('rollcall');
  const origDestroy = w.destroy;
  w.destroy = () => {
    if (rollTimer) cancelAnimationFrame(rollTimer);
    origDestroy();
  };
}

function openRandomApp() {
  const el = createWidget('random', '随机数',
    '<path d="M4 8h3l3 8 3-8 3 8 3-8h2"/>');
  const body = el.querySelector('.widget-body');
  body.innerHTML =
    '<div class="random-list" data-el="out" style="min-height:44px;">' +
      '<div class="mini-label" style="padding:12px;">点击下方按钮生成</div>' +
    '</div>' +
    '<div class="mini-row center">' +
      '<span class="mini-label">从</span>' +
      '<input type="number" class="mini-input" data-el="min" value="1">' +
      '<span class="mini-label">到</span>' +
      '<input type="number" class="mini-input" data-el="max" value="100">' +
      '<span class="mini-label">个数</span>' +
      '<input type="number" class="mini-input" data-el="cnt" value="1" min="1" max="30">' +
    '</div>' +
    '<div class="mini-row center" style="margin-top:8px;">' +
      '<label style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text-dim);cursor:pointer;">' +
        '<input type="checkbox" data-el="unique" style="accent-color:var(--accent);"> 不重复' +
      '</label>' +
    '</div>' +
    '<div class="mini-row center" style="margin-top:8px;">' +
      '<button class="mini-btn primary" data-act="gen">生成</button>' +
      '<button class="mini-btn" data-act="clear">清空</button>' +
    '</div>';

  const out = body.querySelector('[data-el=out]');
  const minInp = body.querySelector('[data-el=min]');
  const maxInp = body.querySelector('[data-el=max]');
  const cntInp = body.querySelector('[data-el=cnt]');
  const uniqueCb = body.querySelector('[data-el=unique]');

  function generate() {
    let min = parseInt(minInp.value);
    let max = parseInt(maxInp.value);
    let cnt = Math.max(1, Math.min(30, parseInt(cntInp.value) || 1));
    if (isNaN(min) || isNaN(max)) { toast('请输入有效的范围'); return; }
    if (min > max) { const t = min; min = max; max = t; }
    const range = max - min + 1;
    if (uniqueCb.checked && cnt > range) {
      toast('范围只有 ' + range + ' 个数，无法生成 ' + cnt + ' 个不重复的数');
      return;
    }
    const res = [];
    if (uniqueCb.checked) {
      const pool = [];
      for (let i = min; i <= max; i++) pool.push(i);
      for (let i = 0; i < cnt; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        res.push(pool[idx]);
        pool.splice(idx, 1);
      }
    } else {
      for (let i = 0; i < cnt; i++) {
        res.push(min + Math.floor(Math.random() * range));
      }
    }
    out.innerHTML = '';
    let i = 0;
    const step = () => {
      if (i >= res.length) return;
      const d = document.createElement('div');
      d.className = 'random-num';
      d.textContent = res[i];
      out.appendChild(d);
      i++;
      if (i < res.length) setTimeout(step, 60);
    };
    step();
  }

  wireWidgetActions(el, {
    gen: generate,
    clear: () => {
      out.innerHTML = '<div class="mini-label" style="padding:12px;">点击下方按钮生成</div>';
    }
  });
}

function openDiceApp() {
  const el = createWidget('dice', '骰子',
    '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="16" cy="16" r="1.4" fill="currentColor"/>');
  const body = el.querySelector('.widget-body');
  body.innerHTML =
    '<div class="dice-row" data-el="row"></div>' +
    '<div class="mini-row center">' +
      '<span class="mini-label">骰子数</span>' +
      '<select class="mini-input" data-el="cnt" style="width:auto;padding:0 8px;">' +
        '<option>1</option><option>2</option><option>3</option>' +
        '<option>4</option><option>5</option><option>6</option>' +
      '</select>' +
    '</div>' +
    '<div class="mini-row center" style="margin-top:8px;">' +
      '<button class="mini-btn primary" data-act="roll">掷骰子</button>' +
      '<button class="mini-btn" data-act="reset">清空</button>' +
    '</div>';

  const row = body.querySelector('[data-el=row]');
  const cntSel = body.querySelector('[data-el=cnt]');
  let rolling = false;
  let rollTimer = null;

  const PIP_MAP = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9]
  };

  function renderDie(value) {
    const die = document.createElement('div');
    die.className = 'die';
    const on = PIP_MAP[value] || [];
    for (let i = 1; i <= 9; i++) {
      const dot = document.createElement('div');
      dot.className = 'die-dot' + (on.indexOf(i) >= 0 ? ' on' : '');
      die.appendChild(dot);
    }
    return die;
  }

  function buildDice(values) {
    row.innerHTML = '';
    values.forEach(v => row.appendChild(renderDie(v)));
  }

  function roll() {
    if (rolling) return;
    const cnt = Math.max(1, Math.min(6, parseInt(cntSel.value) || 1));
    rolling = true;
    const rollBtn = body.querySelector('[data-act=roll]');
    rollBtn.disabled = true;

    const finalValues = [];
    for (let i = 0; i < cnt; i++) finalValues.push(1 + Math.floor(Math.random() * 6));

    const duration = 1000;
    const t0 = performance.now();
    let lastUpdate = 0;

    function step(now) {
      const el2 = now - t0;
      const t = Math.min(1, el2 / duration);
      const interval = 60 + 160 * Math.pow(t, 2);
      if (el2 - lastUpdate >= interval) {
        lastUpdate = el2;
        const tmp = [];
        for (let i = 0; i < cnt; i++) tmp.push(1 + Math.floor(Math.random() * 6));
        buildDice(tmp);
        row.querySelectorAll('.die').forEach(d => d.classList.add('rolling'));
      }
      if (t >= 1) {
        buildDice(finalValues);
        rolling = false;
        rollBtn.disabled = false;
        const sum = finalValues.reduce((a, b) => a + b, 0);
        if (cnt > 1) toast('点数：' + finalValues.join(' + ') + ' = ' + sum);
        else toast('点数：' + finalValues[0]);
        return;
      }
      rollTimer = requestAnimationFrame(step);
    }
    rollTimer = requestAnimationFrame(step);
  }

  wireWidgetActions(el, {
    roll,
    reset: () => {
      row.innerHTML = '';
      toast('已清空');
    }
  });

  buildDice([1]);

  const w = openWidgets.get('dice');
  const origDestroy = w.destroy;
  w.destroy = () => {
    if (rollTimer) cancelAnimationFrame(rollTimer);
    origDestroy();
  };
}

const MINIAPPS = [
  {
    id: 'clock',
    title: '本地时间',
    sub: '数字时钟，可显示秒与日期',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    open: openClockApp
  },
  {
    id: 'countdown',
    title: '倒计时',
    sub: '时/分/秒，结束闪烁提醒',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>',
    open: openCountdownApp
  },
  {
    id: 'stopwatch',
    title: '秒表',
    sub: '支持计次，精确到百分秒',
    icon: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5"/><path d="M9 3h6"/>',
    open: openStopwatchApp
  },
  {
    id: 'rollcall',
    title: '点名器',
    sub: '滚动抽取，名单可保存',
    icon: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    open: openRollcallApp
  },
  {
    id: 'random',
    title: '随机数',
    sub: '指定范围，可批量生成',
    icon: '<path d="M4 8h3l3 8 3-8 3 8 3-8h2"/>',
    open: openRandomApp
  },
  {
    id: 'dice',
    title: '骰子',
    sub: '1~6 颗骰子，带滚动动画',
    icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="16" cy="16" r="1.4" fill="currentColor"/>',
    open: openDiceApp
  }
];

function buildMiniappLauncher() {
  const grid = document.getElementById('miniappGrid');
  grid.innerHTML = '';
  MINIAPPS.forEach(app => {
    const b = document.createElement('button');
    b.className = 'miniapp-card';
    b.dataset.app = app.id;
    b.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + app.icon + '</svg>' +
      '<div class="mac-title">' + escapeHtml(app.title) + '</div>' +
      '<div class="mac-sub">' + escapeHtml(app.sub) + '</div>';
    b.addEventListener('click', () => {
      closeModal('miniappModal');
      app.open();
    });
    grid.appendChild(b);
  });
}
function openMiniappLauncher() {
  buildMiniappLauncher();
  openModal('miniappModal');
}

/* =====================================================================
 * 26.5 关闭前提示
 * ===================================================================== */
function askSaveBeforeClose() {
  if (document.getElementById('__closeConfirm')) {
    return Promise.resolve('cancel');
  }

  return new Promise(function (resolve) {
    var wrap = document.createElement('div');
    wrap.id = '__closeConfirm';
    wrap.className = 'modal show';
    wrap.style.zIndex = '9999';
    wrap.innerHTML =
      '<div class="modal-card" style="max-width:430px;">' +
        '<div class="modal-head">关闭程序</div>' +
        '<div class="modal-body">' +
          '<p style="margin:0 0 12px;font-size:14px;color:#e6edf7;">' +
            '关闭前是否保存当前白板内容？' +
          '</p>' +
          '<div class="tip-line">' +
            '选择「保存并关闭」会导出 <b>.json</b> 工程文件，' +
            '包含全部页面、图形与自定义组合图形。<br>' +
            '下次打开后可用 <b>菜单 → 加载文件</b> 恢复。' +
          '</div>' +
        '</div>' +
        '<div class="modal-foot">' +
          '<button type="button" class="mbtn ghost" data-cf="cancel">取消</button>' +
          '<button type="button" class="mbtn ghost" data-cf="no">不保存</button>' +
          '<button type="button" class="mbtn" data-cf="yes">保存并关闭</button>' +
        '</div>' +
      '</div>';

    var done = false;
    function finish(v) {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey, true);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      resolve(v);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        finish('cancel');
      }
    }

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cf]');
      if (btn) finish(btn.getAttribute('data-cf'));
    });

    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(wrap);
  });
}

async function saveDocToDisk() {
  var doc;
  try { doc = serializeDoc(); }
  catch (e) {
    toast('生成文件失败：' + (e && e.message ? e.message : e));
    return false;
  }

  var text = JSON.stringify(doc);
  var filename = '白板工程_' +
    new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';

  var T = window.__TAURI__;
  var dlg   = T && T.dialog;
  var fsApi = T && T.fs;
  if (dlg && typeof dlg.save === 'function' &&
      fsApi && typeof fsApi.writeTextFile === 'function') {
    try {
      var path = await dlg.save({
        defaultPath: filename,
        filters: [{ name: '白板工程文件', extensions: ['json'] }]
      });
      if (!path) return false;
      await fsApi.writeTextFile(path, text);
      toast('已保存到：' + path, 3600);
      return true;
    } catch (e) {
      console.warn('原生保存失败，改用浏览器方式：', e);
    }
  }

  try {
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var r = await saveImageBlob(blob, filename);
    toast('已导出到：' + r.location, 3600);
    return true;
  } catch (e) {
    toast('保存失败：' + (e && e.message ? e.message : e), 3600);
    return false;
  }
}

async function setupWindowControls() {
  /* 先解绑 license.js 在激活前绑定的简单监听，避免点击触发两次 */
  try {
    if (window.__pbLicense && typeof window.__pbLicense.cleanupEarlyWindowControls === 'function') {
      window.__pbLicense.cleanupEarlyWindowControls();
    }
  } catch (e) {}
  const T = window.__TAURI__;
  const internals = window.__TAURI_INTERNALS__;

  const minBtn   = document.getElementById('minimizeBtn');
  const closeBtn = document.getElementById('closeAppBtn');
  if (!minBtn || !closeBtn) return;

  if (!T && !internals) return;

  minBtn.style.display = '';
  closeBtn.style.display = '';

  let appWindow = null;

  if (T && T.window) {
    if (typeof T.window.getCurrentWindow === 'function') {
      appWindow = T.window.getCurrentWindow();
    } else if (T.window.getCurrent) {
      appWindow = T.window.getCurrent();
    } else if (T.window.appWindow) {
      appWindow = T.window.appWindow;
    }
  }
  if (!appWindow && T && T.appWindow) appWindow = T.appWindow;

  if (!appWindow && internals && typeof internals.invoke === 'function') {
    const label =
      (internals.metadata &&
       internals.metadata.currentWindow &&
       internals.metadata.currentWindow.label) || 'main';
    appWindow = {
      minimize: () => internals.invoke('plugin:window|minimize', { label }),
      close:    () => internals.invoke('plugin:window|close',    { label })
    };
  }

  if (!appWindow) {
    console.warn('[窗口控制] 未找到可用的 Tauri 窗口 API');
    return;
  }

  minBtn.addEventListener('click', async () => {
    try { await appWindow.minimize(); }
    catch (e) { console.warn('最小化失败', e); }
  });

  closeBtn.addEventListener('click', async () => {
    const choice = await askSaveBeforeClose();
    if (choice === 'cancel') return;

    if (choice === 'yes') {
      const ok = await saveDocToDisk();
      if (!ok) return;
      await new Promise(r => setTimeout(r, 500));
    }

    try {
      const records = [];
      for (const k in PB.shapes) {
        const s = PB.shapes[k];
        if (s.custom && s.parts) {
          records.push({
            id: k,
            label: s.label,
            catId: s.cat,
            catLabel: (PB.categories || []).find(c => c.id === s.cat)?.label || s.cat,
            baseW: s.baseW,
            baseH: s.baseH,
            parts: s.parts,
            icon: s.icon
          });
        }
      }
      for (const rec of records) await csSaveRecord(rec);
    } catch (e) {}

    try { await appWindow.close(); }
    catch (e) { window.close(); }
  });
}

function askUpgrade(localVer, cloudVer) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'modal show';
    wrap.style.zIndex = '9999';
    wrap.innerHTML =
      '<div class="modal-card" style="max-width:420px;">' +
        '<div class="modal-head">发现新版图形库</div>' +
        '<div class="modal-body">' +
          '<p style="font-size:13px;color:#b8c7de;">' +
            '本地版本：<b>' + (localVer || '未知') + '</b><br>' +
            '云端版本：<b>' + cloudVer + '</b>' +
          '</p>' +
          '<div class="tip-line">升级会覆盖本地 shapes.js，下次启动生效。</div>' +
        '</div>' +
        '<div class="modal-foot">' +
          '<button class="mbtn ghost" data-ans="no">暂不升级</button>' +
          '<button class="mbtn" data-ans="yes">立即升级</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    let done = false;
    function finish(v) {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey, true);
      wrap.remove();
      resolve(v);
    }
    function onKey(ev) {
      if (ev.key !== 'Escape') return;
      finish(false);
    }

    wrap.addEventListener('click', e => {
      const btn = e.target.closest('[data-ans]');
      if (!btn) return;
      finish(btn.dataset.ans === 'yes');
    });

    document.addEventListener('keydown', onKey, true);
  });
}

function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms || 3000);
  return fetch(url, Object.assign({}, opts, { signal: ctrl.signal }))
    .finally(() => clearTimeout(timer));
}
/* ---- 本地 shapes.js 选择器（云端不可用时的兜底） ---- */
function askUserForShapesFile() {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'modal show';
    wrap.style.zIndex = '99999';
    wrap.innerHTML =
      '<div class="modal-card" style="max-width:470px;">' +
        '<div class="modal-head">图形库缺失</div>' +
        '<div class="modal-body">' +
          '<p style="font-size:13px;color:#b8c7de;">' +
            '本机没有 <b>shapes.js</b> 图形库文件，且当前无法连接云端服务器下载。' +
          '</p>' +
          '<div class="tip-line" style="margin-top:10px;">' +
            '可选择一个电脑上已有的 <b>shapes.js</b> 文件导入，' +
            '程序会把它保存到程序目录，下次启动不再需要选择。' +
          '</div>' +
          '<input type="file" accept=".js,application/javascript" ' +
            'id="__pbShapesFileInput" style="display:none;">' +
        '</div>' +
        '<div class="modal-foot">' +
          '<button class="mbtn ghost" data-ans="cancel">暂不导入</button>' +
          '<button class="mbtn" data-ans="pick">选择 shapes.js 文件</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    const input = wrap.querySelector('#__pbShapesFileInput');
    let done = false;
    function finish(code) {
      if (done) return;
      done = true;
      wrap.remove();
      resolve(code || null);
    }

    input.addEventListener('change', async () => {
      const f = input.files && input.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        if (!text || text.length < 100) {
          alert('文件内容过短，可能不是有效的 shapes.js');
          return;
        }
        if (text.indexOf('PhysBoard') < 0) {
          if (!confirm('文件中没有发现 PhysBoard 相关代码，确定继续吗？')) return;
        }
        finish(text);
      } catch (e) {
        alert('读取文件失败：' + (e && e.message ? e.message : e));
      }
    });

    wrap.addEventListener('click', e => {
      const btn = e.target.closest('[data-ans]');
      if (!btn) return;
      if (btn.dataset.ans === 'cancel') finish(null);
      if (btn.dataset.ans === 'pick') input.click();
    });
  });
}

/* ---- 主加载逻辑 ---- */
async function ensureShapesReady() {
  const fs = window.__pbFS || {
    readFile: async n => localStorage.getItem('__pb_' + n),
    writeFile: async (n, v) => localStorage.setItem('__pb_' + n, v)
  };
  const API = window.__pbLicense.API_BASE;
  const token = window.__pbLicense.getToken();

  let localCode = await fs.readFile('shapes.js');
  const localMeta = await fs.readFile('shapes.meta.json');
  let localVer = '';
  try { localVer = localMeta ? (JSON.parse(localMeta).version || '') : ''; } catch (e) {}

  /* ---------- 本地没有 shapes.js：三级兜底 ---------- */
  if (!localCode) {
    /* ① 先看本地备份 */
    try {
      const bak = await fs.readFile('shapes.js.bak');
      if (bak && bak.length > 100) {
        console.warn('[shapes] 使用本地备份 shapes.js.bak');
        await fs.writeFile('shapes.js', bak);
        localCode = bak;
      }
    } catch (e) {}

    /* ② 云端下载 */
    if (!localCode) {
      const res = await fetchWithTimeout(API + '/api/shapes', {
        headers: { 'Authorization': 'Bearer ' + token }
      }, 15000).catch(() => null);

      if (res && res.ok) {
        const code = await res.text();
        let cloudVer = '';
        const vRes = await fetch(API + '/api/shapes/version').catch(() => null);
        if (vRes && vRes.ok) {
          const vd = await vRes.json().catch(() => ({}));
          cloudVer = vd.version || '';
        }
        await fs.writeFile('shapes.js', code);
        await fs.writeFile('shapes.meta.json',
          JSON.stringify({ version: cloudVer, downloadedAt: Date.now() }, null, 2));
        localCode = code;
        localVer = cloudVer;
      } else {
        /* ③ 云端不可用 → 让用户手动选择本地文件 */
        console.warn('[shapes] 云端不可用，请用户提供本地 shapes.js');
        const picked = await askUserForShapesFile();
        if (!picked) {
          throw new Error('图形库缺失：云端不可用，且用户未提供本地文件');
        }
        await fs.writeFile('shapes.js', picked);
        try { await fs.writeFile('shapes.js.bak', picked); } catch (e) {}
        localCode = picked;
      }
    }
  }

  /* ---------- 执行 ---------- */
  execShapesCode(localCode);

  /* ---------- 在线时检查更新（离线时静默跳过） ---------- */
  try {
    const vRes = await fetchWithTimeout(API + '/api/shapes/version', {}, 3000).catch(() => null);
    if (!vRes || !vRes.ok) return;
    const vd = await vRes.json();
    const cloudVer = vd.version || '';
    if (!cloudVer || cloudVer === localVer) return;

    const ok = await askUpgrade(localVer, cloudVer);
    if (!ok) return;

    const res = await fetchWithTimeout(API + '/api/shapes', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, 15000).catch(() => null);
    if (!res || !res.ok) return;
    const newCode = await res.text();
    try { await fs.writeFile('shapes.js.bak', localCode); } catch (e) {}
    await fs.writeFile('shapes.js', newCode);
    await fs.writeFile('shapes.meta.json',
      JSON.stringify({ version: cloudVer, downloadedAt: Date.now() }, null, 2));
    toast('图形库已更新，下次启动生效。', 3600);
  } catch (e) {
    /* 离线时静默忽略 */
  }
}


function execShapesCode(code) {
  const s = document.createElement('script');
  s.textContent = code;
  document.head.appendChild(s);
  if (!window.PhysBoard || !window.PhysBoard.shapes || !Object.keys(window.PhysBoard.shapes).length) {
    throw new Error('图形库执行异常');
  }
}

/* =====================================================================
 * 27. 启动
 * ===================================================================== */
async function init() {
  await setupWindowControls();

  // 【修补】加一层隐藏的检查
  let licensed = false;
  try {
    // 检查对象是否被篡改（比如被替换成了普通对象，而不是经过 Object.defineProperty 定义的）
    const desc = Object.getOwnPropertyDescriptor(window, '__pbLicense');
    if (desc && !desc.writable && window.__pbLicense && typeof window.__pbLicense.ensureActivated === 'function') {
      licensed = await window.__pbLicense.ensureActivated();
    }
  } catch (e) {
    console.error(e);
  }

  if (!licensed) {
    // 故意给一个看起来像网络错误的提示，忽悠试图破解的人
    document.body.innerHTML = '<div style="color:#fff;margin:100px;">系统初始化失败，请检查网络或联系管理员（错误代码: 0x80070005）</div>';
    return;
  }

  try {
    await ensureShapesReady();
  } catch (e) {
    document.body.innerHTML =
      '<div style="max-width:540px;margin:100px auto;padding:30px 34px;' +
      'background:linear-gradient(160deg,rgba(24,36,60,.98),rgba(14,22,40,.98));' +
      'border:1px solid rgba(120,180,255,.25);border-radius:20px;' +
      'color:#fca5a5;font-family:system-ui,sans-serif;line-height:1.85;">' +
      '<b style="color:#fff;font-size:17px;">无法加载图形库</b><br><br>' +
      '<span style="color:#b8c7de;">' + (e.message || '请检查网络连接') + '</span></div>';
    return;
  }

  installFreehandShape();
  installImageShape();
  installVideoShape();

// ---- 恢复上次使用的背景 ----
// 处理 "custom 但自定义数据已丢失" 的情况：回退到深色背景，避免看起来像被清空
let savedBg = 'transparent';
try { savedBg = localStorage.getItem('pb_bg_id') || 'transparent'; } catch (e) {}
if (savedBg === 'custom' && !loadCustomBgPreset()) {
  console.warn('[init] 自定义背景数据丢失，回退到 tech');
  savedBg = 'tech';
}
const restoredPreset = findBgPreset(savedBg);
state.bg = restoredPreset.id;

        const applyRestoredBg = function () {
          if (state.bg === 'transparent') {
            document.body.style.background = 'transparent';
          } else {
            document.body.style.background = restoredPreset.css;
          }
          document.body.classList.toggle('pb-light', !!restoredPreset.light);
        };
        applyRestoredBg();

        if (state.bg === 'transparent') {
          state.borderColor = '#ff0000'; state.penColor = '#ff0000';
        } else if (restoredPreset.light) {
          state.borderColor = '#1a1a1a'; state.penColor = '#1a1a1a';
        } else {
          state.borderColor = '#e6edf7'; state.penColor = '#e6edf7';
        }

        await preloadBgImage();
  ensureTextShapes();
  registerTextParams();

await csRestoreAll();
await loadSelfShapesOnStartup();
collectOriginalHidden();
applyLibHidden();

  buildPenPanel(); buildBorderPanel(); buildFillPanel(); buildBgRow(); buildShapePanel();setupCustomBgUI();
  makeTouchScrollable(shapeGrid);
  makeTouchScrollable(thumbScroll);
  makeTouchScrollable(libList);
  updateSaveDirUI();

  loadSnapSettings();

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  document.querySelectorAll('.dbtn[data-tool]').forEach(b => {
    const tool = b.dataset.tool;
    if (tool === 'pen') {
      b.addEventListener('click', () => {
        if (state.tool === 'pen') penPanel.classList.toggle('show');
        else setTool('pen', true);
      });
    } else if (tool === 'eraser') {
      b.addEventListener('click', () => setTool('eraser'));
      b.addEventListener('dblclick', e => { e.preventDefault(); setTool('eraser'); showEraseSlider(); });
    } else {
      b.addEventListener('click', () => setTool(tool));
    }
  });
  document.getElementById('shapeBtn').addEventListener('click', () => {
    if (shapePanel.classList.contains('show')) {
      shapePanel.classList.remove('show');
      document.getElementById('shapeBtn').classList.remove('active');
    } else {
      const cats = getCategories().filter(c => catHasShapes(c.id));
      if (!state.shapeCat && cats.length) state.shapeCat = cats[0].id;
      let first = null;
      for (const k in PB.shapes) {
        const s = PB.shapes[k];
        if (!s.hidden && s.cat === state.shapeCat) { first = k; break; }
      }
      if (first) setTool(first);
      else {
        shapePanel.classList.add('show');
        document.getElementById('shapeBtn').classList.add('active');
        penPanel.classList.remove('show');
      }
    }
  });
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  playAllBtn.addEventListener('click', playAnimAll);
  pauseAllBtn.addEventListener('click', pauseAnimAll);
  resetAllBtn.addEventListener('click', resetAnimAll);
  document.getElementById('prevPage').addEventListener('click', () => goPage(pageIndex - 1));
  document.getElementById('nextPage').addEventListener('click', () => goPage(pageIndex + 1));
  document.getElementById('addPage').addEventListener('click', addPage);
  document.getElementById('delPage').addEventListener('click', () => deletePage(pageIndex));

  board.addEventListener('contextmenu', e => e.preventDefault());
  preview.addEventListener('contextmenu', e => e.preventDefault());

  resize();

  snapshots = [{ pages: pages.map(pg => pg.map(copyObj)), pageIndex: 0 }];
  snapIndex = 0;
  updateHistoryButtons();
  updatePageUI();
  updatePlayButtons();
  registerAnimParams();

setTool('pen', true);
  syncEmbeddedEditorsTheme();
// ★ 修复：Tauri WebView 在 init 早期设置 body.style.background 后，
// 可能会因 DOM 重绘、canvas 尺寸变化等丢失样式；用 requestAnimationFrame
// 在下一帧再应用一次，确保背景稳定生效。
requestAnimationFrame(function () {
  applyRestoredBg();
});

setTimeout(() => toast('已进入画笔状态 · 菜单里可导入图片 / 视频', 600), 400);
}
/* =====================================================================
 * 26.6 公式抽屉 · 自定义数据文件读写路由
 *     latex-formula-editor（iframe）通过 postMessage 请求读写
 *     custom-formulas.json（与 shapes.js 同目录）
 * ===================================================================== */
(function setupCustomFormulaFSBridge() {
  window.addEventListener('message', async (e) => {
    const data = e.data;
    if (!data || !data.id) return;
    if (data.type !== 'pb:read-custom-formulas' &&
        data.type !== 'pb:write-custom-formulas') return;

    const reply = (msg) => {
      try { if (e.source) e.source.postMessage(msg, '*'); } catch (err) {}
    };

    try {
      const fs = window.__pbFS || {
        readFile:  async n => localStorage.getItem('__pb_' + n),
        writeFile: async (n, v) => localStorage.setItem('__pb_' + n, v)
      };

      if (data.type === 'pb:read-custom-formulas') {
        const text = await fs.readFile('custom-formulas.json');
        reply({ id: data.id, result: text || '' });
      } else {
        const text = (data.data && data.data.text) || '';
        await fs.writeFile('custom-formulas.json', text);
        reply({ id: data.id, result: true });
      }
    } catch (err) {
      reply({
        id: data.id,
        error: String(err && err.message ? err.message : err)
      });
    }
  });
})();
window.__pbRedraw = function () {
  render();
  drawPreview();
  updateSelBarPosition();
};

/* ★ 新增：给窗口管理模块（index.html 里的 __pbWindow）调用 */
window.PhysBoard = window.PhysBoard || {};
window.PhysBoard.setTool = setTool;              // 允许外部切工具
window.PhysBoard.getCurrentTool = function () {  // 允许外部查当前工具
  return state.tool;
};
window.PhysBoard.getSelection = function () { return selection; };   // ★ 新增
init();

})();