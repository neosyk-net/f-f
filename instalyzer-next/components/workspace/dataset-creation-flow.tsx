"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ChangeEvent,
  type DragEvent,
  Fragment,
  type InputHTMLAttributes,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  buildImportReview,
  makeDatasetId,
  saveLocalDataset,
  type DatasetEntryPoint,
  type DatasetToolAvailability,
} from "@/lib/instagram/local-datasets";

type CreationStep = "upload" | "review" | "setup";

const uploadSupportSections = [
  {
    title: "before you start",
    items: [
      "you may need to log into instagram first.",
      "instagram may take a few minutes to prepare your file.",
    ],
  },
  {
    title: "recommended settings",
    items: ["all available information", "all time", "JSON", "medium"],
    labels: ["customize information", "date range", "format", "media quality"],
  },
  {
    title: "common issues",
    items: [
      "no file? check email and spam.",
      "wrong format? use JSON.",
      "upload issue? use the export ZIP file.",
    ],
  },
] as const;

const entryPointValues = new Set<DatasetEntryPoint>([
  "home-hero",
  "home-results-preview",
  "home-pricing-free",
  "home-pricing-basic",
  "home-pricing-premium",
  "home-final-cta",
  "help-cta",
  "workspace-shell",
  "datasets-index",
  "app-home",
  "unknown",
]);

function getToolToneClass(tool: DatasetToolAvailability) {
  if (tool.status === "ready") return "is-ready";
  if (tool.status === "partial") return "is-partial";
  return "is-later";
}

export function DatasetCreationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<CreationStep>("upload");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [datasetName, setDatasetName] = useState("");
  const [datasetDate, setDatasetDate] = useState(new Date().toISOString().slice(0, 10));
  const [datasetNotes, setDatasetNotes] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  const entryPointParam = searchParams.get("entry") || "unknown";
  const entryPoint = entryPointValues.has(entryPointParam as DatasetEntryPoint)
    ? (entryPointParam as DatasetEntryPoint)
    : "unknown";

  const review = useMemo(
    () => (selectedFiles.length ? buildImportReview(selectedFiles) : null),
    [selectedFiles],
  );

  const canAdvance = selectedFiles.length > 0;
  const hasDatasetName = datasetName.trim().length > 0;

  const handleFiles = (nextFiles: File[]) => {
    if (!nextFiles.length) return;
    setSelectedFiles(nextFiles);
    setStep("review");
  };

  const onFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(event.target.files || []));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(event.dataTransfer.files || []));
  };

  const resetImport = () => {
    setSelectedFiles([]);
    setStep("upload");
    if (filesInputRef.current) filesInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const createDataset = () => {
    setNameTouched(true);

    if (!review || !hasDatasetName) {
      return;
    }

    const datasetId = makeDatasetId();

    saveLocalDataset({
      id: datasetId,
      name: datasetName.trim(),
      notes: datasetNotes.trim(),
      createdAt: datasetDate,
      createdAtMs: Date.parse(`${datasetDate}T00:00:00`),
      entryPoint,
      importReview: review,
    });

    startTransition(() => {
      router.push(`/app/datasets/${datasetId}`);
    });
  };

  return (
    <section className="dataset-flow" aria-labelledby="dataset-flow-title">
      <div className="dataset-flow__hero">
        <div className="section-intro dataset-flow__hero-copy">
          <p className="section-kicker">create dataset</p>
          <h1 id="dataset-flow-title" className="section-title dataset-flow__hero-title">
            turn your export into a reusable dataset
          </h1>
          <p className="section-copy dataset-flow__description">
            upload your instagram export, review what we detected, and create a reusable dataset.
          </p>
        </div>
      </div>

      <div className="dataset-flow__steps" aria-label="Dataset creation steps">
        {[
          { key: "upload", label: "upload" },
          { key: "review", label: "review" },
          { key: "setup", label: "setup" },
        ].map((item, index, items) => (
          <Fragment key={item.key}>
            <button
              type="button"
              className={`dataset-flow__step${step === item.key ? " is-active" : ""}`}
              disabled={
                item.key === "review"
                  ? !canAdvance
                  : item.key === "setup"
                    ? !review
                    : false
              }
              onClick={() => setStep(item.key as CreationStep)}
            >
              {item.label}
            </button>

            {index < items.length - 1 ? (
              <span className="dataset-flow__step-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>

      <div className={`dataset-flow__grid${step === "upload" ? " is-upload-step" : ""}`}>
        {step === "upload" ? (
          <>
            <article className="dataset-flow__panel dataset-flow__panel--primary">
              <div className="dataset-flow__stage">
                <div className="dataset-flow__copy">
                  <p className="dataset-flow__kicker">step 1</p>
                  <h2>upload your export</h2>
                  <p>
                    Choose the Instagram export ZIP or a set of extracted JSON files to
                    start the dataset flow. For relationship tools, JSON and all-time
                    exports are still the safest direction.
                  </p>
                </div>

                <input
                  ref={filesInputRef}
                  type="file"
                  multiple
                  hidden
                  accept=".json,.zip,application/json,application/zip"
                  onChange={onFilesChange}
                />

                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={onFilesChange}
                  {...({
                    webkitdirectory: "",
                    directory: "",
                  } as InputHTMLAttributes<HTMLInputElement>)}
                />

                <div
                  className={`dataset-dropzone${isDragging ? " is-dragging" : ""}`}
                  role="button"
                  tabIndex={0}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={onDrop}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    filesInputRef.current?.click();
                  }}
                  onClick={() => filesInputRef.current?.click()}
                >
                  <div className="dataset-dropzone__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 4v11" />
                      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
                      <path d="M5 19h14" />
                    </svg>
                  </div>
                  <h3>upload your instagram export</h3>
                  <p>
                    drag and drop your ZIP or choose files to begin.
                  </p>

                  <div className="dataset-dropzone__actions">
                    <button
                      type="button"
                      className="hero-btn hero-btn-primary"
                      onClick={(event) => {
                        event.stopPropagation();
                        filesInputRef.current?.click();
                      }}
                    >
                      choose export
                    </button>
                    <button
                      type="button"
                      className="hero-btn hero-btn-secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        folderInputRef.current?.click();
                      }}
                    >
                      choose folder
                    </button>
                  </div>

                  <p className="dataset-dropzone__reassurance">
                    no instagram login. review before create.
                  </p>

                  <div className="dataset-dropzone__trust-row" aria-label="Trust notes">
                    <span>no instagram login</span>
                    <span>review before create</span>
                    <span>private export workflow</span>
                  </div>
                </div>
              </div>
            </article>

            <aside className="dataset-flow__side dataset-flow__side--upload">
              <p className="guide-side-stack-label dataset-upload-tips-label">quick tips</p>

              <div className="guide-side-card guide-side-card-v2 guide-side-card-unified dataset-upload-tips-card">
                {uploadSupportSections.map((section) => (
                  <div key={section.title} className="guide-side-section">
                    <div className="guide-side-section-head">
                      <h4 className="guide-side-section-title">{section.title}</h4>
                    </div>

                    <ul className="guide-side-list">
                      {section.items.map((item, index) => (
                        <li key={item}>
                          {"labels" in section && section.labels?.[index] ? (
                            <>
                              <strong>{section.labels[index]}:</strong> {item}
                            </>
                          ) : (
                            item
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </aside>
          </>
        ) : (
          <article className="dataset-flow__panel">
            {step === "review" && review ? (
              <div className="dataset-flow__stage">
                <div className="dataset-flow__copy">
                  <p className="dataset-flow__kicker">step 2</p>
                  <h2>review the import</h2>
                  <p>{review.uploadSummary}</p>
                </div>

                <div className="dataset-review-grid">
                  <article className="dataset-review-card dataset-review-card--primary">
                    <p className="dataset-review-card__label">import summary</p>
                    <div className="dataset-review-card__metrics">
                      <div>
                        <span>source</span>
                        <strong>{review.sourceLabel}</strong>
                      </div>
                      <div>
                        <span>files staged</span>
                        <strong>{review.fileCount}</strong>
                      </div>
                      <div>
                        <span>categories detected</span>
                        <strong>{review.categoryCount}</strong>
                      </div>
                    </div>
                    <p className="dataset-review-card__note">{review.readinessNote}</p>
                  </article>

                  <article className="dataset-review-card">
                    <p className="dataset-review-card__label">available tools</p>
                    <div className="dataset-tool-list">
                      {review.tools.map((tool) => (
                        <article
                          key={tool.id}
                          className={`dataset-tool-pill ${getToolToneClass(tool)}`}
                        >
                          <div>
                            <strong>{tool.title}</strong>
                            <p>{tool.note}</p>
                          </div>
                          <span>{tool.status}</span>
                        </article>
                      ))}
                    </div>
                  </article>

                  <article className="dataset-review-card">
                    <p className="dataset-review-card__label">detected categories</p>
                    <div className="dataset-chip-row">
                      {review.categoryLabels.length ? (
                        review.categoryLabels.map((label) => (
                          <span key={label} className="dataset-chip">
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="dataset-chip">waiting on deeper parser extraction</span>
                      )}
                    </div>
                  </article>

                  <article className="dataset-review-card">
                    <p className="dataset-review-card__label">staged files</p>
                    <ul className="dataset-file-list">
                      {review.fileNames.slice(0, 8).map((fileName) => (
                        <li key={fileName}>{fileName}</li>
                      ))}
                    </ul>
                    {review.fileNames.length > 8 ? (
                      <p className="dataset-review-card__note">
                        +{review.fileNames.length - 8} more files staged
                      </p>
                    ) : null}
                  </article>
                </div>

                <div className="dataset-flow__footer">
                  <button
                    type="button"
                    className="hero-btn hero-btn-secondary"
                    onClick={() => setStep("upload")}
                  >
                    back
                  </button>
                  <button
                    type="button"
                    className="hero-btn hero-btn-primary"
                    onClick={() => setStep("setup")}
                  >
                    setup
                  </button>
                </div>
              </div>
            ) : null}

            {step === "setup" && review ? (
              <div className="dataset-flow__stage">
                <div className="dataset-flow__copy">
                  <p className="dataset-flow__kicker">step 3</p>
                  <h2>name the dataset</h2>
                  <p>
                    Keep the setup step simple for now: give the dataset a name, set
                    the import date, and add notes if you want context for later.
                  </p>
                </div>

                <div className="dataset-setup-form">
                  <label className="dataset-field">
                    <span>dataset name</span>
                    <input
                      type="text"
                      maxLength={60}
                      value={datasetName}
                      onChange={(event) => setDatasetName(event.target.value)}
                      onBlur={() => setNameTouched(true)}
                      placeholder="march instagram export"
                    />
                    {nameTouched && !hasDatasetName ? (
                      <small className="dataset-field__error">
                        enter a dataset name to continue
                      </small>
                    ) : null}
                  </label>

                  <label className="dataset-field">
                    <span>dataset date</span>
                    <input
                      type="date"
                      value={datasetDate}
                      onChange={(event) => setDatasetDate(event.target.value)}
                    />
                  </label>

                  <label className="dataset-field">
                    <span>notes</span>
                    <textarea
                      rows={4}
                      value={datasetNotes}
                      onChange={(event) => setDatasetNotes(event.target.value)}
                      placeholder="All-time export from the main account. Good candidate for Tool 1 and insight-summary checks."
                    />
                  </label>
                </div>

                <div className="dataset-flow__footer">
                  <button
                    type="button"
                    className="hero-btn hero-btn-secondary"
                    onClick={() => setStep("review")}
                  >
                    back
                  </button>
                  <button
                    type="button"
                    className="hero-btn hero-btn-primary"
                    onClick={createDataset}
                    disabled={!hasDatasetName || isPending}
                  >
                    {isPending ? "creating..." : "create dataset"}
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        )}

        {step === "upload" ? null : (
          <aside className="dataset-flow__side">
            <article className="dataset-side-card">
              <p className="dataset-side-card__label">recommended settings</p>
              <ul className="dataset-trust-list">
                <li>customize information</li>
                <li>all time for relationship tools</li>
                <li>JSON format</li>
                <li>medium media quality</li>
              </ul>
            </article>

            <article className="dataset-side-card">
              <p className="dataset-side-card__label">quick note</p>
              <p>
                ZIP uploads are accepted now. Deeper archive parsing is still being
                tightened as the native parser work continues.
              </p>
            </article>

            <article className="dataset-side-card">
              <p className="dataset-side-card__label">quick links</p>
              <div className="route-links">
                <Link href="/help" className="route-link">
                  export help
                </Link>
                <Link href="/app/datasets" className="route-link">
                  datasets
                </Link>
                <button type="button" className="route-link" onClick={resetImport}>
                  reset
                </button>
              </div>
            </article>
          </aside>
        )}
      </div>
    </section>
  );
}
