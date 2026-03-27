"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  findLocalDataset,
  getEntryPointLabel,
  readLocalDatasets,
  subscribeToLocalDatasets,
} from "@/lib/instagram/local-datasets";

type DatasetWorkspaceRouteProps = {
  datasetId: string;
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DatasetWorkspaceRoute({ datasetId }: DatasetWorkspaceRouteProps) {
  const datasets = useSyncExternalStore(
    subscribeToLocalDatasets,
    readLocalDatasets,
    () => [],
  );
  const dataset = datasets.find((item) => item.id === datasetId) || findLocalDataset(datasetId);

  if (!dataset) {
    return (
      <section className="dataset-workspace">
        <article className="dataset-card dataset-card--empty">
          <h1>dataset not found</h1>
          <p>
            This workspace route is wired, but there is no saved local dataset for
            <code> {datasetId}</code> right now.
          </p>
          <div className="route-links">
            <Link href="/app/datasets" className="route-link">
              back to datasets
            </Link>
            <Link href="/app/datasets/new?entry=workspace-shell" className="route-link">
              create dataset
            </Link>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="dataset-workspace" aria-labelledby="dataset-workspace-title">
      <div className="dataset-workspace__hero">
        <div>
          <span className="route-badge route-badge--workspace">dataset workspace</span>
          <p className="route-path">/app/datasets/{dataset.id}</p>
          <h1 id="dataset-workspace-title">{dataset.name}</h1>
          <p className="dataset-workspace__description">
            This is the first real handoff after dataset creation: identity, import
            context, and tool readiness all live here before we deepen the native tool
            routes.
          </p>
        </div>

        <div className="dataset-chip-row">
          <span className="dataset-chip">{dataset.importReview.sourceLabel}</span>
          <span className="dataset-chip">{getEntryPointLabel(dataset.entryPoint)}</span>
        </div>
      </div>

      <div className="dataset-workspace__grid">
        <article className="dataset-card">
          <p className="dataset-card__eyebrow">overview</p>
          <div className="dataset-card__metrics">
            <div>
              <span>created</span>
              <strong>{formatDate(dataset.createdAt)}</strong>
            </div>
            <div>
              <span>files staged</span>
              <strong>{dataset.importReview.fileCount}</strong>
            </div>
            <div>
              <span>categories</span>
              <strong>{dataset.importReview.categoryCount}</strong>
            </div>
            <div>
              <span>tools surfaced</span>
              <strong>{dataset.importReview.tools.length}</strong>
            </div>
          </div>

          {dataset.notes ? (
            <p className="dataset-card__copy">Notes: {dataset.notes}</p>
          ) : (
            <p className="dataset-card__copy">
              No notes yet. This route is ready for richer dataset metadata next.
            </p>
          )}
        </article>

        <article className="dataset-card">
          <p className="dataset-card__eyebrow">detected categories</p>
          <div className="dataset-chip-row">
            {dataset.importReview.categoryLabels.map((label) => (
              <span key={label} className="dataset-chip">
                {label}
              </span>
            ))}
          </div>
          <p className="dataset-card__copy">{dataset.importReview.readinessNote}</p>
        </article>

        <article className="dataset-card dataset-card--full">
          <p className="dataset-card__eyebrow">available tools</p>
          <div className="dataset-tool-list">
            {dataset.importReview.tools.map((tool) => (
              <article key={tool.id} className="dataset-tool-pill is-workspace">
                <div>
                  <strong>{tool.title}</strong>
                  <p>{tool.note}</p>
                </div>
                {tool.id === "not-following-back" ? (
                  <Link
                    href={`/app/datasets/${dataset.id}/tools/not-following-back`}
                    className="route-link"
                  >
                    open
                  </Link>
                ) : (
                  <span className="dataset-tool-pill__status">{tool.status}</span>
                )}
              </article>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
