"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getEntryPointLabel,
  readLocalDatasets,
  subscribeToLocalDatasets,
} from "@/lib/instagram/local-datasets";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DatasetsIndexRoute() {
  const datasets = useSyncExternalStore(
    subscribeToLocalDatasets,
    readLocalDatasets,
    () => [],
  );

  return (
    <section className="dataset-index" aria-labelledby="dataset-index-title">
      <div className="dataset-index__hero">
        <span className="route-badge route-badge--workspace">workspace route</span>
        <p className="route-path">/app/datasets</p>
        <h1 id="dataset-index-title">datasets</h1>
        <p className="dataset-index__description">
          Reusable Instagram imports live here. Each dataset becomes the anchor for
          the workspace and every tool we add next.
        </p>
      </div>

      <div className="dataset-index__actions">
        <Link href="/app/datasets/new?entry=datasets-index" className="hero-btn hero-btn-primary">
          create dataset
        </Link>
      </div>

      {datasets.length ? (
        <div className="dataset-index__grid">
          {datasets.map((dataset) => (
            <article key={dataset.id} className="dataset-card">
              <div className="dataset-card__head">
                <div>
                  <p className="dataset-card__eyebrow">{getEntryPointLabel(dataset.entryPoint)}</p>
                  <h2>{dataset.name}</h2>
                </div>
                <span className="dataset-chip">{dataset.importReview.sourceLabel}</span>
              </div>

              <p className="dataset-card__copy">{dataset.importReview.uploadSummary}</p>

              <div className="dataset-card__metrics">
                <div>
                  <span>created</span>
                  <strong>{formatDate(dataset.createdAt)}</strong>
                </div>
                <div>
                  <span>files</span>
                  <strong>{dataset.importReview.fileCount}</strong>
                </div>
                <div>
                  <span>categories</span>
                  <strong>{dataset.importReview.categoryCount}</strong>
                </div>
              </div>

              <div className="dataset-chip-row">
                {dataset.importReview.categoryLabels.map((label) => (
                  <span key={label} className="dataset-chip">
                    {label}
                  </span>
                ))}
              </div>

              <div className="route-links">
                <Link href={`/app/datasets/${dataset.id}`} className="route-link">
                  open workspace
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="dataset-card dataset-card--empty">
          <h2>No datasets yet</h2>
          <p>
            Start with the new 3-step import flow, then we can build the fuller
            workspace and native Tool 1 on top of those saved datasets.
          </p>
          <div className="route-links">
            <Link href="/app/datasets/new?entry=datasets-index" className="route-link">
              create your first dataset
            </Link>
            <Link href="/help" className="route-link">
              open export help
            </Link>
          </div>
        </article>
      )}
    </section>
  );
}
