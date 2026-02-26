async function loadJson(path) {
  const cacheBuster = path.includes("?") ? "&" : "?";
  const res = await fetch(`${path}${cacheBuster}t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function norm(s) {
  return String(s || "").trim().replace(/^@/, "").toLowerCase();
}

function unique(arr) {
  return [...new Set(arr)];
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sortUsernames(arr, order, followedAtByUsername = {}) {
  const sorted = [...arr];

  if (order === "latest" || order === "earliest") {
    sorted.sort((a, b) => {
      const ta = followedAtByUsername[a] || 0;
      const tb = followedAtByUsername[b] || 0;
      if (ta === tb) return a.localeCompare(b);
      return order === "latest" ? tb - ta : ta - tb;
    });
    return sorted;
  }

  sorted.sort((a, b) => a.localeCompare(b));
  return order === "za" ? sorted.reverse() : sorted;
}

const USERNAME_RE = /^[a-z0-9._]{1,30}$/;
const STORAGE_KEY_UNFOLLOWED = "ig_unfollowed_usernames_v1";
const STORAGE_KEY_TBD = "ig_tbd_usernames_v1";
const STORAGE_KEY_PNF = "ig_page_not_found_usernames_v1";
const STORAGE_KEY_VISITED = "ig_visited_usernames_v1";
const STORAGE_KEY_PINNED = "ig_pinned_pending_usernames_v1";
const STORAGE_KEY_THEME = "ig_theme_v1";
const STORAGE_KEY_UNFOLLOW_EVENTS = "ig_unfollow_events_v1";
const STORAGE_KEY_SAFETY_MODE = "ig_safety_mode_v1";
const STORAGE_KEY_STRICT_COOLDOWN_UNTIL = "ig_strict_cooldown_until_v1";

const LIMIT_90_MIN = 10;
const LIMIT_24_HOUR = 60;
const WINDOW_90_MIN_MS = 90 * 60 * 1000;
const WINDOW_24_HOUR_MS = 24 * 60 * 60 * 1000;
const SEARCH_DEBOUNCE_MS = 180;
const SEARCH_SKELETON_MIN_MS = 650;
const SEARCH_SKELETON_ROWS = 7;
let safetyTickerId = null;
let searchDebounceTimer = null;

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

function loadUnfollowEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNFOLLOW_EVENTS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0)
      : [];
  } catch {
    return [];
  }
}

function saveUnfollowEvents(events) {
  localStorage.setItem(STORAGE_KEY_UNFOLLOW_EVENTS, JSON.stringify(events));
}

function loadSafetyMode() {
  const saved = localStorage.getItem(STORAGE_KEY_SAFETY_MODE);
  return saved === "risk" ? "risk" : "strict";
}

function saveSafetyMode(mode) {
  localStorage.setItem(STORAGE_KEY_SAFETY_MODE, mode);
}

function loadStrictCooldownUntil() {
  const raw = Number(localStorage.getItem(STORAGE_KEY_STRICT_COOLDOWN_UNTIL) || 0);
  return Number.isFinite(raw) ? raw : 0;
}

function saveStrictCooldownUntil(ts) {
  localStorage.setItem(STORAGE_KEY_STRICT_COOLDOWN_UNTIL, String(ts || 0));
}

function pruneUnfollowEvents(events, now = Date.now()) {
  return events.filter((ts) => now - ts <= WINDOW_24_HOUR_MS);
}

function msToShort(ms) {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

function msToClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function getRateState(events, now = Date.now()) {
  const recent90 = events.filter((ts) => now - ts <= WINDOW_90_MIN_MS);
  const recent24 = events.filter((ts) => now - ts <= WINDOW_24_HOUR_MS);

  const can90 = recent90.length < LIMIT_90_MIN;
  const can24 = recent24.length < LIMIT_24_HOUR;

  const wait90 = can90 ? 0 : WINDOW_90_MIN_MS - (now - Math.min(...recent90));
  const wait24 = can24 ? 0 : WINDOW_24_HOUR_MS - (now - Math.min(...recent24));

  return {
    used90: recent90.length,
    used24: recent24.length,
    remaining90: Math.max(0, LIMIT_90_MIN - recent90.length),
    remaining24: Math.max(0, LIMIT_24_HOUR - recent24.length),
    canUnfollow: can90 && can24,
    wait90,
    wait24,
    waitText: !can90 ? msToShort(wait90) : !can24 ? msToShort(wait24) : ""
  };
}

function getStrictCooldownRemaining(now = Date.now()) {
  const until = loadStrictCooldownUntil();
  return Math.max(0, until - now);
}

function getSafetyStatusHtml(safetyMode, rate, cooldownRemaining) {
  if (safetyMode === "risk") return "Risk mode active";

  if (cooldownRemaining > 0) {
    const clamped = Math.max(0, Math.min(WINDOW_90_MIN_MS, cooldownRemaining));
    const ringDeg = Math.round((clamped / WINDOW_90_MIN_MS) * 360);
    return `<span class="safety-status-with-ring"><span class="status-ring" style="--ring-deg:${ringDeg}deg" aria-hidden="true"></span><span>Strict mode: <span class="status-locked-word">Locked ${msToClock(cooldownRemaining)}</span></span></span>`;
  }

  if (rate.canUnfollow) {
    return 'Strict mode: <span class="status-ready-word">Ready</span>';
  }

  const waitMs = rate.wait90 > 0 ? rate.wait90 : rate.wait24;
  return `Strict mode: <span class="status-locked-word">Locked ${msToClock(waitMs)}</span>`;
}

function stopSafetyTicker() {
  if (safetyTickerId) {
    clearInterval(safetyTickerId);
    safetyTickerId = null;
  }
}

function updateSafetyStatus(safetyMode) {
  const statusEl = document.getElementById("safety-status");
  if (!statusEl) return;

  const events = pruneUnfollowEvents(loadUnfollowEvents());
  saveUnfollowEvents(events);
  const rate = getRateState(events);
  const cooldownRemaining = getStrictCooldownRemaining();
  updateSafetyMeters(rate, safetyMode, cooldownRemaining);
  statusEl.innerHTML = getSafetyStatusHtml(safetyMode, rate, cooldownRemaining);
}

function updateSafetyMeters(rate, safetyMode = "strict", cooldownRemaining = 0) {
  const ninetyLabel = document.getElementById("limit-90-label");
  const ninetyFill = document.getElementById("limit-90-fill");
  const forceNinetyFull = safetyMode === "strict" && cooldownRemaining > 0;
  const ninetyPct = forceNinetyFull ? 100 : Math.min(100, (rate.used90 / LIMIT_90_MIN) * 100);

  if (ninetyLabel) ninetyLabel.textContent = `90 min: ${rate.used90}/${LIMIT_90_MIN}`;
  if (ninetyFill) ninetyFill.style.width = `${ninetyPct}%`;
}

function startSafetyTicker(safetyMode) {
  stopSafetyTicker();
  updateSafetyStatus(safetyMode);

  if (safetyMode === "strict") {
    safetyTickerId = setInterval(() => updateSafetyStatus(safetyMode), 1000);
  }
}

function persistSets(unfollowedSet, tbdSet, pnfSet, visitedSet, pinnedSet) {
  saveSet(STORAGE_KEY_UNFOLLOWED, unfollowedSet);
  saveSet(STORAGE_KEY_TBD, tbdSet);
  saveSet(STORAGE_KEY_PNF, pnfSet);
  saveSet(STORAGE_KEY_VISITED, visitedSet);
  saveSet(STORAGE_KEY_PINNED, pinnedSet);
}

function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  return saved === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY_THEME, theme);
}

function setThemeToggleButton(theme) {
  const button = document.getElementById("toggle-theme");
  if (!(button instanceof HTMLButtonElement)) return;

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.setAttribute("data-tip", label);
  button.innerHTML =
    theme === "dark"
      ? `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`
      : `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"></path></svg>`;
}

function setSafetyToggleButton(safetyMode) {
  const button = document.getElementById("toggle-safety");
  if (!(button instanceof HTMLButtonElement)) return;

  const locked = safetyMode === "strict";
  const label = locked ? "Safety mode ON (strict)" : "Safety mode OFF (risk)";
  button.setAttribute("aria-label", label);
  button.removeAttribute("title");
  button.setAttribute("data-tip", label);
  button.innerHTML = locked
    ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
    : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
}
function parseUsernameFromHref(href) {
  if (!href) return "";

  try {
    const url = new URL(href);
    const segments = url.pathname.split("/").filter(Boolean);
    if (!segments.length) return "";
    if (segments[0] === "_u" && segments[1]) return segments[1];
    return segments[0];
  } catch {
    const match = String(href).match(/instagram\.com\/(?:_u\/)?([^/?#]+)/i);
    return match?.[1] || "";
  }
}

function extractUsername(entry) {
  if (!entry || typeof entry !== "object") return "";

  const fromTitle = norm(entry.title);
  if (fromTitle) return fromTitle;

  const data0 = entry.string_list_data?.[0] || {};
  const fromValue = norm(data0.value);
  if (fromValue) return fromValue;

  const fromHref = norm(parseUsernameFromHref(data0.href));
  if (fromHref) return fromHref;

  return "";
}

function extractTimestamp(entry) {
  const ts = entry?.string_list_data?.[0]?.timestamp;
  const n = Number(ts);
  return Number.isFinite(n) ? n : 0;
}

function isValidUsername(username) {
  return USERNAME_RE.test(username);
}

function extractCandidateUsernames(entry) {
  const candidates = [
    norm(entry?.title),
    norm(entry?.string_list_data?.[0]?.value),
    norm(parseUsernameFromHref(entry?.string_list_data?.[0]?.href))
  ].filter((u) => u && isValidUsername(u));

  return unique(candidates);
}

function extractEntries(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

function parseUsernames(entries, label) {
  let total = 0;
  let parsed = 0;
  let invalid = 0;
  const raw = [];
  const followedAtByUsername = {};

  for (const entry of entries) {
    total += 1;
    const username = extractUsername(entry);
    if (!username) continue;

    parsed += 1;
    if (!USERNAME_RE.test(username)) {
      invalid += 1;
      continue;
    }

    raw.push(username);

    const ts = extractTimestamp(entry);
    if (!followedAtByUsername[username] || ts > followedAtByUsername[username]) {
      followedAtByUsername[username] = ts;
    }
  }

  const usernames = unique(raw);

  return {
    usernames,
    followedAtByUsername,
    stats: {
      label,
      total,
      parsed,
      invalid,
      unique: usernames.length
    }
  };
}

function listHtml(arr, type, visitedSet, strictActionLocked = false, pinnedSet = new Set()) {
  return arr
    .map((username) => {
      const encodedUser = encodeURIComponent(username);
      const id = `chk_${encodedUser}`;
      const safeUser = escapeHtml(username);
      const checked = type === "done";
      const pinned = type === "pending" && pinnedSet.has(username);

      const tbdButton =
        type === "pending"
          ? `<button class="mini-btn" data-action="to-tbd" data-username="${encodedUser}">TBD</button>`
          : "";

      const pendingButton =
        type === "tbd" || type === "pnf"
          ? `<button class="mini-btn" data-action="to-pending" data-username="${encodedUser}">Pending</button>`
          : "";

      const pnfButton =
        type === "pending" || type === "tbd"
          ? `<button class="mini-btn" data-action="to-pnf" data-username="${encodedUser}">Not found</button>`
          : "";
      const pinButton =
        type === "pending"
          ? `<button
              class="pin-toggle${pinned ? " is-pinned" : ""}"
              data-action="${pinned ? "unpin" : "pin"}"
              data-username="${encodedUser}"
              aria-label="${pinned ? "Unpin" : "Pin"} @${safeUser}"
              title="${pinned ? "Unpin" : "Pin"} @${safeUser}"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <g transform="translate(24 0) scale(-1 1) rotate(-28 12 12)">
                  <path d="M12 17v4"></path>
                  <path d="M7 3h10l-2 5 2 2v2h-4l-1 1-1-1H7v-2l2-2z"></path>
                </g>
              </svg>
            </button>`
          : "";
      const visitedClass = visitedSet.has(username) ? " visited-row" : "";
      const pinnedClass = pinned ? " pinned-row" : "";
      const disableUnfollow = strictActionLocked && type !== "done";
      const rowControl = disableUnfollow
        ? `<span class="row-lock" aria-label="Locked in strict mode" title="Locked in strict mode">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2"></rect>
              <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
            </svg>
          </span>`
        : `<input type="checkbox" id="${id}" data-username="${encodedUser}" ${checked ? "checked" : ""} />`;

      return `
        <div class="user-row${visitedClass}${pinnedClass}" data-row-username="${encodedUser}">
          ${rowControl}
          <button
            type="button"
            class="username-copy"
            data-copy-username="${encodedUser}"
            title="Copy @${safeUser}"
            aria-label="Copy @${safeUser}"
          >
            <span class="user-label">${safeUser}</span>
            <span class="copy-indicator" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </span>
          </button>
          <div class="row-tools">
            ${pinButton}
            ${pendingButton}
            ${tbdButton}
            ${pnfButton}
            <a href="https://www.instagram.com/${encodeURIComponent(username)}"
               target="_blank"
               rel="noopener noreferrer"
               data-open-username="${encodedUser}"
               class="user-link">
              Open
            </a>
          </div>
        </div>
      `;
    })
    .join("");
}

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function renderError(message) {
  const root = document.getElementById("root") || document.body;
  root.innerHTML = `
    <section class="app-shell panel" style="max-width:920px; margin: 24px auto;">
      <h1>Not Following Back Sweep</h1>
      <div class="error-box">
        <p><strong>Could not load your Instagram data.</strong></p>
        <p>${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

function renderResults({
  all,
  unfollowedSet,
  tbdSet,
  pnfSet,
  visitedSet,
  pinnedSet,
  unfollowEvents,
  followedAtByUsername,
  verifyLookups,
  safetyMode = "strict",
  query = "",
  sort = "latest",
  verifyQuery = "",
  rateNotice = "",
  diagnostics,
  showDone = false,
  showTbd = false,
  showPnf = false,
  theme = "light"
}) {
  const root = document.getElementById("root") || document.body;
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
  let activeTheme = theme;
  applyTheme(activeTheme);
  stopSafetyTicker();
  const themeLabel = activeTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  const pendingAll = all.filter((u) => !unfollowedSet.has(u) && !tbdSet.has(u) && !pnfSet.has(u));
  const tbdAll = all.filter((u) => tbdSet.has(u) && !unfollowedSet.has(u) && !pnfSet.has(u));
  const pnfAll = all.filter((u) => pnfSet.has(u) && !unfollowedSet.has(u));
  const doneAll = all.filter((u) => unfollowedSet.has(u));

  const q = norm(query);
  const byQuery = (u) => !q || u.includes(q);

  const sortedPending = sortUsernames(pendingAll.filter(byQuery), sort, followedAtByUsername);
  const pendingPinned = sortedPending.filter((u) => pinnedSet.has(u));
  const pendingUnpinned = sortedPending.filter((u) => !pinnedSet.has(u));
  const pending = [...pendingPinned, ...pendingUnpinned];
  const tbd = sortUsernames(tbdAll.filter(byQuery), sort, followedAtByUsername);
  const pnf = sortUsernames(pnfAll.filter(byQuery), sort, followedAtByUsername);
  const done = sortUsernames(doneAll.filter(byQuery), sort, followedAtByUsername);

  const flaggedSet = new Set(all);
  const rateStateRaw = getRateState(unfollowEvents);
  const strictCooldownRemaining = getStrictCooldownRemaining();
  const strictLocked = strictCooldownRemaining > 0 || !rateStateRaw.canUnfollow;
  const rateState = safetyMode === "risk"
    ? { ...rateStateRaw, canUnfollow: true, waitText: "" }
    : rateStateRaw;
  const verifyInputNorm = norm(verifyQuery);
  const verifyResultText = (() => {
    if (!verifyInputNorm) return "";
    const inFollowing = verifyLookups.following.has(verifyInputNorm);
    const inFollowers = verifyLookups.followers.has(verifyInputNorm);
    const flagged = flaggedSet.has(verifyInputNorm);

    if (!inFollowing) return `@${verifyInputNorm} is not in your following file.`;
    if (inFollowers) return `@${verifyInputNorm} appears in both files, so it should not be flagged.`;
    if (flagged) return `@${verifyInputNorm} is in following, missing from followers, and currently flagged.`;
    return `@${verifyInputNorm} is in following and missing from followers, but not currently displayed (likely moved/filtered).`;
  })();

  const dailySegmentCount = 6;
  const filledDailySegments = Math.min(dailySegmentCount, Math.floor(rateState.used24 / 10));
  const ninetyFillPct = safetyMode === "strict" && strictCooldownRemaining > 0
    ? 100
    : Math.min(100, (rateState.used90 / LIMIT_90_MIN) * 100);
  const pendingSafetyCount = safetyMode === "strict" && strictCooldownRemaining > 0
    ? LIMIT_90_MIN
    : Math.min(LIMIT_90_MIN, rateState.used90);
  const pendingSafetyDotsHtml = Array.from({ length: LIMIT_90_MIN }, (_, i) =>
    `<span class="pending-safety-dot ${i < pendingSafetyCount ? "is-filled" : ""}" style="--dot-index:${i};"></span>`
  ).join("");
  const dailySegmentsHtml = Array.from({ length: dailySegmentCount }, (_, i) =>
    `<span class="quota-segment ${i < filledDailySegments ? "filled" : ""}"></span>`
  ).join("");
  const dataLine = diagnostics
    ? `Compared ${diagnostics.followers.unique} followers vs ${diagnostics.following.unique} following.`
    : "";
  const sortLabelByValue = {
    latest: "Sort Latest",
    earliest: "Sort Earliest",
    az: "Sort A-Z",
    za: "Sort Z-A"
  };
  const currentSortLabel = sortLabelByValue[sort] || sortLabelByValue.az;

  root.innerHTML = `
    <div class="app-page">
      <section class="app-shell panel">
        <div class="title-row">
          <div class="title-action-left">
            <button id="toggle-safety" class="mini-btn theme-btn" aria-label="Safety mode"></button>
          </div>
          <h1>Not Following Back Sweep</h1>
          <div class="title-action-right">
            <button id="toggle-theme" class="mini-btn theme-btn" aria-label="${themeLabel}" title="${themeLabel}">
              <span class="theme-fallback">${activeTheme === "dark" ? "sun" : "moon"}</span>
            </button>
          </div>
        </div>

        <div class="limit-box ${safetyMode === "strict" && strictLocked ? "limit-box-warning" : ""}">
          <div class="limit-head">
            <b>Safety Limits</b>
            <span id="safety-status">${getSafetyStatusHtml(safetyMode, rateStateRaw, strictCooldownRemaining)}</span>
          </div>
          <div class="limit-row">
            <div id="limit-90-label">90 min: ${rateState.used90}/${LIMIT_90_MIN}</div>
            <div class="limit-track"><div id="limit-90-fill" class="limit-fill" style="width:${ninetyFillPct}%"></div></div>
          </div>
          <p class="meta-line safety-mode-copy">${escapeHtml(rateNotice || (safetyMode === "strict"
            ? "Strict mode locks for a full 90 minutes once you hit 10 unfollows."
            : "Risk mode removes lock enforcement. Use carefully."))}</p>
        </div>

        <div class="quota-block" aria-label="daily unfollow quota">
          <div class="quota-head">
            <b>Daily Quota Blocks</b>
            <span>${filledDailySegments}/${dailySegmentCount} blocks (${rateState.used24}/${LIMIT_24_HOUR})</span>
          </div>
          <div class="quota-row">${dailySegmentsHtml}</div>
          <p class="meta-line">Each block fills after 10 unfollows.</p>
        </div>

        <div class="verify-box">
          <label for="verify-input">Verify username</label>
          <div class="verify-controls">
            <input id="verify-input" type="text" placeholder="@username" value="${escapeHtml(verifyQuery)}" />
            <button id="verify-check" class="mini-btn">Check</button>
          </div>
          <p id="verify-result" class="meta-line">${escapeHtml(verifyResultText)}</p>
        </div>
      </section>

      <section class="panel search-panel">
        ${dataLine ? `<p class="meta-line search-panel-headline">${escapeHtml(dataLine)}</p>` : ""}
        <div class="stats-row">
          <div><b>Total:</b> ${all.length}</div>
          <div><b>Pending:</b> ${pendingAll.length}</div>
          <div><b>TBD:</b> ${tbdAll.length}</div>
          <div><b>Not found:</b> ${pnfAll.length}</div>
          <div><b>Unfollowed:</b> ${doneAll.length}</div>
          <div class="stats-help-cell">
            <button
              type="button"
              class="stats-help"
              aria-label="Stats legend"
            >?</button>
            <div class="stats-help-tip" role="tooltip">
              <p><b>Total:</b><span>all flagged accounts currently in this sweep.</span></p>
              <p><b>Pending:</b><span>not checked yet.</span></p>
              <p><b>TBD:</b><span>set aside to review later.</span></p>
              <p><b>Not found:</b><span>profile could not be reached.</span></p>
              <p><b>Unfollowed:</b><span>accounts you already marked done.</span></p>
            </div>
          </div>
        </div>
        <div class="toolbar">
          <input id="search-input" type="text" placeholder="Search username" value="${escapeHtml(query)}" autocomplete="off" autocapitalize="none" spellcheck="false" />
          <div id="sort-dropdown" class="sort-dropdown">
            <button id="sort-trigger" type="button" class="sort-trigger" aria-haspopup="listbox" aria-expanded="false">${currentSortLabel}</button>
            <div class="sort-options" role="listbox" aria-label="Sort options">
              <button type="button" class="sort-option ${sort === "latest" ? "is-active" : ""}" data-sort="latest">Sort Latest</button>
              <button type="button" class="sort-option ${sort === "earliest" ? "is-active" : ""}" data-sort="earliest">Sort Earliest</button>
              <button type="button" class="sort-option ${sort === "az" ? "is-active" : ""}" data-sort="az">Sort A-Z</button>
              <button type="button" class="sort-option ${sort === "za" ? "is-active" : ""}" data-sort="za">Sort Z-A</button>
            </div>
            <select id="sort-select" class="sort-select-native" aria-hidden="true" tabindex="-1">
              <option value="latest" ${sort === "latest" ? "selected" : ""}>Sort Latest</option>
              <option value="earliest" ${sort === "earliest" ? "selected" : ""}>Sort Earliest</option>
              <option value="az" ${sort === "az" ? "selected" : ""}>Sort A-Z</option>
              <option value="za" ${sort === "za" ? "selected" : ""}>Sort Z-A</option>
            </select>
          </div>
        </div>
        <p id="search-status" class="meta-line search-status"></p>
      </section>

      <div class="lists-grid">
        <section class="panel list-panel left-column">
          <h2 class="pending-heading">
            <span class="pending-heading-main">
              <span>Pending</span>
              <span class="pending-safety-chip" aria-label="90 minute safety counter">
                <span class="pending-safety-ring" aria-hidden="true">${pendingSafetyDotsHtml}</span>
              </span>
            </span>
            <span class="pending-flow">
              <span class="pending-step">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7"></path><path d="M10 14 21 3"></path><path d="M21 14v7h-7"></path><path d="M3 10V3h7"></path><path d="m3 3 7 7"></path></svg>
                Open
              </span>
              <span class="pending-sep" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"></path></svg>
              </span>
              <span class="pending-step">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16"></path><path d="m14 6 6 6-6 6"></path></svg>
                Unfollow
              </span>
              <span class="pending-sep" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"></path></svg>
              </span>
              <span class="pending-step">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 6-11 11-5-5"></path></svg>
                Check
              </span>
            </span>
          </h2>
          <div id="pendingList" class="list-box">
            <div class="list-scroll">
              ${safetyMode === "strict" && strictLocked ? `<p class="lock-banner">Unfollow is locked right now. You can still move users to TBD or Not Found.</p>` : ""}
              ${pending.length ? listHtml(pending, "pending", visitedSet, strictLocked, pinnedSet) : `<div class="empty">No pending users.</div>`}
            </div>
          </div>
        </section>

        <section class="right-column">
          <section class="panel list-panel">
            <div class="section-head">
              <h2>Unfollowed</h2>
              <button id="toggle-done" class="mini-btn">${showDone ? "Hide" : "Show"} (${doneAll.length})</button>
            </div>
            <div id="doneList" class="list-box ${showDone ? "" : "collapsed"}">
              <div class="list-scroll">
                ${done.length ? listHtml(done, "done", visitedSet, strictLocked, pinnedSet) : `<div class="empty">Nothing here yet.</div>`}
              </div>
            </div>
            ${showDone ? "" : `<p class="meta-line">Unfollowed list is collapsed.</p>`}
          </section>

          <section class="panel list-panel">
            <div class="section-head">
              <h2>To Be Determined</h2>
              <button id="toggle-tbd" class="mini-btn">${showTbd ? "Hide" : "Show"} (${tbdAll.length})</button>
            </div>
            <div id="tbdList" class="list-box ${showTbd ? "" : "collapsed"}">
              <div class="list-scroll">
                ${tbd.length ? listHtml(tbd, "tbd", visitedSet, strictLocked, pinnedSet) : `<div class="empty">Nothing in TBD.</div>`}
              </div>
            </div>
            ${showTbd ? "" : `<p class="meta-line">TBD list is collapsed.</p>`}
          </section>

          <section class="panel list-panel">
            <div class="section-head">
              <h2>Not Found</h2>
              <button id="toggle-pnf" class="mini-btn">${showPnf ? "Hide" : "Show"} (${pnfAll.length})</button>
            </div>
            <div id="pnfList" class="list-box ${showPnf ? "" : "collapsed"}">
              <div class="list-scroll">
                ${pnf.length ? listHtml(pnf, "pnf", visitedSet, strictLocked, pinnedSet) : `<div class="empty">Nothing in Page Not Found.</div>`}
              </div>
            </div>
            ${showPnf ? "" : `<p class="meta-line">Not found list is collapsed.</p>`}
          </section>

          <div class="right-footer">
            <button id="reset-progress" class="danger-btn reset-btn">Reset</button>
          </div>
        </section>
      </div>
    </div>
  `;
  setThemeToggleButton(activeTheme);
  setSafetyToggleButton(safetyMode);
  startSafetyTicker(safetyMode);

  const rerender = (next) =>
    renderResults({
      all,
      unfollowedSet,
      tbdSet,
      pnfSet,
      visitedSet,
      pinnedSet,
      unfollowEvents,
      followedAtByUsername,
      verifyLookups,
      safetyMode: next.safetyMode,
      diagnostics,
      query: next.query,
      sort: next.sort,
      verifyQuery: next.verifyQuery,
      rateNotice: next.rateNotice,
      showDone: next.showDone,
      showTbd: next.showTbd,
      showPnf: next.showPnf,
      theme: next.theme
    });

  const syncPendingListHeight = () => {
    if (window.matchMedia("(max-width: 640px)").matches) {
      const pendingListMobile = document.getElementById("pendingList");
      pendingListMobile?.style.setProperty("--pending-list-height", "390px");
      return;
    }

    const rightColumn = document.querySelector(".right-column");
    const leftPanel = document.querySelector(".left-column");
    const pendingList = document.getElementById("pendingList");
    const pendingScroller = pendingList?.querySelector(".list-scroll");
    if (!rightColumn || !leftPanel || !pendingList || !pendingScroller) return;

    const rightHeight = rightColumn.getBoundingClientRect().height;
    const leftHeight = leftPanel.getBoundingClientRect().height;
    const pendingHeight = pendingList.getBoundingClientRect().height;
    const chromeHeight = Math.max(0, leftHeight - pendingHeight);

    const targetHeight = Math.max(220, Math.round(rightHeight - chromeHeight));
    pendingList.style.setProperty("--pending-list-height", `${targetHeight}px`);
  };

  syncPendingListHeight();

  const getListScroller = (id) => {
    const list = document.getElementById(id);
    return list?.querySelector(".list-scroll") || list;
  };

  const captureListScroll = () => {
    const ids = ["pendingList", "tbdList", "pnfList", "doneList"];
    const state = {};
    for (const id of ids) {
      const el = getListScroller(id);
      state[id] = el ? el.scrollTop : 0;
    }
    return state;
  };

  const restoreListScroll = (state, defer = true) => {
    if (!state) return;
    const apply = () => {
      for (const [id, top] of Object.entries(state)) {
        const el = getListScroller(id);
        if (el) el.scrollTop = Number(top) || 0;
      }
    };
    if (defer) {
      requestAnimationFrame(apply);
      return;
    }
    apply();
  };

  const rerenderPreservingScroll = (next) => {
    const scrollState = captureListScroll();
    rerender(next);
    restoreListScroll(scrollState);
  };

  const animatePendingReorder = (next) => {
    const pendingBefore = document.getElementById("pendingList");
    const beforeRows = pendingBefore
      ? [...pendingBefore.querySelectorAll(".user-row[data-row-username]")]
      : [];
    const scrollState = captureListScroll();

    if (!beforeRows.length) {
      rerender(next);
      restoreListScroll(scrollState, false);
      return;
    }

    const firstTopByUser = new Map();
    for (const row of beforeRows) {
      const key = row.dataset.rowUsername || "";
      if (key) firstTopByUser.set(key, row.getBoundingClientRect().top);
    }

    rerender(next);
    restoreListScroll(scrollState, false);

    const pendingAfter = document.getElementById("pendingList");
    if (!pendingAfter) return;

    const afterRows = [...pendingAfter.querySelectorAll(".user-row[data-row-username]")];
    const movedRows = [];

    for (const row of afterRows) {
      const key = row.dataset.rowUsername || "";
      const firstTop = firstTopByUser.get(key);
      if (typeof firstTop !== "number") continue;

      const dy = firstTop - row.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) continue;

      row.style.transition = "none";
      row.style.transform = `translateY(${dy}px)`;
      row.style.opacity = "0.55";
      movedRows.push(row);
    }

    if (!movedRows.length) return;

    requestAnimationFrame(() => {
      for (const row of movedRows) {
        row.style.transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease";
        row.style.transform = "translateY(0)";
        row.style.opacity = "1";
        row.addEventListener(
          "transitionend",
          () => {
            row.style.removeProperty("transition");
            row.style.removeProperty("transform");
            row.style.removeProperty("opacity");
          },
          { once: true }
        );
      }
    });
  };

  const rerenderWithSearchFocus = (next, caretPos) => {
    rerender(next);
    const input = document.getElementById("search-input");
    if (!(input instanceof HTMLInputElement)) return;
    input.focus();
    const pos = Math.max(0, Math.min(caretPos ?? input.value.length, input.value.length));
    input.setSelectionRange(pos, pos);
  };

  const animateMove = (action, button, onDone) => {
    const row = button.closest(".user-row");
    const targetMap = {
      "to-tbd": "tbdList",
      "to-pnf": "pnfList",
      "to-pending": "pendingList"
    };
    const targetId = targetMap[action] || "";
    const targetList = targetId ? document.getElementById(targetId) : null;

    if (targetList) {
      targetList.classList.add("list-receive");
      setTimeout(() => targetList.classList.remove("list-receive"), 280);
    }

    if (!row) {
      onDone();
      return;
    }

    const dirClass = action === "to-pending" ? "move-left" : "move-right";
    row.classList.add("row-moving", dirClass);
    row.addEventListener("animationend", () => onDone(), { once: true });
  };

  const setSearchLoadingState = (isLoading) => {
    const ids = ["pendingList", "tbdList", "pnfList", "doneList"];
    for (const id of ids) {
      const list = document.getElementById(id);
      if (!list) continue;
      list.classList.toggle("search-loading", isLoading);
      list.style.setProperty("--skeleton-rows", String(SEARCH_SKELETON_ROWS));

      const existingSkeleton = list.querySelector(".skeleton-list");
      if (isLoading) {
        if (!existingSkeleton) {
          const skeleton = document.createElement("div");
          skeleton.className = "skeleton-list";
          skeleton.innerHTML = Array.from({ length: SEARCH_SKELETON_ROWS }, () =>
            `<div class="skeleton-row"><span class="skeleton-dot"></span><span class="skeleton-line"></span><span class="skeleton-chip"></span></div>`
          ).join("");
          list.appendChild(skeleton);
        }
      } else if (existingSkeleton) {
        existingSkeleton.remove();
      }
    }
  };

  const getUiState = () => ({
    query: document.getElementById("search-input")?.value || "",
    sort: document.getElementById("sort-select")?.value || "latest",
    verifyQuery: document.getElementById("verify-input")?.value || "",
    rateNotice,
    safetyMode,
    showDone,
    showTbd,
    showPnf,
    theme: activeTheme
  });

  root.onchange = (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    if (el.type !== "checkbox") return;

    const encodedUsername = el.dataset.username;
    if (!encodedUsername) return;

    const username = decodeURIComponent(encodedUsername);

    if (el.checked) {
      const latestEvents = pruneUnfollowEvents(loadUnfollowEvents());
      saveUnfollowEvents(latestEvents);
      const stateNow = getRateState(latestEvents);
      const strictCooldownRemaining = getStrictCooldownRemaining();
      if (safetyMode === "strict" && (strictCooldownRemaining > 0 || !stateNow.canUnfollow)) {
        el.checked = false;
        const blockedMsg = strictCooldownRemaining > 0
          ? `Limit reached. Try again in ${msToShort(strictCooldownRemaining)}.`
          : `Limit reached. Try again in ${stateNow.waitText}.`;
        rerender({ ...getUiState(), safetyMode, rateNotice: blockedMsg });
        return;
      }

      const row = el.closest(".user-row");
      const doneList = document.getElementById("doneList");
      if (doneList) {
        doneList.classList.add("list-receive");
        setTimeout(() => doneList.classList.remove("list-receive"), 280);
      }

      const commitChecked = () => {
        latestEvents.push(Date.now());
        const nextEvents = pruneUnfollowEvents(latestEvents);
        saveUnfollowEvents(nextEvents);
        unfollowEvents = nextEvents;
        if (safetyMode === "strict") {
          const nextState = getRateState(nextEvents);
          if (nextState.used90 >= LIMIT_90_MIN) {
            saveStrictCooldownUntil(Date.now() + WINDOW_90_MIN_MS);
          }
        }

        unfollowedSet.add(username);
        tbdSet.delete(username);
        pnfSet.delete(username);
        pinnedSet.delete(username);
        persistSets(unfollowedSet, tbdSet, pnfSet, visitedSet, pinnedSet);
        rerenderPreservingScroll({ ...getUiState(), safetyMode, rateNotice: "" });
      };

      if (row) {
        row.classList.add("row-moving", "move-right");
        row.addEventListener("animationend", () => commitChecked(), { once: true });
        return;
      }

      commitChecked();
      return;
    } else {
      unfollowedSet.delete(username);
    }

    persistSets(unfollowedSet, tbdSet, pnfSet, visitedSet, pinnedSet);
    rerenderPreservingScroll({ ...getUiState(), safetyMode, rateNotice: "" });
  };

  root.onclick = (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const sortDropdown = document.getElementById("sort-dropdown");
    const sortTriggerEl = document.getElementById("sort-trigger");
    if (sortDropdown && !target.closest("#sort-dropdown")) {
      sortDropdown.classList.remove("is-open");
      if (sortTriggerEl instanceof HTMLButtonElement) {
        sortTriggerEl.setAttribute("aria-expanded", "false");
      }
    }

    const copyButton = target.closest(".username-copy");
    if (copyButton instanceof HTMLButtonElement) {
      const blurAfterCopy = e instanceof MouseEvent && e.detail > 0;
      const encoded = copyButton.dataset.copyUsername;
      if (!encoded) return;
      const username = decodeURIComponent(encoded);
      if (blurAfterCopy) copyButton.blur();
      copyTextToClipboard(username).then((ok) => {
        const original = copyButton.title;
        copyButton.title = ok ? "Copied!" : "Copy failed";
        copyButton.classList.add(ok ? "copied" : "copy-failed");
        setTimeout(() => {
          copyButton.title = original;
          copyButton.classList.remove("copied", "copy-failed");
        }, 700);
      });
      return;
    }

    const sortTrigger = target.closest("button#sort-trigger");
    if (sortTrigger instanceof HTMLButtonElement) {
      const nextOpen = !sortDropdown?.classList.contains("is-open");
      sortDropdown?.classList.toggle("is-open", nextOpen);
      sortTrigger.setAttribute("aria-expanded", nextOpen ? "true" : "false");
      return;
    }

    const sortOption = target.closest("button.sort-option");
    if (sortOption instanceof HTMLButtonElement) {
      const nextSort = sortOption.dataset.sort;
      const sortSelectEl = document.getElementById("sort-select");
      if (!nextSort || !(sortSelectEl instanceof HTMLSelectElement)) return;
      if (sortSelectEl.value !== nextSort) {
        sortSelectEl.value = nextSort;
        sortSelectEl.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        sortDropdown?.classList.remove("is-open");
        if (sortTriggerEl instanceof HTMLButtonElement) {
          sortTriggerEl.setAttribute("aria-expanded", "false");
        }
      }
      return;
    }

    const button = target.closest("button[data-action], button#toggle-done, button#toggle-tbd, button#toggle-pnf, button#toggle-theme, button#toggle-safety, button#verify-check");
    const link = target.closest("a.user-link");
    if (link instanceof HTMLAnchorElement) {
      const encoded = link.dataset.openUsername;
      if (encoded) {
        const username = decodeURIComponent(encoded);
        visitedSet.add(username);
        persistSets(unfollowedSet, tbdSet, pnfSet, visitedSet, pinnedSet);
        const row = link.closest(".user-row");
        if (row) row.classList.add("visited-row");
      }
      return;
    }
    if (!(button instanceof HTMLButtonElement)) return;

    if (button.id === "toggle-done") {
      const ui = getUiState();
      rerenderPreservingScroll({ ...ui, showDone: !showDone });
      return;
    }
    if (button.id === "toggle-tbd") {
      const ui = getUiState();
      rerenderPreservingScroll({ ...ui, showTbd: !showTbd });
      return;
    }
    if (button.id === "toggle-pnf") {
      const ui = getUiState();
      rerenderPreservingScroll({ ...ui, showPnf: !showPnf });
      return;
    }
    if (button.id === "toggle-theme") {
      activeTheme = activeTheme === "dark" ? "light" : "dark";
      applyTheme(activeTheme);
      saveTheme(activeTheme);
      setThemeToggleButton(activeTheme);
      return;
    }
    if (button.id === "toggle-safety") {
      const nextMode = safetyMode === "strict" ? "risk" : "strict";
      saveSafetyMode(nextMode);
      rerenderPreservingScroll({ ...getUiState(), safetyMode: nextMode, rateNotice: "" });
      return;
    }
    if (button.id === "verify-check") {
      rerenderPreservingScroll(getUiState());
      return;
    }

    const action = button.dataset.action;
    const encodedUsername = button.dataset.username;
    if (!action || !encodedUsername) return;

    const username = decodeURIComponent(encodedUsername);
    if (action === "pin" || action === "unpin") {
      if (action === "pin") {
        pinnedSet.add(username);
      } else {
        pinnedSet.delete(username);
      }
      persistSets(unfollowedSet, tbdSet, pnfSet, visitedSet, pinnedSet);
      animatePendingReorder(getUiState());
      return;
    }

    animateMove(action, button, () => {
      if (action === "to-tbd") {
        tbdSet.add(username);
        unfollowedSet.delete(username);
        pnfSet.delete(username);
        pinnedSet.delete(username);
      }

      if (action === "to-pnf") {
        pnfSet.add(username);
        tbdSet.delete(username);
        unfollowedSet.delete(username);
        pinnedSet.delete(username);
      }

      if (action === "to-pending") {
        tbdSet.delete(username);
        pnfSet.delete(username);
        unfollowedSet.delete(username);
      }

      persistSets(unfollowedSet, tbdSet, pnfSet, visitedSet, pinnedSet);
      rerenderPreservingScroll(getUiState());
    });
  };

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.oninput = (e) => {
    const startedAt = Date.now();
    const nextQuery = e.target instanceof HTMLInputElement ? e.target.value : "";
    const caretPos = e.target instanceof HTMLInputElement
      ? (e.target.selectionStart ?? nextQuery.length)
      : nextQuery.length;
    const nextSort = document.getElementById("sort-select")?.value || "latest";
    const nextVerify = document.getElementById("verify-input")?.value || "";
    setSearchLoadingState(true);
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      const elapsed = Date.now() - startedAt;
      const waitMore = Math.max(0, SEARCH_SKELETON_MIN_MS - elapsed);
      searchDebounceTimer = setTimeout(() => {
        searchDebounceTimer = null;
        rerenderWithSearchFocus(
          { query: nextQuery, sort: nextSort, verifyQuery: nextVerify, rateNotice, showDone, showTbd, showPnf, theme: activeTheme, safetyMode },
          caretPos
        );
      }, waitMore);
    }, SEARCH_DEBOUNCE_MS);
  };

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.onchange = (e) => {
    const nextSort = e.target instanceof HTMLSelectElement ? e.target.value : "latest";
    const nextQuery = document.getElementById("search-input")?.value || "";
    const nextVerify = document.getElementById("verify-input")?.value || "";
    rerender({ query: nextQuery, sort: nextSort, verifyQuery: nextVerify, rateNotice, showDone, showTbd, showPnf, theme: activeTheme, safetyMode });
  };

  const verifyInput = document.getElementById("verify-input");
  if (verifyInput) verifyInput.onkeydown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    rerender(getUiState());
  };

  document.getElementById("reset-progress").onclick = () => {
    if (!window.confirm("Reset checklist, TBD, and Page Not Found lists?")) return;
    unfollowedSet.clear();
    tbdSet.clear();
    pnfSet.clear();
    visitedSet.clear();
    pinnedSet.clear();
    persistSets(unfollowedSet, tbdSet, pnfSet, visitedSet, pinnedSet);
    saveStrictCooldownUntil(0);
    rerender({ query: "", sort: "latest", verifyQuery: "", rateNotice: "", safetyMode, showDone: false, showTbd: false, showPnf: false, theme: activeTheme });
  };
}
async function main() {
  try {
    const followersData = await loadJson("./data/followers.json");
    const followingData = await loadJson("./data/following.json");

    const followerEntries = extractEntries(followersData, "relationships_followers");
    const followingEntries = extractEntries(followingData, "relationships_following");

    const followersParsed = parseUsernames(followerEntries, "followers");
    const followingParsed = parseUsernames(followingEntries, "following");

    // Build a robust follower lookup from all valid username signals (title/value/href).
    const followerLookup = new Set();
    for (const entry of followerEntries) {
      for (const username of extractCandidateUsernames(entry)) {
        followerLookup.add(username);
      }
    }

    // Keep one row per following username (latest timestamp), but compare using all signals.
    const followingRowsByUsername = new Map();
    for (const entry of followingEntries) {
      const primary = extractUsername(entry);
      if (!isValidUsername(primary)) continue;

      const row = {
        username: primary,
        timestamp: extractTimestamp(entry),
        candidates: extractCandidateUsernames(entry)
      };

      const existing = followingRowsByUsername.get(primary);
      if (!existing || row.timestamp > existing.timestamp) {
        followingRowsByUsername.set(primary, row);
      }
    }

    const followingRows = [...followingRowsByUsername.values()];
    const followedAtByUsername = Object.fromEntries(
      followingRows.map((row) => [row.username, row.timestamp])
    );

    const notFollowingBackAll = followingRows
      .filter((row) => !row.candidates.some((candidate) => followerLookup.has(candidate)))
      .map((row) => row.username);

    const allSet = new Set(notFollowingBackAll);
    const unfollowedSet = loadSet(STORAGE_KEY_UNFOLLOWED);
    const tbdSet = loadSet(STORAGE_KEY_TBD);
    const pnfSet = loadSet(STORAGE_KEY_PNF);
    const visitedSet = loadSet(STORAGE_KEY_VISITED);
    const pinnedSet = loadSet(STORAGE_KEY_PINNED);
    let unfollowEvents = pruneUnfollowEvents(loadUnfollowEvents());
    const safetyMode = loadSafetyMode();
    if (getStrictCooldownRemaining() <= 0) {
      saveStrictCooldownUntil(0);
    }

    for (const username of [...unfollowedSet]) {
      if (!allSet.has(username)) unfollowedSet.delete(username);
    }

    for (const username of [...tbdSet]) {
      if (!allSet.has(username) || unfollowedSet.has(username)) tbdSet.delete(username);
    }

    for (const username of [...pnfSet]) {
      if (!allSet.has(username) || unfollowedSet.has(username)) pnfSet.delete(username);
    }
    for (const username of [...visitedSet]) {
      if (!allSet.has(username)) visitedSet.delete(username);
    }
    for (const username of [...pinnedSet]) {
      const isPending = allSet.has(username) && !unfollowedSet.has(username) && !tbdSet.has(username) && !pnfSet.has(username);
      if (!isPending) pinnedSet.delete(username);
    }

    persistSets(unfollowedSet, tbdSet, pnfSet, visitedSet, pinnedSet);
    saveUnfollowEvents(unfollowEvents);

    renderResults({
      all: notFollowingBackAll,
      unfollowedSet,
      tbdSet,
      pnfSet,
      visitedSet,
      pinnedSet,
      unfollowEvents,
      followedAtByUsername,
      verifyLookups: {
        following: new Set(followingRows.map((row) => row.username)),
        followers: followerLookup
      },
      safetyMode,
      query: "",
      sort: "latest",
      verifyQuery: "",
      rateNotice: "",
      showDone: false,
      showTbd: false,
      showPnf: false,
      theme: loadTheme(),
      diagnostics: {
        followers: followersParsed.stats,
        following: followingParsed.stats
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    renderError(msg);
    console.error(err);
  }
}

main();


