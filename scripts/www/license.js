/* ============================================================================
 *  PhysBoard 授权模块 license.js
 *  配合 Cloudflare Workers + KV 授权服务使用
 *  必须在 app.js 之前加载
 * ============================================================================ */
(function () {
'use strict';

/* ===== 1. 配置 ===== */
const API_BASE = 'https://api.tangzhanglao123.cn';
const AUTH_FILE  = 'auth.json';
const TOKEN_DAYS = 29;

/* ===== 2. Tauri 环境下的文件读写（exe 同级目录） ===== */
const T = () => window.__TAURI__;

/* ===== 2. Tauri 环境下的文件读写（exe 同级目录） ===== */

/* ===== 2. Tauri 环境下的文件读写（exe 同级目录） ===== */

let __appDirCache = null;       // null = 未解析；'' = 浏览器环境；string = 已解析路径
let __appDirPromise = null;     // 并发保护：多个调用同时到达时只解析一次
let __isBrowserEnv = null;      // null = 未判断；true/false = 已判断

async function getAppDir() {
  /* ---------- ① 已缓存有效路径 → 直接返回 ---------- */
  if (__appDirCache !== null) return __appDirCache;

  /* ---------- ② 已有解析进行中 → 复用同一个 Promise ---------- */
  if (__appDirPromise) return __appDirPromise;

  /* ---------- ③ 开始解析 ---------- */
  __appDirPromise = (async () => {
    const t = window.__TAURI__;

    /* ===== 浏览器环境：直接返回空字符串并缓存，永不再试 ===== */
    if (!t || !t.path) {
      __isBrowserEnv = true;
      __appDirCache = '';
      return __appDirCache;
    }
    __isBrowserEnv = false;

    /* ========== 方案 A：resolveResource('../') ==========
     * Tauri 标准做法，资源目录的上级 = exe 所在目录 */
    try {
      if (typeof t.path.resolveResource === 'function') {
        const res = await t.path.resolveResource('../');
        if (res && typeof res === 'string') {
          const dir = await t.path.dirname(res);
          if (dir) {
            __appDirCache = dir;
            return dir;
          }
        }
      }
    } catch (e) {
      console.warn('[getAppDir] 方案 A (resolveResource) 失败：', e);
    }

    /* ========== 方案 B：executableDir() ==========
     * 部分 Tauri / PakePlus 版本直接提供 exe 目录 */
    try {
      if (typeof t.path.executableDir === 'function') {
        const dir = await t.path.executableDir();
        if (dir && typeof dir === 'string') {
          __appDirCache = dir;
          return dir;
        }
      }
    } catch (e) {
      console.warn('[getAppDir] 方案 B (executableDir) 失败：', e);
    }

    /* ========== 方案 C：resourceDir() ==========
     * 资源目录本身就是 exe 同级时可用 */
    try {
      if (typeof t.path.resourceDir === 'function') {
        const dir = await t.path.resourceDir();
        if (dir && typeof dir === 'string') {
          __appDirCache = dir;
          return dir;
        }
      }
    } catch (e) {
      console.warn('[getAppDir] 方案 C (resourceDir) 失败：', e);
    }

    /* ========== 方案 D：appDataDir() ==========
     * 兜底方案，数据放在 %APPDATA%\你的app\ 目录 */
    try {
      if (typeof t.path.appDataDir === 'function') {
        const dir = await t.path.appDataDir();
        if (dir && typeof dir === 'string') {
          __appDirCache = dir;
          return dir;
        }
      }
    } catch (e) {
      console.warn('[getAppDir] 方案 D (appDataDir) 失败：', e);
    }

    /* ========== 全部失败 ==========
     * 不缓存结果，下次调用会重新尝试（比如用户中途改了权限） */
    console.error('[getAppDir] 所有路径策略均失败，下次调用会重新尝试');
    return '';
  })();

  try {
    return await __appDirPromise;
  } finally {
    __appDirPromise = null;   // 无论成功失败都清空，避免后续调用拿到过期的 Promise
  }
}


async function readFile(name) {
  const t = T();

  /* ---------- ① 优先走 Tauri 文件系统 ---------- */
  if (t && t.fs && t.path) {
    try {
      const dir = await getAppDir();
      if (dir && dir !== '') {
        const p = await t.path.join(dir, name);
        const content = await t.fs.readTextFile(p);
        if (content != null) return content;
      }
    } catch (e) {
      /* 文件不存在或路径无效，静默回退（不打印 warn，避免刷屏） */
    }
  }

  /* ---------- ② 浏览器环境 / Tauri 读取失败时走 localStorage 兜底 ---------- */
  try {
    return localStorage.getItem('__pb_' + name);
  } catch (e) {
    return null;
  }
}


async function writeFile(name, content) {
  const t = T();

  /* ---------- ① 优先走 Tauri 文件系统 ---------- */
  if (t && t.fs && t.path) {
    try {
      const dir = await getAppDir();

      /* dir 为空字符串说明 getAppDir 没解析出来（比如权限没配好），
       * 直接走 localStorage 兜底，不再尝试写文件 */
      if (dir === '' || dir === null || dir === undefined) {
        throw new Error('getAppDir 未返回有效目录');
      }

      const p = await t.path.join(dir, name);
      await t.fs.writeTextFile(p, content);
      return;               /* ✅ 写入成功，直接结束 */
    } catch (e) {
      console.warn('[writeFile] Tauri 文件写入失败，回退到 localStorage：', name, e);
      /* 不 return，继续往下走 localStorage 兜底 */
    }
  }

  /* ---------- ② 浏览器环境 / 文件写入失败时的兜底 ---------- */
  try {
    localStorage.setItem('__pb_' + name, content);
  } catch (e) {
    console.warn('[writeFile] localStorage 写入也失败了：', name, e);
  }
}
/* ===== 3. auth.json 读写 ===== */
let __auth = null;

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

async function readAuth() {
  const text = await readFile(AUTH_FILE);
  if (!text) return null;
  try { return JSON.parse(text); } catch (e) { return null; }
}
async function writeAuth(a) {
  await writeFile(AUTH_FILE, JSON.stringify(a, null, 2));
}

/* ===== 4. 网络请求 ===== */
/* 带超时的 fetch —— 超时后自动 abort，抛 AbortError */
async function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms || 3000);
  try {
    return await fetch(url, Object.assign({}, opts, { signal: ctrl.signal }));
  } finally {
    clearTimeout(timer);
  }
}

async function postJSON(path, body) {
  const res = await fetchWithTimeout(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, 10000);                        /* 激活接口超时 10 秒 */
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function getJSON(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetchWithTimeout(API_BASE + path, { headers }, 5000); /* 验证接口超时 5 秒 */
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/* ===== 5. 核心流程：确保已激活 ===== */
/* 全局保存本次会话的授权详情 */
let __licenseInfo = {
  code: '',
  expiresAt: null,       // null = 永久
  daysLeft: null,        // null = 永久
  maxDevices: 5,
  boundCount: 0
};

async function ensureActivated() {
  let auth = await readAuth();

  // 第一次启动：生成 deviceId 并落盘
  if (!auth) {
    auth = { deviceId: uuid(), code: '', token: '', tokenExpiresAt: 0, activatedAt: 0 };
    await writeAuth(auth);
  }

  // 有 token 且未过期 → 远端验证
  if (auth.token && auth.tokenExpiresAt > Date.now()) {
    const r = await getJSON('/api/verify', auth.token).catch(() => null);
    if (r && r.ok) {
      __auth = auth;
      __licenseInfo = {
        code: r.data.code || auth.code || '',
        expiresAt: r.data.expiresAt || null,
        daysLeft: r.data.daysLeft != null ? r.data.daysLeft : null,
        maxDevices: r.data.maxDevices || 5,
        boundCount: r.data.boundCount || 0
      };
      return true;
    }
    // token 失效 → 走续期
  }

  // 有 code → 用 deviceId 静默续期（不消耗设备名额）
  if (auth.code) {
    try {
      const r = await postJSON('/api/activate', { code: auth.code, deviceId: auth.deviceId });
      if (r.ok && r.data.token) {
        auth.token = r.data.token;
        auth.tokenExpiresAt = Date.now() + TOKEN_DAYS * 24 * 3600 * 1000;
        await writeAuth(auth);
        __auth = auth;
        __licenseInfo = {
          code: r.data.code || auth.code || '',
          expiresAt: r.data.expiresAt || null,
          daysLeft: r.data.daysLeft != null ? r.data.daysLeft : null,
          maxDevices: r.data.maxDevices || 5,
          boundCount: r.data.boundCount || 0
        };
        return true;
      }
    } catch (e) {}
  }

  // 都失败 → 弹激活界面
  const activated = await showActivationUI();
  return activated;
}

/* 供 app.js 读取授权详情 */
function getLicenseInfo() {
  return __licenseInfo;
}


function getToken()    { return __auth ? __auth.token    : ''; }
function getDeviceId() { return __auth ? __auth.deviceId : ''; }

/* ===== 6. 激活界面 ===== */
function injectStyles() {
  if (document.getElementById('pbLicStyle')) return;
  const s = document.createElement('style');
  s.id = 'pbLicStyle';
  s.textContent = `
    .pblic-mask{position:fixed;inset:0;z-index:99999;background:rgba(4,10,22,.88);
      backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      display:flex;align-items:center;justify-content:center;
      font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
      color:#e6edf7;padding:20px;}
    .pblic-card{width:100%;max-width:460px;padding:32px 28px 24px;
      background:linear-gradient(160deg,rgba(24,36,60,.98),rgba(14,22,40,.98));
      border:1px solid rgba(120,180,255,.28);border-radius:20px;
      box-shadow:0 30px 80px rgba(0,8,24,.7),0 0 60px rgba(56,189,248,.12);}
    .pblic-title{font-size:19px;font-weight:600;margin:0 0 14px;
      display:flex;align-items:center;gap:10px;}
    .pblic-title::before{content:'';width:4px;height:18px;border-radius:2px;
      background:linear-gradient(180deg,#38bdf8,#818cf8);
      box-shadow:0 0 12px rgba(56,189,248,.5);}
    .pblic-msg{font-size:13.5px;color:#8fa3c0;line-height:1.7;margin:0 0 22px;}
    .pblic-card input{width:100%;height:52px;padding:0 14px;
      background:rgba(8,16,32,.6);border:1px solid rgba(120,180,255,.22);
      border-radius:12px;color:#e6edf7;outline:none;
      font-family:ui-monospace,Menlo,Consolas,monospace;
      font-size:17px;letter-spacing:1.5px;
      transition:border-color .15s,box-shadow .15s;}
    .pblic-card input:focus{border-color:#38bdf8;
      box-shadow:0 0 0 3px rgba(56,189,248,.13);}
    .pblic-card input::placeholder{color:#5b6b84;}
    .pblic-status{min-height:20px;font-size:12.5px;margin:10px 0 6px;
      letter-spacing:.3px;color:#8fa3c0;}
    .pblic-status.bad{color:#fca5a5;}
    .pblic-status.ok{color:#4ade80;}
    .pblic-btn{width:100%;height:52px;margin-top:10px;
      background:linear-gradient(135deg,#38bdf8,#818cf8);color:#fff;
      border:none;border-radius:12px;font-size:15px;font-weight:600;
      letter-spacing:1px;font-family:inherit;cursor:pointer;
      box-shadow:0 6px 20px rgba(56,189,248,.35);transition:.15s;}
    .pblic-btn:hover{filter:brightness(1.1);}
    .pblic-btn:active{transform:scale(.98);}
    .pblic-btn:disabled{opacity:.5;cursor:default;filter:none;}
    .pblic-foot{margin-top:22px;padding-top:18px;
      border-top:1px solid rgba(120,180,255,.12);
      font-size:12px;color:#6b7c96;line-height:1.9;text-align:center;}
  `;
  document.head.appendChild(s);
}

let __activationPromise = null;

function showActivationUI(message) {
  /* 已有 Promise → 直接返回，不重复弹 */
  if (__activationPromise) return __activationPromise;

  /* 界面上已有激活弹窗 → 同步返回 false，不再创建新 Promise */
  if (document.getElementById('pbLicMask')) {
    return Promise.resolve(false);
  }

  __activationPromise = new Promise(resolve => {
    injectStyles();

    const mask = document.createElement('div');
    mask.id = 'pbLicMask';
    mask.className = 'pblic-mask';
    mask.innerHTML = `
      <div class="pblic-card">
        <div class="pblic-title">软件未激活（Alt+Tab退出、Alt+F4关闭）</div>
        <div class="pblic-msg">${message || '请输入激活码完成授权。每个激活码可绑定多台设备，绑定后无需重复输入。'}</div>
        <input id="pbLicInput" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false">
        <div class="pblic-status" id="pbLicStatus"></div>
        <button class="pblic-btn" id="pbLicBtn">激 活</button>
        <div class="pblic-foot">
          作者：唐龙 · 公众号：Mli随笔 · B站/抖音：教物理的唐长老
        </div>
      </div>`;
    document.body.appendChild(mask);

    const input = document.getElementById('pbLicInput');
    const btn   = document.getElementById('pbLicBtn');
    const st    = document.getElementById('pbLicStatus');

    input.addEventListener('input', () => {
      const v = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16);
      input.value = v.replace(/(.{4})(?=.)/g, '$1-');
    });

    async function activate() {
      const code = input.value.trim().toUpperCase();
      if (code.replace(/-/g, '').length !== 16) {
        st.className = 'pblic-status bad';
        st.textContent = '请输入完整的 16 位激活码';
        return;
      }
      btn.disabled = true;
      btn.textContent = '验证中…';
      st.className = 'pblic-status';
      st.textContent = '';

      let auth = await readAuth();
      if (!auth) {
        auth = { deviceId: uuid(), code: '', token: '', tokenExpiresAt: 0, activatedAt: 0 };
      }

      try {
        const r = await postJSON('/api/activate', { code, deviceId: auth.deviceId });
        if (!r.ok) {
          st.className = 'pblic-status bad';
          st.textContent = r.data.error || '激活失败，请检查激活码';
          btn.disabled = false;
          btn.textContent = '激 活';
          return;
        }
        auth.code = code;
        auth.token = r.data.token;
        auth.tokenExpiresAt = Date.now() + TOKEN_DAYS * 24 * 3600 * 1000;
        auth.activatedAt = Date.now();
        await writeAuth(auth);
        __auth = auth;
/* ★ 新增：保存授权详情 */
__licenseInfo = {
  code: r.data.code || code,
  expiresAt: r.data.expiresAt || null,
  daysLeft: r.data.daysLeft != null ? r.data.daysLeft : null,
  maxDevices: r.data.maxDevices || 5,
  boundCount: r.data.boundCount || 0
};
        st.className = 'pblic-status ok';
st.textContent = '激活成功 · 本码剩余 ' +
  ((r.data.maxDevices || 5) - (r.data.boundCount || 1)) + ' 台设备名额';
setTimeout(() => {
          mask.remove();
          __activationPromise = null;   // 允许下次重新弹窗
          resolve(true);
        }, 900);
      } catch (e) {
        st.className = 'pblic-status bad';
        st.textContent = '网络错误：' + (e.message || '请检查网络连接');
        btn.disabled = false;
        btn.textContent = '激 活';
      }
    }

    btn.addEventListener('click', activate);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') activate(); });
    setTimeout(() => input.focus(), 100);
  });

  return __activationPromise;
}
/* ===== 7. 对外接口 ===== */
window.__pbLicense = {
  API_BASE,
  ensureActivated,
  getToken,
  getDeviceId,
  getLicenseInfo,        // ★ 新增
  check: async () => !!(await readAuth()),
  showActivationUI: (msg) => showActivationUI(msg)
};

/* 把文件读写暴露给 app.js 复用 */
window.__pbFS = {
  getAppDir,     // ← 关键：暴露给 app.js
  readFile,
  writeFile
};

})();