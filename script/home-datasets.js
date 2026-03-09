const STORAGE_KEY_THEME = "ig_theme_v1";
const STORAGE_KEY_TUTORIAL_UNLOCKED = "ff_tutorial_unlocked_v1";
const STORAGE_KEY_DATASETS = "ff_guest_datasets_v1";
const STORAGE_KEY_ACTIVE_DATASET_ID = "ff_active_dataset_id_v1";
const STORAGE_KEY_UPLOADED_DATA = "ff_uploaded_instagram_data_v1";
const MAX_GUEST_DATASETS = 2;
let datasets = loadDatasets();
let activeDatasetId = loadActiveDatasetId();
let stagedUpload = null;
let activeTheme = loadTheme();
let showDatasetNameValidation = false;
let activeMainView = "landing";
let openDatasetMenuId = "";
let activeWorkspaceDetail = "";

function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  return saved === "dark" ? "dark" : "light";
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY_THEME, theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function getNavLogoSrc(theme) {
  return theme === "light" ? "./assets/f&f-logo-light.png" : "./assets/f&f-logo.png";
}

function setNavLogo(theme) {
  document.querySelectorAll(".top-nav-logo, .site-footer-logo").forEach((logo) => {
    if (!(logo instanceof HTMLImageElement)) return;
    logo.src = getNavLogoSrc(theme);
  });
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

function setTutorialUnlocked(unlocked) {
  const shell = document.querySelector("[data-tutorial-shell]");
  if (!(shell instanceof HTMLElement)) return;
  shell.classList.toggle("is-locked", !unlocked);
}

function loadDatasets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DATASETS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDatasets() {
  localStorage.setItem(STORAGE_KEY_DATASETS, JSON.stringify(datasets));
}

function loadActiveDatasetId() {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_DATASET_ID) || "";
}

function saveActiveDatasetId(id) {
  activeDatasetId = id;
  if (id) {
    localStorage.setItem(STORAGE_KEY_ACTIVE_DATASET_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_DATASET_ID);
  }
}

function getActiveDataset() {
  return datasets.find((dataset) => dataset.id === activeDatasetId) || datasets[0] || null;
}

function syncPrototypeUploadCache() {
  const active = getActiveDataset();

  if (!active) {
    localStorage.removeItem(STORAGE_KEY_UPLOADED_DATA);
    return;
  }

  localStorage.setItem(
    STORAGE_KEY_UPLOADED_DATA,
    JSON.stringify({
      source: "dataset",
      datasetId: active.id,
      datasetName: active.name,
      uploadedAt: active.createdAtMs || Date.now(),
      followersData: active.followersData,
      followingData: active.followingData,
      profile: active.profile || null,
      scope: active.scope || {},
      metrics: active.metrics || {},
      meta: active.meta || {}
    })
  );
}

function formatDatasetDate(value) {
  if (!value) return "not set";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatCount(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString() : "0";
}

function formatOptionalCount(value, fallback = "Not available") {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : fallback;
}

function hasMetricValue(value) {
  return Number.isFinite(Number(value));
}

function getMetricTrendTone(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  if (number > 0) return "positive";
  if (number < 0) return "negative";
  return "neutral";
}

function makeDatasetId() {
  return `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function extractEntries(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeUsername(value) {
  return String(value || "").trim().replace(/^@/, "").toLowerCase();
}

function buildInstagramProfileUrl(username) {
  const normalized = normalizeUsername(username);
  return normalized ? `https://www.instagram.com/${normalized}/` : "";
}

function getFirstArrayItem(data, key) {
  const entries = extractEntries(data, key);
  return entries[0] || null;
}

function getStringMapValue(entry, key) {
  if (!entry || typeof entry !== "object") return "";
  return String(entry?.string_map_data?.[key]?.value || "").trim();
}

function getMediaMapEntry(entry, key) {
  if (!entry || typeof entry !== "object") return null;
  return entry?.media_map_data?.[key] || null;
}

function looksCorruptedProfileText(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  return /Ã|â|ð|�/.test(text);
}

function repairCorruptedUtf8Text(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  try {
    const bytes = Uint8Array.from([...text].map((char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
  } catch {
    return text;
  }
}

function normalizeDisplayNameText(value) {
  const original = String(value || "").trim();
  if (!original) return "";

  const repaired = looksCorruptedProfileText(original) ? repairCorruptedUtf8Text(original) : original;
  const normalized = repaired.normalize("NFKD");
  const withoutMarks = normalized.replace(/\p{M}+/gu, "");
  const cleaned = withoutMarks
    .replace(/[^\p{L}\p{N} .'-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function getPreferredDisplayName(profile, datasetName) {
  const displayName = normalizeDisplayNameText(profile?.displayName || "");
  if (displayName) return displayName;

  const username = String(profile?.username || "").trim();
  if (username) return `@${username}`;

  const fallbackName = String(datasetName || "").trim();
  if (fallbackName) return fallbackName;

  return "display name not found";
}

function extractUsernameFromHref(href) {
  if (!href) return "";

  try {
    const url = new URL(href);
    const segments = url.pathname.split("/").filter(Boolean);
    if (!segments.length) return "";
    if (segments[0] === "_u" && segments[1]) return normalizeUsername(segments[1]);
    return normalizeUsername(segments[0]);
  } catch {
    const match = String(href).match(/instagram\.com\/(?:_u\/)?([^/?#]+)/i);
    return normalizeUsername(match?.[1] || "");
  }
}

function extractRelationshipUsername(entry) {
  if (!entry || typeof entry !== "object") return "";
  const title = normalizeUsername(entry.title);
  if (title) return title;
  const first = entry?.string_list_data?.[0] || {};
  const value = normalizeUsername(first.value);
  if (value) return value;
  return extractUsernameFromHref(first.href);
}

function extractRelationshipTimestamp(entry) {
  const timestamp = Number(entry?.string_list_data?.[0]?.timestamp || 0);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function createRelationshipRecords(entries, source) {
  const records = [];
  const seen = new Set();

  for (const entry of entries) {
    const username = extractRelationshipUsername(entry);
    if (!username || seen.has(username)) continue;
    seen.add(username);
    records.push({
      username,
      href: String(entry?.string_list_data?.[0]?.href || ""),
      timestamp: extractRelationshipTimestamp(entry),
      source
    });
  }

  return records;
}

function buildRelationshipMetrics(followerEntries, followingEntries) {
  const followers = createRelationshipRecords(followerEntries, "followers");
  const following = createRelationshipRecords(followingEntries, "following");
  const followerSet = new Set(followers.map((entry) => entry.username));
  const followingSet = new Set(following.map((entry) => entry.username));

  let mutualCount = 0;
  let notFollowingBackCount = 0;

  for (const username of followingSet) {
    if (followerSet.has(username)) {
      mutualCount += 1;
    } else {
      notFollowingBackCount += 1;
    }
  }

  return {
    followerCount: followers.length,
    followingCount: following.length,
    mutualCount,
    notFollowingBackCount
  };
}

function extractProfileFromPersonalInfo(data) {
  const profileEntry = getFirstArrayItem(data, "profile_user");
  if (!profileEntry) return null;

  const photo = getMediaMapEntry(profileEntry, "Profile Photo");
  const username = normalizeUsername(getStringMapValue(profileEntry, "Username"));

  return {
    username,
    displayName: getStringMapValue(profileEntry, "Name"),
    bio: getStringMapValue(profileEntry, "Bio"),
    website: getStringMapValue(profileEntry, "Website"),
    isPrivate: getStringMapValue(profileEntry, "Private Account").toLowerCase() === "true",
    profilePhotoPath: String(photo?.uri || "").trim(),
    profilePhotoCreatedAt: Number(photo?.creation_timestamp || 0) || 0
  };
}

function extractInsightDateRange(data) {
  if (!data || typeof data !== "object") return "";

  for (const value of Object.values(data)) {
    if (!Array.isArray(value)) continue;
    for (const entry of value) {
      const label = getStringMapValue(entry, "Date Range");
      if (label) return label;
    }
  }

  return "";
}

function parseInsightCount(value) {
  const digits = String(value || "").replace(/[^\d-]/g, "");
  if (!digits) return null;
  const number = Number(digits);
  return Number.isFinite(number) ? number : null;
}

function extractAudienceInsights(data) {
  const entry = getFirstArrayItem(data, "organic_insights_audience");
  if (!entry) return null;

  const followerTotal = parseInsightCount(getStringMapValue(entry, "Followers"));
  const followsInRange = parseInsightCount(getStringMapValue(entry, "Follows"));
  const unfollowsInRange = parseInsightCount(getStringMapValue(entry, "Unfollows"));
  const netFollowersInRange = parseInsightCount(getStringMapValue(entry, "Overall followers"));
  const dateRangeLabel = getStringMapValue(entry, "Date Range");

  return {
    followerTotal,
    followsInRange,
    unfollowsInRange,
    netFollowersInRange,
    dateRangeLabel
  };
}

function extractReachInsights(data) {
  const entry = getFirstArrayItem(data, "organic_insights_reach");
  if (!entry) return null;

  return {
    accountsReached: parseInsightCount(getStringMapValue(entry, "Accounts Reached")),
    impressions: parseInsightCount(getStringMapValue(entry, "Impressions")),
    profileVisits: parseInsightCount(getStringMapValue(entry, "Profile visits")),
    externalLinkTaps: parseInsightCount(getStringMapValue(entry, "External link taps")),
    dateRangeLabel: getStringMapValue(entry, "Date Range")
  };
}

function extractInteractionInsights(data) {
  const entry = getFirstArrayItem(data, "organic_insights_interactions");
  if (!entry) return null;

  return {
    contentInteractions: parseInsightCount(getStringMapValue(entry, "Content Interactions")),
    accountsEngaged: parseInsightCount(getStringMapValue(entry, "Accounts engaged")),
    postInteractions: parseInsightCount(getStringMapValue(entry, "Post Interactions")),
    storyInteractions: parseInsightCount(getStringMapValue(entry, "Story Interactions")),
    storyReplies: parseInsightCount(getStringMapValue(entry, "Story Replies")),
    dateRangeLabel: getStringMapValue(entry, "Date Range")
  };
}

function pathMatchesRelative(file, relativePath) {
  if (!relativePath) return false;
  const normalizedFilePath = normalizePathForMatch(file);
  const normalizedRelativePath = String(relativePath).replace(/\\/g, "/").toLowerCase();
  return normalizedFilePath.endsWith(normalizedRelativePath);
}

function mimeTypeFromPath(path) {
  const lower = String(path || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(blob);
  });
}

async function resolveProfilePhotoDataUrl(profilePhotoPath, expandedFiles, sourceFiles) {
  if (!profilePhotoPath) return "";

  const directFile = expandedFiles.find((file) => pathMatchesRelative(file, profilePhotoPath));
  if (directFile) {
    return blobToDataUrl(directFile);
  }

  const zipFile = sourceFiles.find((file) => isZipFile(file));
  if (!zipFile) return "";

  const fflate = window.fflate;
  if (!fflate?.unzipSync) return "";

  try {
    const archive = fflate.unzipSync(new Uint8Array(await zipFile.arrayBuffer()));
    const entry = Object.entries(archive).find(([path]) => {
      const normalizedPath = String(path).replace(/\\/g, "/").toLowerCase();
      return normalizedPath === profilePhotoPath.toLowerCase();
    });
    if (!entry) return "";
    const [, bytes] = entry;
    return blobToDataUrl(new Blob([bytes], { type: mimeTypeFromPath(profilePhotoPath) }));
  } catch {
    return "";
  }
}

function getUi() {
  return {
    datasetList: document.querySelector("[data-dataset-list]"),
    datasetCount: document.querySelector("[data-dataset-count]"),
    datasetLimitCopy: document.querySelector("[data-dataset-limit-copy]"),
    landingView: document.querySelector("[data-landing-view]"),
    workspaceView: document.querySelector("[data-workspace-view]"),
    toolsPanel: document.querySelector("[data-tools-panel]"),
    workspaceHead: document.querySelector("[data-workspace-head]"),
    workspaceDatasetName: document.querySelector("[data-workspace-dataset-name]"),
    workspaceDatasetDate: document.querySelector("[data-workspace-dataset-date]"),
    workspaceProfilePhoto: document.querySelector("[data-workspace-profile-photo]"),
    workspaceProfileLink: document.querySelector("[data-workspace-profile-link]"),
    workspaceUsername: document.querySelector("[data-workspace-username]"),
    workspaceDisplayName: document.querySelector("[data-workspace-display-name]"),
    workspaceRange: document.querySelector("[data-workspace-range]"),
    workspaceFollowers: document.querySelector("[data-workspace-followers]"),
    workspaceAccountsReached: document.querySelector("[data-workspace-accounts-reached]"),
    workspaceProfileVisits: document.querySelector("[data-workspace-profile-visits]"),
    workspaceImpressions: document.querySelector("[data-workspace-impressions]"),
    workspaceExternalLinkTaps: document.querySelector("[data-workspace-external-link-taps]"),
    workspaceContentInteractions: document.querySelector("[data-workspace-content-interactions]"),
    workspaceAccountsEngaged: document.querySelector("[data-workspace-accounts-engaged]"),
    workspaceCategories: document.querySelector("[data-workspace-categories]"),
    workspaceSource: document.querySelector("[data-workspace-source]"),
    workspaceOverviewBody: document.querySelector("[data-workspace-overview-body]"),
    workspaceDetailView: document.querySelector("[data-workspace-detail-view]"),
    workspaceDetailKicker: document.querySelector("[data-workspace-detail-kicker]"),
    workspaceDetailTitle: document.querySelector("[data-workspace-detail-title]"),
    workspaceDetailCopy: document.querySelector("[data-workspace-detail-copy]"),
    workspaceDetailPrimaryLabel: document.querySelector("[data-workspace-detail-primary-label]"),
    workspaceDetailPrimaryValue: document.querySelector("[data-workspace-detail-primary-value]"),
    workspaceDetailGrid: document.querySelector("[data-workspace-detail-grid]"),
    workspaceDetailNote: document.querySelector("[data-workspace-detail-note]"),
    modal: document.querySelector("[data-create-modal]"),
    modalIndicators: document.querySelectorAll("[data-modal-step-indicator]"),
    modalStages: document.querySelectorAll("[data-modal-stage]"),
    detailsNameInput: document.querySelector("[data-dataset-name-input]"),
    detailsDateInput: document.querySelector("[data-dataset-date-input]"),
    detailsNameError: document.querySelector("[data-dataset-name-error]"),
    createDatasetButton: document.querySelector("[data-create-dataset]"),
    continueButton: document.querySelector("[data-go-dataset-details]"),
    dropzone: document.querySelector("[data-upload-dropzone]"),
    filesInput: document.querySelector("[data-upload-files]"),
    folderInput: document.querySelector("[data-upload-folder]"),
    uploadStatus: document.querySelector("[data-upload-status]"),
    uploadStatusPill: document.querySelector("[data-upload-status-pill]"),
    uploadStatusPillLabel: document.querySelector("[data-upload-status-pill-label]"),
    uploadStageActions: document.querySelector("[data-upload-stage-actions]"),
    uploadResults: document.querySelector("[data-upload-results]"),
    uploadReadyCopy: document.querySelector("[data-upload-ready-copy]"),
    sourceLabel: document.querySelector("[data-upload-source]"),
    categoryCount: document.querySelector("[data-upload-category-count]")
  };
}

function setUploadStatus(message, tone = "neutral") {
  const { uploadStatus, uploadStatusPill, uploadStatusPillLabel } = getUi();
  if (!(uploadStatus instanceof HTMLElement)) return;
  uploadStatus.textContent = message;
  uploadStatus.classList.remove("is-success", "is-error");
  if (tone === "success") uploadStatus.classList.add("is-success");
  if (tone === "error") uploadStatus.classList.add("is-error");

  if (uploadStatusPill instanceof HTMLButtonElement) {
    uploadStatusPill.classList.remove("is-success", "is-error", "is-neutral");
    uploadStatusPill.classList.add(
      tone === "success" ? "is-success" : tone === "error" ? "is-error" : "is-neutral"
    );
    uploadStatusPill.removeAttribute("title");
    uploadStatusPill.setAttribute("aria-label", message);
  }

  if (uploadStatusPillLabel instanceof HTMLElement) {
    const lowerMessage = message.toLowerCase();
    uploadStatusPillLabel.textContent =
      tone === "success"
        ? "upload ready"
        : tone === "error"
          ? "upload issue"
          : lowerMessage.includes("waiting")
            ? "no export"
            : "checking";
  }
}

function setUploadResultsVisible(visible) {
  const { uploadResults } = getUi();
  if (!(uploadResults instanceof HTMLElement)) return;
  uploadResults.hidden = !visible;
}

function updateUploadStageActions() {
  const { uploadStageActions } = getUi();
  if (!(uploadStageActions instanceof HTMLElement)) return;
  uploadStageActions.hidden = !stagedUpload;
}

function updateCreateDatasetButtonState() {
  const { detailsNameInput, detailsNameError, createDatasetButton } = getUi();
  if (!(createDatasetButton instanceof HTMLButtonElement)) return;
  const hasName = detailsNameInput instanceof HTMLInputElement && detailsNameInput.value.trim().length > 0;
  createDatasetButton.disabled = !stagedUpload || !hasName;
  if (detailsNameInput instanceof HTMLInputElement) {
    detailsNameInput.classList.toggle("is-invalid", Boolean(stagedUpload) && !hasName && showDatasetNameValidation);
  }
  if (detailsNameError instanceof HTMLElement) {
    detailsNameError.hidden = hasName || !stagedUpload || !showDatasetNameValidation;
  }
}

function updateGuestLimitUi() {
  const { datasetLimitCopy, datasetCount } = getUi();
  if (datasetLimitCopy) datasetLimitCopy.textContent = `${datasets.length} of ${MAX_GUEST_DATASETS} datasets used`;
  if (datasetCount) datasetCount.textContent = String(datasets.length);
  const disabled = datasets.length >= MAX_GUEST_DATASETS;
  document.querySelectorAll("[data-open-create-modal]").forEach((button) => {
    if (button instanceof HTMLButtonElement) button.disabled = disabled;
  });
}

function renderDatasetList() {
  const { datasetList } = getUi();
  if (!(datasetList instanceof HTMLElement)) return;
  datasetList.innerHTML = "";

  if (!datasets.length) {
    const empty = document.createElement("div");
    empty.className = "dataset-empty-state";
    empty.innerHTML = `
      <h3 class="dataset-empty-title">no datasets yet</h3>
      <p class="dataset-empty-copy">create one and it will appear here.</p>
    `;
    datasetList.appendChild(empty);
    return;
  }

  for (const dataset of datasets) {
    const card = document.createElement("div");
    const isMenuOpen = openDatasetMenuId === dataset.id;
    card.className = `dataset-card${dataset.id === activeDatasetId ? " is-active" : ""}${isMenuOpen ? " is-menu-open" : ""}`;
    card.innerHTML = `
      <button type="button" class="dataset-card-select" data-dataset-select="${dataset.id}" aria-label="Open dataset ${escapeHtml(dataset.name)}">
        <h3 class="dataset-card-title">${escapeHtml(dataset.name)}</h3>
      </button>
      <div class="dataset-card-actions">
        <button
          type="button"
          class="dataset-card-menu-toggle"
          data-dataset-menu-toggle="${dataset.id}"
          data-tip="menu"
          aria-label="Open dataset actions for ${escapeHtml(dataset.name)}"
          aria-expanded="${isMenuOpen ? "true" : "false"}"
        >
          <span class="dataset-card-menu-letter">M</span>
        </button>
        <div class="dataset-card-menu"${isMenuOpen ? "" : " hidden"}>
          <button type="button" class="dataset-card-menu-btn" data-dataset-rename="${dataset.id}" data-tip="edit" aria-label="Rename dataset ${escapeHtml(dataset.name)}">
            <span class="dataset-card-menu-letter">E</span>
          </button>
          <button type="button" class="dataset-card-menu-btn is-danger" data-dataset-delete="${dataset.id}" data-tip="trash" aria-label="Delete dataset ${escapeHtml(dataset.name)}">
            <span class="dataset-card-menu-letter">T</span>
          </button>
        </div>
      </div>
    `;
    datasetList.appendChild(card);
  }
}

function toggleDatasetMenu(id) {
  openDatasetMenuId = openDatasetMenuId === id ? "" : id;
  renderDatasetList();
}

function renameDataset(id) {
  const dataset = datasets.find((entry) => entry.id === id);
  if (!dataset) return;

  const nextName = window.prompt("Rename dataset", dataset.name || "");
  if (nextName === null) return;

  const trimmed = nextName.trim();
  if (!trimmed) return;

  dataset.name = trimmed;
  saveDatasets();
  openDatasetMenuId = "";
  renderAll();
}

function deleteDataset(id) {
  const dataset = datasets.find((entry) => entry.id === id);
  if (!dataset) return;

  const confirmed = window.confirm(`Delete "${dataset.name}"? This removes it from local guest storage.`);
  if (!confirmed) return;

  datasets = datasets.filter((entry) => entry.id !== id);
  openDatasetMenuId = "";

  if (!datasets.length) {
    saveActiveDatasetId("");
    activeMainView = "landing";
    activeWorkspaceDetail = "";
  } else if (activeDatasetId === id) {
    saveActiveDatasetId(datasets[0].id);
    activeMainView = "workspace";
    activeWorkspaceDetail = "";
  }

  saveDatasets();
  syncActiveDataset();
  renderAll();
}

function renderActiveDataset() {
  const ui = getUi();
  const active = getActiveDataset();
  if (active) {
    saveActiveDatasetId(active.id);
    syncPrototypeUploadCache();
  } else {
    syncPrototypeUploadCache();
  }

  const showWorkspace = Boolean(active) && activeMainView === "workspace";
  if (ui.landingView instanceof HTMLElement) ui.landingView.hidden = showWorkspace;
  if (ui.workspaceView instanceof HTMLElement) ui.workspaceView.hidden = !showWorkspace;
  if (ui.toolsPanel instanceof HTMLElement) ui.toolsPanel.hidden = !showWorkspace;

  if (!active) return;

  if (ui.workspaceDatasetName) ui.workspaceDatasetName.textContent = active.name || "active dataset";
  if (ui.workspaceDatasetDate) ui.workspaceDatasetDate.textContent = formatDatasetDate(active.createdAt);
  if (ui.workspaceProfilePhoto instanceof HTMLImageElement) {
    ui.workspaceProfilePhoto.src = active.profile?.profilePhotoDataUrl || "./assets/favicon.png";
    ui.workspaceProfilePhoto.alt = active.profile?.username
      ? `Profile photo for @${active.profile.username}`
      : "Dataset profile photo";
  }
  if (ui.workspaceProfileLink instanceof HTMLAnchorElement) {
    const profileUrl = buildInstagramProfileUrl(active.profile?.username);
    ui.workspaceProfileLink.hidden = !profileUrl;
    ui.workspaceProfileLink.href = profileUrl || "https://www.instagram.com/";
    ui.workspaceProfileLink.setAttribute(
      "aria-label",
      profileUrl ? `Open @${active.profile?.username} on Instagram` : "Open Instagram profile"
    );
    ui.workspaceProfileLink.setAttribute(
      "title",
      profileUrl ? `Open @${active.profile?.username}` : "Open Instagram profile"
    );
  }
  if (ui.workspaceUsername) ui.workspaceUsername.textContent = active.profile?.username ? `@${active.profile.username}` : "@instagram";
  if (ui.workspaceDisplayName) ui.workspaceDisplayName.textContent = getPreferredDisplayName(active.profile, active.name);
  if (ui.workspaceRange) {
    ui.workspaceRange.textContent = active.scope?.insightDateRangeLabel
      ? `detected insight range: ${active.scope.insightDateRangeLabel}`
      : "insight range not detected";
  }
  if (ui.workspaceFollowers) {
    ui.workspaceFollowers.textContent = formatCount(
      active.metrics?.followerTotalFromInsights
        ?? active.metrics?.followerCount
        ?? active.meta?.followerEntryCount
    );
  }
  if (ui.workspaceAccountsReached) ui.workspaceAccountsReached.textContent = formatCount(active.metrics?.accountsReached);
  if (ui.workspaceProfileVisits) ui.workspaceProfileVisits.textContent = formatCount(active.metrics?.profileVisits);
  if (ui.workspaceImpressions) ui.workspaceImpressions.textContent = formatCount(active.metrics?.impressions);
  if (ui.workspaceExternalLinkTaps) ui.workspaceExternalLinkTaps.textContent = formatCount(active.metrics?.externalLinkTaps);
  if (ui.workspaceContentInteractions) ui.workspaceContentInteractions.textContent = formatCount(active.metrics?.contentInteractions);
  if (ui.workspaceAccountsEngaged) ui.workspaceAccountsEngaged.textContent = formatCount(active.metrics?.accountsEngaged);
  if (ui.workspaceCategories) ui.workspaceCategories.textContent = formatCount(active.meta?.categoryCounts?.length);
  if (ui.workspaceSource) ui.workspaceSource.textContent = active.meta?.sourceLabel || "not detected";
  renderWorkspaceDetail(active, ui);
}

function renderAll() {
  updateGuestLimitUi();
  renderDatasetList();
  renderActiveDataset();
}

function showHomePanel() {
  activeMainView = "landing";
  activeWorkspaceDetail = "";
  renderAll();
}

function showWorkspacePanel() {
  if (!getActiveDataset()) return;
  activeMainView = "workspace";
  renderAll();
}

function resetUploadUi() {
  stagedUpload = null;
  showDatasetNameValidation = false;
  setUploadStatus("waiting for files.");
  setUploadResultsVisible(false);
  const ui = getUi();
  if (ui.continueButton instanceof HTMLButtonElement) ui.continueButton.disabled = true;
  if (ui.uploadReadyCopy) ui.uploadReadyCopy.textContent = "";
  if (ui.sourceLabel) ui.sourceLabel.textContent = "not detected";
  if (ui.categoryCount) ui.categoryCount.textContent = "0";
  updateUploadStageActions();
  updateModalStepAvailability();
  updateCreateDatasetButtonState();
}

function clearStagedUpload() {
  resetUploadUi();
  setModalStep("upload");
}

function setModalStep(step) {
  const { modalIndicators, modalStages } = getUi();
  modalIndicators.forEach((indicator) => {
    if (!(indicator instanceof HTMLElement)) return;
    indicator.classList.toggle("is-active", indicator.dataset.modalStepIndicator === step);
  });
  modalStages.forEach((stage) => {
    if (!(stage instanceof HTMLElement)) return;
    stage.hidden = stage.dataset.modalStage !== step;
  });
}

function isModalStepAvailable(step) {
  if (step === "upload") return true;
  if (step === "review" || step === "details") return Boolean(stagedUpload);
  return false;
}

function updateModalStepAvailability() {
  const { modalIndicators } = getUi();
  modalIndicators.forEach((indicator) => {
    if (!(indicator instanceof HTMLButtonElement)) return;
    const step = indicator.dataset.modalStepIndicator || "";
    indicator.disabled = !isModalStepAvailable(step);
  });
}

function openCreateModal() {
  if (datasets.length >= MAX_GUEST_DATASETS) return;
  const ui = getUi();
  if (!(ui.modal instanceof HTMLElement)) return;
  ui.modal.hidden = false;
  resetUploadUi();
  updateModalStepAvailability();
  setModalStep("upload");
  const today = new Date().toISOString().slice(0, 10);
  if (ui.detailsNameInput instanceof HTMLInputElement) ui.detailsNameInput.value = "";
  if (ui.detailsDateInput instanceof HTMLInputElement) ui.detailsDateInput.value = today;
}

function closeCreateModal() {
  const { modal } = getUi();
  if (!(modal instanceof HTMLElement)) return;
  modal.hidden = true;
}

function normalizeUploadPath(file) {
  return file.webkitRelativePath || file.name;
}

function isZipFile(file) {
  return /\.zip$/i.test(file.name) || file.type === "application/zip" || file.type === "application/x-zip-compressed";
}

function normalizePathForMatch(file) {
  return normalizeUploadPath(file).replace(/\\/g, "/").toLowerCase();
}

function isFollowersFile(file) {
  const path = normalizePathForMatch(file);
  return /(^|\/)connections\/followers_and_following\/followers(_\d+)?\.json$/i.test(path);
}

function isFollowingFile(file) {
  const path = normalizePathForMatch(file);
  return /(^|\/)connections\/followers_and_following\/following\.json$/i.test(path);
}

function detectImportCategory(file) {
  const path = normalizePathForMatch(file);

  if (/(^|\/)connections\/followers_and_following\//.test(path)) return "connections";
  if (/(^|\/)connections\/contacts\//.test(path)) return "contacts";
  if (/(^|\/)your_instagram_activity\/messages\//.test(path)) return "messages";
  if (/(^|\/)your_instagram_activity\/threads\//.test(path)) return "threads";
  if (/(^|\/)logged_information\/past_instagram_insights\//.test(path)) return "insights";
  if (/(^|\/)your_instagram_activity\/media\//.test(path)) return "media";
  if (/(^|\/)your_instagram_activity\/comments\//.test(path)) return "comments";
  if (/(^|\/)your_instagram_activity\/likes\//.test(path)) return "likes";
  if (/(^|\/)your_instagram_activity\/story_interactions\//.test(path)) return "story interactions";
  if (/(^|\/)your_instagram_activity\//.test(path)) return "activity";
  if (/(^|\/)ads_information\//.test(path)) return "ads";
  if (/(^|\/)personal_information\//.test(path)) return "personal info";
  if (/(^|\/)security_and_login_information\//.test(path)) return "security";
  if (/(^|\/)preferences\//.test(path)) return "preferences";
  if (/(^|\/)apps_and_websites_off_of_instagram\//.test(path)) return "apps and websites";

  return "other";
}

function createCategoryCounts(files) {
  const counts = new Map();

  for (const file of files) {
    const category = detectImportCategory(file);
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  return counts;
}

function summarizeDetectedCategories(categoryCounts) {
  const ranked = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);

  if (!ranked.length) return "followers and following";
  if (ranked.length <= 4) return ranked.join(", ");

  const visible = ranked.slice(0, 4);
  const remaining = ranked.length - visible.length;
  return `${visible.join(", ")}, +${remaining} more`;
}

function classifyInstagramJson(data, file) {
  const followersEntries = extractEntries(data, "relationships_followers");
  if (isFollowersFile(file) && followersEntries.length > 0) {
    return { type: "followers", entries: followersEntries, path: normalizeUploadPath(file) };
  }

  const followingEntries = extractEntries(data, "relationships_following");
  if (isFollowingFile(file) && followingEntries.length > 0) {
    return { type: "following", entries: followingEntries, path: normalizeUploadPath(file) };
  }

  return null;
}

async function readDirectoryEntry(entry, prefix = "") {
  if (!entry) return [];
  if (entry.isFile) {
    return [
      await new Promise((resolve, reject) => {
        entry.file((file) => {
          try {
            const path = prefix ? `${prefix}/${file.name}` : file.name;
            Object.defineProperty(file, "webkitRelativePath", { configurable: true, value: path });
          } catch {}
          resolve(file);
        }, reject);
      })
    ];
  }
  if (!entry.isDirectory) return [];

  const reader = entry.createReader();
  const children = [];
  while (true) {
    const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
    if (!batch.length) break;
    children.push(...batch);
  }

  const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
  const nested = await Promise.all(children.map((child) => readDirectoryEntry(child, nextPrefix)));
  return nested.flat();
}

async function collectDroppedFiles(dataTransfer) {
  const itemEntries = [...(dataTransfer?.items || [])]
    .map((item) => (typeof item.webkitGetAsEntry === "function" ? item.webkitGetAsEntry() : null))
    .filter(Boolean);
  if (itemEntries.length > 0) {
    const files = await Promise.all(itemEntries.map((entry) => readDirectoryEntry(entry)));
    return files.flat();
  }
  return [...(dataTransfer?.files || [])];
}

async function extractZipJsonFiles(file) {
  const fflate = window.fflate;
  if (!fflate?.unzipSync || !fflate?.strFromU8) throw new Error("Zip support is unavailable right now.");
  const archive = fflate.unzipSync(new Uint8Array(await file.arrayBuffer()));
  const extracted = [];
  for (const [path, bytes] of Object.entries(archive)) {
    if (!/\.json$/i.test(path)) continue;
    extracted.push({
      name: path.split("/").pop() || path,
      webkitRelativePath: `${file.name}/${path}`,
      text: async () => fflate.strFromU8(bytes)
    });
  }
  return extracted;
}

function buildUploadPayload(followerMatches, followingMatches, summaryMeta) {
  const followersData = {
    relationships_followers: followerMatches.flatMap((match) => match.entries)
  };
  const followingData = {
    relationships_following: followingMatches.flatMap((match) => match.entries)
  };

  return {
    followersData,
    followingData,
    profile: summaryMeta.profile,
    scope: {
      insightDateRangeLabel: summaryMeta.insightDateRangeLabel || ""
    },
    metrics: {
      ...buildRelationshipMetrics(
        followersData.relationships_followers,
        followingData.relationships_following
      ),
      followerTotalFromInsights: summaryMeta.audienceInsights?.followerTotal ?? null,
      accountsReached: summaryMeta.reachInsights?.accountsReached ?? null,
      impressions: summaryMeta.reachInsights?.impressions ?? null,
      profileVisits: summaryMeta.reachInsights?.profileVisits ?? null,
      externalLinkTaps: summaryMeta.reachInsights?.externalLinkTaps ?? null,
      contentInteractions: summaryMeta.interactionInsights?.contentInteractions ?? null,
      accountsEngaged: summaryMeta.interactionInsights?.accountsEngaged ?? null,
      postInteractions: summaryMeta.interactionInsights?.postInteractions ?? null,
      storyInteractions: summaryMeta.interactionInsights?.storyInteractions ?? null,
      storyReplies: summaryMeta.interactionInsights?.storyReplies ?? null,
      followsInRange: summaryMeta.audienceInsights?.followsInRange ?? null,
      unfollowsInRange: summaryMeta.audienceInsights?.unfollowsInRange ?? null,
      netFollowersInRange: summaryMeta.audienceInsights?.netFollowersInRange ?? null
    },
    insights: summaryMeta.audienceInsights || null,
    meta: {
      followersFiles: followerMatches.map((match) => ({ path: match.path, count: match.entries.length })),
      followingFiles: followingMatches.map((match) => ({ path: match.path, count: match.entries.length })),
      followerEntryCount: followersData.relationships_followers.length,
      followingEntryCount: followingData.relationships_following.length,
      sourceLabel: summaryMeta.sourceLabel,
      detectedDataLabel: summaryMeta.detectedDataLabel,
      scannedJsonCount: summaryMeta.scannedJsonCount,
      ignoredJsonCount: summaryMeta.ignoredJsonCount,
      categoryCounts: summaryMeta.categoryCounts
    }
  };
}

function renderStagedUpload(payload) {
  stagedUpload = payload;
  const ui = getUi();
  if (ui.uploadReadyCopy) {
    ui.uploadReadyCopy.textContent = "Export recognized and prepared for dataset creation.";
  }
  if (ui.sourceLabel) ui.sourceLabel.textContent = payload.meta.sourceLabel || "not detected";
  if (ui.categoryCount) ui.categoryCount.textContent = `${payload.meta.categoryCounts.length}`;
  if (ui.continueButton instanceof HTMLButtonElement) ui.continueButton.disabled = false;
  setUploadResultsVisible(true);
  updateUploadStageActions();
  updateModalStepAvailability();
  updateCreateDatasetButtonState();
  setModalStep("review");
}

async function processSelectedFiles(fileList) {
  const files = [...fileList];
  const expandedFiles = [];
  let zipCount = 0;

  for (const file of files) {
    if (isZipFile(file)) {
      zipCount += 1;
      try {
        expandedFiles.push(...(await extractZipJsonFiles(file)));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not open that zip file.";
        stagedUpload = null;
        setUploadResultsVisible(false);
        setUploadStatus(`${message} Try the extracted folder or JSON files instead.`, "error");
        return;
      }
    } else {
      expandedFiles.push(file);
    }
  }

  const jsonFiles = expandedFiles.filter((file) => /\.json$/i.test(file.name));
  if (!jsonFiles.length) {
    stagedUpload = null;
    setUploadResultsVisible(false);
    setUploadStatus("No JSON files found. Drop the Instagram zip, the extracted export folder, or the followers and following JSON files.", "error");
    return;
  }

  const scanMessage = zipCount
    ? `Opened ${zipCount} zip file${zipCount === 1 ? "" : "s"} and found ${jsonFiles.length} JSON file${jsonFiles.length === 1 ? "" : "s"}.`
    : `Scanning ${jsonFiles.length} JSON file${jsonFiles.length === 1 ? "" : "s"}...`;
  setUploadStatus(scanMessage);

  const followerMatches = [];
  const followingMatches = [];
  let ignoredJsonCount = 0;
  const categoryCounts = createCategoryCounts(jsonFiles);
  let profile = null;
  let insightDateRangeLabel = "";
  let audienceInsights = null;
  let reachInsights = null;
  let interactionInsights = null;
  for (const file of jsonFiles) {
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      continue;
    }
    if (!profile && /(^|\/)personal_information\/personal_information\/personal_information\.json$/i.test(normalizePathForMatch(file))) {
      profile = extractProfileFromPersonalInfo(parsed);
      continue;
    }
    if (!audienceInsights && /(^|\/)logged_information\/past_instagram_insights\/audience_insights\.json$/i.test(normalizePathForMatch(file))) {
      audienceInsights = extractAudienceInsights(parsed);
      if (!insightDateRangeLabel && audienceInsights?.dateRangeLabel) {
        insightDateRangeLabel = audienceInsights.dateRangeLabel;
      }
    }
    if (!reachInsights && /(^|\/)logged_information\/past_instagram_insights\/profiles_reached\.json$/i.test(normalizePathForMatch(file))) {
      reachInsights = extractReachInsights(parsed);
      if (!insightDateRangeLabel && reachInsights?.dateRangeLabel) {
        insightDateRangeLabel = reachInsights.dateRangeLabel;
      }
    }
    if (!interactionInsights && /(^|\/)logged_information\/past_instagram_insights\/content_interactions\.json$/i.test(normalizePathForMatch(file))) {
      interactionInsights = extractInteractionInsights(parsed);
      if (!insightDateRangeLabel && interactionInsights?.dateRangeLabel) {
        insightDateRangeLabel = interactionInsights.dateRangeLabel;
      }
    }
    if (!insightDateRangeLabel) {
      insightDateRangeLabel = extractInsightDateRange(parsed);
    }
    const classified = classifyInstagramJson(parsed, file);
    if (!classified) {
      ignoredJsonCount += 1;
      continue;
    }
    if (classified.type === "followers") followerMatches.push(classified);
    if (classified.type === "following") followingMatches.push(classified);
  }

  if (!followerMatches.length || !followingMatches.length) {
    stagedUpload = null;
    setUploadResultsVisible(false);
    const missing = [
      followerMatches.length ? null : "followers",
      followingMatches.length ? null : "following"
    ].filter(Boolean).join(" and ");
    setUploadStatus(`Could not find the required ${missing} JSON. Make sure you selected the Instagram zip or extracted export in JSON format.`, "error");
    return;
  }

  const sourceLabel = zipCount
    ? `ZIP archive${zipCount > 1 ? "s" : ""}`
    : files.some((file) => file.webkitRelativePath)
      ? "folder import"
      : "selected files";

  const detectedDataLabel = summarizeDetectedCategories(categoryCounts);
  if (profile?.profilePhotoPath) {
    profile.profilePhotoDataUrl = await resolveProfilePhotoDataUrl(profile.profilePhotoPath, expandedFiles, files);
  }

  renderStagedUpload(buildUploadPayload(followerMatches, followingMatches, {
    sourceLabel,
    detectedDataLabel,
    scannedJsonCount: jsonFiles.length,
    ignoredJsonCount,
    categoryCounts: [...categoryCounts.entries()],
    profile,
    insightDateRangeLabel,
    audienceInsights,
    reachInsights,
    interactionInsights
  }));
  setUploadStatus("Upload ready. Review the summary below, then continue to dataset details.", "success");
}

function selectDataset(id) {
  saveActiveDatasetId(id);
  activeMainView = "workspace";
  activeWorkspaceDetail = "";
  renderAll();
}

function getWorkspaceDetailConfig(dataset, detail) {
  if (!dataset || !detail) return null;

  const rangeLabel = dataset.scope?.insightDateRangeLabel || "range not detected";

  if (detail === "followers") {
    return {
      kicker: "instagram insights",
      title: "followers",
      copy: "This is the follower total pulled from Instagram insights in the imported export.",
      primaryLabel: "follower total",
      primaryValue: formatOptionalCount(dataset.metrics?.followerTotalFromInsights),
      note: "This card is insight-backed. Relationship-based follower records are still kept separately for tool logic.",
      supporting: [
        {
          label: "follows in range",
          value: formatOptionalCount(dataset.metrics?.followsInRange),
          available: hasMetricValue(dataset.metrics?.followsInRange),
          tone: "positive",
          mark: "↗"
        },
        {
          label: "unfollows in range",
          value: formatOptionalCount(dataset.metrics?.unfollowsInRange),
          available: hasMetricValue(dataset.metrics?.unfollowsInRange),
          tone: "negative",
          mark: "↘"
        },
        {
          label: "net follower change",
          value: formatOptionalCount(dataset.metrics?.netFollowersInRange),
          available: hasMetricValue(dataset.metrics?.netFollowersInRange),
          tone: getMetricTrendTone(dataset.metrics?.netFollowersInRange),
          mark: Number(dataset.metrics?.netFollowersInRange) > 0 ? "+" : Number(dataset.metrics?.netFollowersInRange) < 0 ? "−" : "•"
        },
        { label: "detected range", value: rangeLabel, available: true }
      ]
    };
  }

  return null;
}

function renderWorkspaceDetail(dataset, ui = getUi()) {
  const detailConfig = getWorkspaceDetailConfig(dataset, activeWorkspaceDetail);
  const showDetail = Boolean(detailConfig);

  if (ui.workspaceHead instanceof HTMLElement) {
    ui.workspaceHead.hidden = showDetail;
  }

  if (ui.workspaceOverviewBody instanceof HTMLElement) {
    ui.workspaceOverviewBody.hidden = showDetail;
  }

  if (ui.workspaceDetailView instanceof HTMLElement) {
    ui.workspaceDetailView.hidden = !showDetail;
  }

  if (!showDetail) return;

  if (ui.workspaceDetailKicker) ui.workspaceDetailKicker.textContent = detailConfig.kicker;
  if (ui.workspaceDetailTitle) ui.workspaceDetailTitle.textContent = detailConfig.title;
  if (ui.workspaceDetailCopy) ui.workspaceDetailCopy.textContent = detailConfig.copy;
  if (ui.workspaceDetailPrimaryLabel) ui.workspaceDetailPrimaryLabel.textContent = detailConfig.primaryLabel;
  if (ui.workspaceDetailPrimaryValue) ui.workspaceDetailPrimaryValue.textContent = detailConfig.primaryValue;

  if (ui.workspaceDetailGrid instanceof HTMLElement) {
    const visibleSupporting = detailConfig.supporting.filter((item) => item.available !== false);
    ui.workspaceDetailGrid.innerHTML = visibleSupporting
      .map(
        (item) => `
          <article class="dataset-detail-card">
            <span class="dataset-meta-label">${escapeHtml(item.label)}</span>
            <strong class="dataset-overview-value${item.tone ? ` is-${escapeHtml(item.tone)}` : ""}">
              ${item.mark ? `<span class="dataset-detail-value-mark is-${escapeHtml(item.tone || "neutral")}">${escapeHtml(item.mark)}</span>` : ""}
              <span>${escapeHtml(item.value)}</span>
            </strong>
          </article>
        `
      )
      .join("");
  }

  if (ui.workspaceDetailNote instanceof HTMLElement) {
    ui.workspaceDetailNote.hidden = !detailConfig.note;
    ui.workspaceDetailNote.textContent = detailConfig.note || "";
  }
}

function createDatasetFromStage() {
  if (!stagedUpload || datasets.length >= MAX_GUEST_DATASETS) return;
  const ui = getUi();
  const name = ui.detailsNameInput instanceof HTMLInputElement ? ui.detailsNameInput.value.trim() : "";
  if (!name) {
    showDatasetNameValidation = true;
    updateCreateDatasetButtonState();
    ui.detailsNameInput?.focus();
    return;
  }
  const createdAt = ui.detailsDateInput instanceof HTMLInputElement ? ui.detailsDateInput.value : "";

  const dataset = {
    id: makeDatasetId(),
    name,
    createdAt: createdAt || new Date().toISOString().slice(0, 10),
    followersData: stagedUpload.followersData,
    followingData: stagedUpload.followingData,
    profile: stagedUpload.profile || null,
    scope: stagedUpload.scope || {},
    metrics: stagedUpload.metrics || {},
    meta: stagedUpload.meta,
    createdAtMs: Date.now()
  };

  datasets = [dataset, ...datasets].slice(0, MAX_GUEST_DATASETS);
  try {
    saveDatasets();
  } catch {
    setUploadStatus("Could not save that dataset locally. Try a smaller export or clear old datasets first.", "error");
    datasets = loadDatasets();
    syncPrototypeUploadCache();
    return;
  }
  activeMainView = "workspace";
  selectDataset(dataset.id);
  closeCreateModal();
}

function wireUploadFlow() {
  const ui = getUi();
  const { dropzone, filesInput, folderInput, continueButton } = ui;
  if (!(dropzone instanceof HTMLElement) || !(filesInput instanceof HTMLInputElement) || !(folderInput instanceof HTMLInputElement)) return;

  const openPicker = () => {
    filesInput.value = "";
    filesInput.click();
  };

  document.querySelectorAll("[data-upload-trigger]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openPicker();
    });
  });

  dropzone.addEventListener("click", () => openPicker());
  dropzone.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openPicker();
  });

  ["dragenter", "dragover"].forEach((type) => {
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "dragend"].forEach((type) => {
    dropzone.addEventListener(type, () => {
      dropzone.classList.remove("is-dragover");
    });
  });

  dropzone.addEventListener("drop", async (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
    const files = await collectDroppedFiles(event.dataTransfer);
    await processSelectedFiles(files);
  });

  filesInput.addEventListener("change", async () => {
    if (!filesInput.files?.length) return;
    await processSelectedFiles(filesInput.files);
  });

  folderInput.addEventListener("change", async () => {
    if (!folderInput.files?.length) return;
    await processSelectedFiles(folderInput.files);
  });

  continueButton?.addEventListener("click", () => {
    if (!stagedUpload) return;
    setModalStep("details");
  });
}

function wireModal() {
  document.querySelectorAll("[data-open-create-modal]").forEach((button) => {
    button.addEventListener("click", openCreateModal);
  });

  document.querySelectorAll("[data-close-create-modal]").forEach((button) => {
    button.addEventListener("click", closeCreateModal);
  });

  document.querySelector("[data-back-to-upload]")?.addEventListener("click", () => {
    setModalStep("upload");
  });

  document.querySelector("[data-back-to-review]")?.addEventListener("click", () => {
    if (!stagedUpload) {
      setModalStep("upload");
      return;
    }
    setModalStep("review");
  });

  document.querySelector("[data-back-to-review-from-upload]")?.addEventListener("click", () => {
    if (!stagedUpload) return;
    setModalStep("review");
  });

  document.querySelector("[data-clear-staged-upload]")?.addEventListener("click", () => {
    clearStagedUpload();
  });

  document.querySelectorAll("[data-modal-step-indicator]").forEach((indicator) => {
    indicator.addEventListener("click", () => {
      if (!(indicator instanceof HTMLButtonElement)) return;
      const step = indicator.dataset.modalStepIndicator || "";
      if (!isModalStepAvailable(step)) return;
      setModalStep(step);
    });
  });

  document.querySelector("[data-create-dataset]")?.addEventListener("click", createDatasetFromStage);

  getUi().detailsNameInput?.addEventListener("input", () => {
    updateCreateDatasetButtonState();
  });

  getUi().detailsNameInput?.addEventListener("blur", () => {
    showDatasetNameValidation = true;
    updateCreateDatasetButtonState();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const { modal } = getUi();
    if (modal instanceof HTMLElement && !modal.hidden) closeCreateModal();
  });
}

function wireDatasetList() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const renameButton = target.closest("[data-dataset-rename]");
    if (renameButton instanceof HTMLButtonElement) {
      renameDataset(renameButton.dataset.datasetRename || "");
      return;
    }

    const deleteButton = target.closest("[data-dataset-delete]");
    if (deleteButton instanceof HTMLButtonElement) {
      deleteDataset(deleteButton.dataset.datasetDelete || "");
      return;
    }

    const menuToggle = target.closest("[data-dataset-menu-toggle]");
    if (menuToggle instanceof HTMLButtonElement) {
      toggleDatasetMenu(menuToggle.dataset.datasetMenuToggle || "");
      return;
    }

    const datasetSelect = target.closest("[data-dataset-select]");
    if (datasetSelect instanceof HTMLButtonElement) {
      openDatasetMenuId = "";
      selectDataset(datasetSelect.dataset.datasetSelect || "");
      return;
    }

    if (!target.closest(".dataset-card-actions")) {
      openDatasetMenuId = "";
      renderDatasetList();
    }
  });
}

function wireHomePanelToggle() {
  document.querySelectorAll("[data-show-home]").forEach((button) => {
    button.addEventListener("click", showHomePanel);
  });
}

function wireWorkspaceDetails() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const backButton = target.closest("[data-workspace-detail-back]");
    if (backButton instanceof HTMLButtonElement) {
      activeWorkspaceDetail = "";
      renderAll();
      return;
    }

    const detailTrigger = target.closest("[data-workspace-detail-trigger]");
    if (detailTrigger instanceof HTMLElement) {
      activeWorkspaceDetail = detailTrigger.dataset.workspaceDetailTrigger || "";
      renderAll();
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    const detailTrigger = target.closest("[data-workspace-detail-trigger]");
    if (!(detailTrigger instanceof HTMLElement)) return;

    event.preventDefault();
    activeWorkspaceDetail = detailTrigger.dataset.workspaceDetailTrigger || "";
    renderAll();
  });
}

function syncActiveDataset() {
  if (!datasets.length) {
    saveActiveDatasetId("");
    syncPrototypeUploadCache();
    return;
  }
  if (!datasets.some((dataset) => dataset.id === activeDatasetId)) {
    saveActiveDatasetId(datasets[0].id);
  }

  syncPrototypeUploadCache();
}

applyTheme(activeTheme);
setNavLogo(activeTheme);
setThemeToggleButton(activeTheme);
setTutorialUnlocked(localStorage.getItem(STORAGE_KEY_TUTORIAL_UNLOCKED) === "true");
syncActiveDataset();
activeMainView = getActiveDataset() ? "workspace" : "landing";
wireUploadFlow();
wireModal();
wireDatasetList();
wireHomePanelToggle();
wireWorkspaceDetails();
renderAll();

document.getElementById("toggle-theme")?.addEventListener("click", () => {
  activeTheme = activeTheme === "dark" ? "light" : "dark";
  applyTheme(activeTheme);
  saveTheme(activeTheme);
  setNavLogo(activeTheme);
  setThemeToggleButton(activeTheme);
});

document.querySelector("[data-tutorial-unlock]")?.addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEY_TUTORIAL_UNLOCKED, "true");
  setTutorialUnlocked(true);
});
