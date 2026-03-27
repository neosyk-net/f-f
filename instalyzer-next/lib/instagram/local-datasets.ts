export const LOCAL_DATASETS_STORAGE_KEY = "instalyzer_next_guest_datasets_v1";

export type DatasetEntryPoint =
  | "home-hero"
  | "home-results-preview"
  | "home-pricing-free"
  | "home-pricing-basic"
  | "home-pricing-premium"
  | "home-final-cta"
  | "help-cta"
  | "workspace-shell"
  | "datasets-index"
  | "app-home"
  | "unknown";

export type DatasetCategory =
  | "followers"
  | "following"
  | "profile"
  | "audience-insights"
  | "reach-insights"
  | "interaction-insights"
  | "zip-archive"
  | "other-json";

export type DatasetToolId =
  | "not-following-back"
  | "audience-insights"
  | "reach-summary"
  | "content-interactions";

export type DatasetToolStatus = "ready" | "partial" | "later";

export type DatasetToolAvailability = {
  id: DatasetToolId;
  title: string;
  status: DatasetToolStatus;
  note: string;
};

export type DatasetImportReview = {
  sourceLabel: string;
  fileCount: number;
  fileNames: string[];
  categoryLabels: string[];
  categoryCount: number;
  tools: DatasetToolAvailability[];
  uploadSummary: string;
  readinessNote: string;
};

export type LocalDatasetRecord = {
  id: string;
  name: string;
  notes: string;
  createdAt: string;
  createdAtMs: number;
  entryPoint: DatasetEntryPoint;
  importReview: DatasetImportReview;
};

const categoryLabels: Record<DatasetCategory, string> = {
  followers: "followers",
  following: "following",
  profile: "profile identity",
  "audience-insights": "audience insights",
  "reach-insights": "reach summary",
  "interaction-insights": "content interactions",
  "zip-archive": "zip archive",
  "other-json": "other json",
};

const entryPointLabels: Record<DatasetEntryPoint, string> = {
  "home-hero": "Homepage hero",
  "home-results-preview": "Results preview",
  "home-pricing-free": "Pricing free",
  "home-pricing-basic": "Pricing basic",
  "home-pricing-premium": "Pricing premium",
  "home-final-cta": "Final CTA",
  "help-cta": "Help page",
  "workspace-shell": "Workspace shell",
  "datasets-index": "Datasets index",
  "app-home": "App home",
  unknown: "Direct route",
};

function getFileMatchPath(file: File) {
  return (file.webkitRelativePath || file.name || "").replaceAll("\\", "/").toLowerCase();
}

function detectCategory(file: File): DatasetCategory {
  const path = getFileMatchPath(file);

  if (path.endsWith(".zip")) return "zip-archive";
  if (/followers_?\d*\.json$/i.test(path)) return "followers";
  if (/following\.json$/i.test(path)) return "following";
  if (/personal_information\/personal_information\/personal_information\.json$/i.test(path)) {
    return "profile";
  }
  if (/audience_insights\.json$/i.test(path)) return "audience-insights";
  if (/profiles_reached\.json$/i.test(path)) return "reach-insights";
  if (/content_interactions\.json$/i.test(path)) return "interaction-insights";
  if (path.endsWith(".json")) return "other-json";
  return "other-json";
}

function getSourceLabel(files: File[]) {
  const zipCount = files.filter((file) => file.name.toLowerCase().endsWith(".zip")).length;
  const hasFolderPaths = files.some((file) => Boolean(file.webkitRelativePath));

  if (zipCount > 0) {
    return zipCount === 1 ? "ZIP archive" : "ZIP archives";
  }

  if (hasFolderPaths) {
    return "Folder import";
  }

  return "Selected files";
}

function getReadinessNote(categorySet: Set<DatasetCategory>) {
  const hasRelationshipFiles =
    categorySet.has("followers") && categorySet.has("following");

  if (hasRelationshipFiles) {
    return "Relationship files were detected, so Tool 1 is ready to be ported into the native workspace flow next.";
  }

  if (categorySet.has("zip-archive")) {
    return "A ZIP archive was selected. The route-native flow is ready, but deep ZIP inspection still needs the parser extraction pass.";
  }

  return "This import can still become a reusable dataset, but the strongest relationship workflow needs both followers and following files.";
}

function getToolAvailability(categorySet: Set<DatasetCategory>): DatasetToolAvailability[] {
  const hasFollowers = categorySet.has("followers");
  const hasFollowing = categorySet.has("following");
  const hasZip = categorySet.has("zip-archive");

  return [
    {
      id: "not-following-back",
      title: "Not Following Back",
      status: hasFollowers && hasFollowing ? "ready" : hasZip ? "partial" : "later",
      note:
        hasFollowers && hasFollowing
          ? "Followers and following records were detected."
          : hasZip
            ? "Possible once the ZIP parser is extracted into the Next app."
            : "Needs both followers and following records.",
    },
    {
      id: "audience-insights",
      title: "Audience Insights",
      status: categorySet.has("audience-insights")
        ? "ready"
        : hasZip
          ? "partial"
          : "later",
      note:
        categorySet.has("audience-insights")
          ? "Audience insight summary files were detected."
          : hasZip
            ? "Likely present inside the export, pending ZIP inspection."
            : "Needs audience insight summary files.",
    },
    {
      id: "reach-summary",
      title: "Reach Summary",
      status: categorySet.has("reach-insights") ? "ready" : hasZip ? "partial" : "later",
      note:
        categorySet.has("reach-insights")
          ? "Reach summary files were detected."
          : hasZip
            ? "Likely present inside the export, pending ZIP inspection."
            : "Needs reach summary files.",
    },
    {
      id: "content-interactions",
      title: "Content Interactions",
      status: categorySet.has("interaction-insights")
        ? "ready"
        : hasZip
          ? "partial"
          : "later",
      note:
        categorySet.has("interaction-insights")
          ? "Interaction summary files were detected."
          : hasZip
            ? "Likely present inside the export, pending ZIP inspection."
            : "Needs content interaction files.",
    },
  ];
}

export function buildImportReview(files: File[]): DatasetImportReview {
  const categorySet = new Set<DatasetCategory>();

  files.forEach((file) => {
    categorySet.add(detectCategory(file));
  });

  const categoryLabelsList = Array.from(categorySet).map((category) => categoryLabels[category]);
  const uploadSummary =
    files.length === 1
      ? `${files[0].name} is staged and ready for review.`
      : `${files.length} files are staged and ready for review.`;

  return {
    sourceLabel: getSourceLabel(files),
    fileCount: files.length,
    fileNames: files.map((file) => file.webkitRelativePath || file.name),
    categoryLabels: categoryLabelsList,
    categoryCount: categoryLabelsList.length,
    tools: getToolAvailability(categorySet),
    uploadSummary,
    readinessNote: getReadinessNote(categorySet),
  };
}

export function makeDatasetId() {
  return `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getEntryPointLabel(entryPoint: DatasetEntryPoint) {
  return entryPointLabels[entryPoint] || entryPointLabels.unknown;
}

export function readLocalDatasets(): LocalDatasetRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_DATASETS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as LocalDatasetRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalDatasets(datasets: LocalDatasetRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_DATASETS_STORAGE_KEY, JSON.stringify(datasets));
}

export function saveLocalDataset(dataset: LocalDatasetRecord) {
  const current = readLocalDatasets();
  writeLocalDatasets([dataset, ...current.filter((item) => item.id !== dataset.id)]);
}

export function findLocalDataset(datasetId: string) {
  return readLocalDatasets().find((dataset) => dataset.id === datasetId) || null;
}

export function subscribeToLocalDatasets(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
