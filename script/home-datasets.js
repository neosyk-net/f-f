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

function makeDatasetId() {
  return `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function extractEntries(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

function getUi() {
  return {
    datasetList: document.querySelector("[data-dataset-list]"),
    datasetCount: document.querySelector("[data-dataset-count]"),
    datasetLimitCopy: document.querySelector("[data-dataset-limit-copy]"),
    landingView: document.querySelector("[data-landing-view]"),
    workspaceView: document.querySelector("[data-workspace-view]"),
    toolsPanel: document.querySelector("[data-tools-panel]"),
    workspaceDatasetName: document.querySelector("[data-workspace-dataset-name]"),
    workspaceDatasetDate: document.querySelector("[data-workspace-dataset-date]"),
    workspaceFollowers: document.querySelector("[data-workspace-followers]"),
    workspaceFollowing: document.querySelector("[data-workspace-following]"),
    workspaceCategories: document.querySelector("[data-workspace-categories]"),
    workspaceSource: document.querySelector("[data-workspace-source]"),
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
    const button = document.createElement("button");
    button.type = "button";
    button.className = `dataset-card${dataset.id === activeDatasetId ? " is-active" : ""}`;
    button.dataset.datasetId = dataset.id;
    button.innerHTML = `
      <h3 class="dataset-card-title">${dataset.name}</h3>
    `;
    datasetList.appendChild(button);
  }
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
  if (ui.workspaceFollowers) ui.workspaceFollowers.textContent = formatCount(active.meta?.followerEntryCount);
  if (ui.workspaceFollowing) ui.workspaceFollowing.textContent = formatCount(active.meta?.followingEntryCount);
  if (ui.workspaceCategories) ui.workspaceCategories.textContent = formatCount(active.meta?.categoryCounts?.length);
  if (ui.workspaceSource) ui.workspaceSource.textContent = active.meta?.sourceLabel || "not detected";
}

function renderAll() {
  updateGuestLimitUi();
  renderDatasetList();
  renderActiveDataset();
}

function showHomePanel() {
  activeMainView = "landing";
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
  for (const file of jsonFiles) {
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      continue;
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

  renderStagedUpload(buildUploadPayload(followerMatches, followingMatches, {
    sourceLabel,
    detectedDataLabel,
    scannedJsonCount: jsonFiles.length,
    ignoredJsonCount,
    categoryCounts: [...categoryCounts.entries()]
  }));
  setUploadStatus("Upload ready. Review the summary below, then continue to dataset details.", "success");
}

function selectDataset(id) {
  saveActiveDatasetId(id);
  activeMainView = "workspace";
  renderAll();
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
    const datasetCard = target.closest("[data-dataset-id]");
    if (!(datasetCard instanceof HTMLButtonElement)) return;
    selectDataset(datasetCard.dataset.datasetId || "");
  });
}

function wireHomePanelToggle() {
  document.querySelectorAll("[data-show-home]").forEach((button) => {
    button.addEventListener("click", showHomePanel);
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
