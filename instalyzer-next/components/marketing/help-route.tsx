"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const guideTabs = [
  { key: "quick-steps", title: "quick guide", copy: "written guide" },
  { key: "visual-guide", title: "visual guide", copy: "image flow" },
] as const;

const quickSteps = [
  {
    title: "open your instagram profile",
    copy: (
      <>
        Log into <strong>Instagram</strong> on desktop and open your profile.
      </>
    ),
  },
  {
    title: "go to settings",
    copy: (
      <>
        Open the menu, then go to <strong>Settings</strong> and{" "}
        <strong>Accounts Center</strong>.
      </>
    ),
  },
  {
    title: "open your information and permissions",
    copy: (
      <>
        Find the section where Instagram lets you manage and{" "}
        <strong>download your data</strong>.
      </>
    ),
  },
  {
    title: "select download your information",
    copy: (
      <>
        Choose the option to request your <strong>Instagram export</strong>.
      </>
    ),
  },
  {
    title: "choose recommended settings",
    copy: (
      <>
        Use these recommended settings:{" "}
        <strong>Customize information</strong>, <strong>All time</strong>,{" "}
        <strong>JSON</strong>, and <strong>Medium</strong>.
      </>
    ),
    accented: true,
  },
  {
    title: "download the ZIP and upload it",
    copy: (
      <>
        When your file is ready, download the <strong>ZIP</strong> and come back
        to <strong> Instalyzer</strong> to upload it.
      </>
    ),
  },
] as const;

const visualSteps = [
  {
    image: "/assets/image-flow/img-step1.JPG",
    alt: "Instagram profile page.",
    title: "menu",
    copy: (
      <>
        from your <strong>instagram profile page</strong>, tap the{" "}
        <strong>menu button</strong> to open <strong>settings</strong>.
      </>
    ),
    overlayPosition: "top-right",
  },
  {
    image: "/assets/image-flow/img-step2.JPG",
    alt: "Instagram menu with settings entry.",
    title: "settings",
    copy: (
      <>
        from the menu, tap <strong>settings</strong> to move into your{" "}
        <strong>accounts center</strong> flow.
      </>
    ),
    overlayPosition: "top-right",
  },
  {
    image: "/assets/image-flow/img-step3.JPG",
    alt: "Instagram settings area leading into Accounts Center.",
    title: "accounts center",
    copy: (
      <>
        from <strong>settings</strong>, open <strong>accounts center</strong> so
        you can continue into <strong>information and permissions</strong>.
      </>
    ),
    overlayPosition: "bottom-right",
  },
  {
    image: "/assets/image-flow/img-step4.JPG",
    alt: "Accounts Center screen.",
    title: "information and permissions",
    copy: (
      <>
        from <strong>account center</strong>, open{" "}
        <strong>info and permissions</strong> to export your{" "}
        <strong>information</strong>.
      </>
    ),
    overlayPosition: "top-right",
  },
  {
    image: "/assets/image-flow/img-step5.JPG",
    alt: "Accounts Center area showing your information and permissions.",
    title: "export your information",
    copy: (
      <>
        this is where you <strong>export your information</strong> and move into{" "}
        <strong>creating your export</strong>.
      </>
    ),
    overlayPosition: "bottom-right",
  },
  {
    image: "/assets/image-flow/img-step6.JPG",
    alt: "Download your information options inside Accounts Center.",
    title: "create export",
    copy: (
      <>
        create your <strong>export</strong>, which will lead into choosing which{" "}
        <strong>account information</strong> you want to export.
      </>
    ),
    overlayPosition: "bottom-right",
  },
  {
    image: "/assets/image-flow/img-step7.JPG",
    alt: "Instagram export request flow.",
    title: "choose a profile",
    copy: (
      <>
        choose a <strong>profile</strong>, which will lead to where you want your{" "}
        <strong>export</strong> to go.
      </>
    ),
    overlayPosition: "bottom-right",
  },
  {
    image: "/assets/image-flow/img-step8.JPG",
    alt: "Instagram export settings screen.",
    title: "export to device",
    copy: (
      <>
        choose <strong>export to device</strong>, which will lead into setting
        your <strong>export options</strong>.
      </>
    ),
    overlayPosition: "bottom-right",
  },
  {
    image: "/assets/image-flow/img-step9.JPG",
    alt: "Instagram export settings with JSON format highlighted.",
    title: "start export",
    copy: (
      <>
        with the <strong>recommended settings</strong>, start your{" "}
        <strong>export</strong>.
      </>
    ),
    overlayPosition: "top-right",
  },
  {
    image: "/assets/image-flow/img-step10.JPG",
    alt: "Instagram export settings with All time and Medium media quality selected.",
    title: "wait for your export",
    copy: (
      <>
        your <strong>export</strong> may take longer depending on your{" "}
        <strong>account</strong> and how much <strong>information</strong> is
        being prepared.
      </>
    ),
    overlayPosition: "top-right",
  },
  {
    image: "/assets/image-flow/img-step11.JPG",
    alt: "Downloaded Instagram ZIP ready to upload back into Instalyzer.",
    title: "download the zip",
    copy: (
      <>
        download the <strong>zip</strong>, then come back to{" "}
        <strong>instalyzer</strong> to upload it and create your{" "}
        <strong>dataset</strong>.
      </>
    ),
    overlayPosition: "top-right",
  },
] as const;

const sideSections = [
  {
    title: "before you start",
    items: [
      "You may need to log into Instagram first.",
      "Instagram may take a few minutes to prepare your file.",
    ],
    instagramLink: true,
  },
  {
    title: "recommended settings",
    items: [
      "All available information",
      "All time",
      "JSON",
      "Medium",
    ],
    labels: [
      "Customize information",
      "Date range",
      "Format",
      "Media quality",
    ],
  },
  {
    title: "common issues",
    items: [
      "No file? Check email and spam.",
      "Wrong format? Use JSON.",
      "Upload issue? Use the export ZIP file.",
    ],
  },
] as const;

export function HelpRoute() {
  const [activeTab, setActiveTab] = useState<(typeof guideTabs)[number]["key"]>(
    "quick-steps",
  );
  const [activeVisualIndex, setActiveVisualIndex] = useState(0);

  const activeVisualStep = visualSteps[activeVisualIndex];

  const activateVisualStep = (nextIndex: number) => {
    const count = visualSteps.length;
    setActiveVisualIndex((nextIndex + count) % count);
  };

  return (
    <main className="guide-shell guide-shell-v2">
      <section className="guide-layout" aria-label="Instagram export guide">
        <div className="guide-main-column">
          <div className="guide-workbench">
            <aside className="guide-tabs-rail" aria-label="Guide modes">
              <p className="guide-tabs-rail-label">guide modes</p>

              <div
                className="guide-tab-list guide-tab-list-vertical"
                role="tablist"
                aria-label="Guide content tabs"
              >
                {guideTabs.map((tab, index) => {
                  const active = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      className={`guide-tab-button${active ? " is-active" : ""}`}
                      role="tab"
                      aria-selected={active}
                      aria-controls={`guide-panel-${tab.key}`}
                      id={`guide-tab-${tab.key}`}
                      tabIndex={active ? 0 : -1}
                      onClick={() => setActiveTab(tab.key)}
                      onKeyDown={(event) => {
                        if (
                          ![
                            "ArrowRight",
                            "ArrowLeft",
                            "ArrowDown",
                            "ArrowUp",
                            "Home",
                            "End",
                          ].includes(event.key)
                        ) {
                          return;
                        }

                        event.preventDefault();

                        if (event.key === "Home") {
                          setActiveTab(guideTabs[0].key);
                          return;
                        }

                        if (event.key === "End") {
                          setActiveTab(guideTabs[guideTabs.length - 1].key);
                          return;
                        }

                        const direction =
                          event.key === "ArrowRight" || event.key === "ArrowDown"
                            ? 1
                            : -1;
                        const nextTab =
                          guideTabs[
                            (index + direction + guideTabs.length) % guideTabs.length
                          ];
                        setActiveTab(nextTab.key);
                      }}
                    >
                      <span className="guide-tab-button-title">{tab.title}</span>
                      <span className="guide-tab-button-copy">{tab.copy}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="guide-tabs-shell" aria-labelledby="guide-help-title">
              <div className="guide-tabs-content">
                <div className="guide-tabs-head">
                  <div className="guide-tabs-header-main">
                    <p className="section-kicker">help center</p>
                    <div className="guide-tabs-title-row">
                      <div className="guide-tabs-title-copy">
                        <h1
                          id="guide-help-title"
                          className="guide-panel-title guide-panel-title-page"
                        >
                          download your instagram data
                        </h1>
                      </div>
                    </div>
                    <p className="guide-panel-copy">
                      follow the steps below, then upload your export into
                      Instalyzer.
                    </p>
                  </div>
                </div>

                <section
                  className={`guide-tab-panel${activeTab === "quick-steps" ? " is-active" : ""}`}
                  role="tabpanel"
                  id="guide-panel-quick-steps"
                  aria-labelledby="guide-tab-quick-steps"
                  hidden={activeTab !== "quick-steps"}
                >
                  <h3 className="guide-panel-mode-title">quick guide</h3>

                  <div className="guide-step-surface">
                    <ol className="guide-step-grid">
                      {quickSteps.map((step, index) => (
                        <li
                          key={step.title}
                          className={`guide-step-card-v2${step.accented ? " is-accented" : ""}`}
                        >
                          <span className="guide-step-number-v2">
                            <span className="guide-step-number-leading">0</span>
                            <span className="guide-step-number-accent">
                              {index + 1}
                            </span>
                          </span>
                          <h4 className="guide-step-title-v2">{step.title}</h4>
                          <p className="guide-step-copy-v2">{step.copy}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </section>

                <section
                  className={`guide-tab-panel${activeTab === "visual-guide" ? " is-active" : ""}`}
                  role="tabpanel"
                  id="guide-panel-visual-guide"
                  aria-labelledby="guide-tab-visual-guide"
                  hidden={activeTab !== "visual-guide"}
                >
                  <h3 className="guide-panel-mode-title">visual guide</h3>

                  <div className="guide-visual-stage">
                    <div
                      className="guide-visual-display"
                      tabIndex={0}
                      role="region"
                      aria-label="Visual guide carousel"
                      aria-describedby="guide-visual-keyboard-help guide-visual-step-announcer"
                      onKeyDown={(event) => {
                        if (event.key === "ArrowLeft") {
                          event.preventDefault();
                          activateVisualStep(activeVisualIndex - 1);
                        } else if (event.key === "ArrowRight") {
                          event.preventDefault();
                          activateVisualStep(activeVisualIndex + 1);
                        } else if (event.key === "Home") {
                          event.preventDefault();
                          activateVisualStep(0);
                        } else if (event.key === "End") {
                          event.preventDefault();
                          activateVisualStep(visualSteps.length - 1);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="guide-visual-arrow guide-visual-arrow-prev"
                        aria-label="Previous visual step"
                        onClick={() => activateVisualStep(activeVisualIndex - 1)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>

                      {visualSteps.map((step, index) => {
                        const active = index === activeVisualIndex;

                        return (
                          <div
                            key={step.image}
                            className={`guide-visual-card${active ? " is-active" : " is-exiting"}`}
                            aria-hidden={!active}
                          >
                            <figure className="guide-visual-figure">
                              <Image
                                src={step.image}
                                alt={step.alt}
                                className="guide-visual-image"
                                width={900}
                                height={675}
                                priority={index === 0}
                              />
                              <figcaption
                                className={`guide-visual-overlay guide-visual-overlay-${step.overlayPosition}`}
                                hidden={!active}
                              >
                                <p className="guide-visual-overlay-kicker">
                                  step focus
                                </p>
                                <h4 className="guide-visual-title">{step.title}</h4>
                                <p className="guide-visual-copy">{step.copy}</p>
                              </figcaption>
                            </figure>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        className="guide-visual-arrow guide-visual-arrow-next"
                        aria-label="Next visual step"
                        onClick={() => activateVisualStep(activeVisualIndex + 1)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                      </button>
                    </div>

                    <div className="guide-visual-meta">
                      <p className="guide-visual-stepline">
                        Step {activeVisualIndex + 1} of {visualSteps.length}
                      </p>
                    </div>

                    <p id="guide-visual-keyboard-help" className="visually-hidden">
                      Use left and right arrow keys to move through the visual
                      guide. Use Home to jump to the first step and End to jump to
                      the last step.
                    </p>
                    <p
                      id="guide-visual-step-announcer"
                      className="visually-hidden"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      Step {activeVisualIndex + 1} of {visualSteps.length}.{" "}
                      {activeVisualStep.title}.
                    </p>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </div>

        <aside className="guide-side-stack guide-side-stack-v2">
          <p className="guide-side-stack-label">quick tips</p>

          <div className="guide-side-card guide-side-card-v2 guide-side-card-unified">
            {sideSections.map((section) => (
              <div key={section.title} className="guide-side-section">
                <div className="guide-side-section-head">
                  <h4 className="guide-side-section-title">{section.title}</h4>

                  {section.instagramLink ? (
                    <a
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="guide-inline-instagram-btn"
                      aria-label="Open Instagram"
                      title="Open Instagram"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                        <circle cx="12" cy="12" r="4" />
                        <circle cx="17.6" cy="6.4" r="1" />
                      </svg>
                    </a>
                  ) : null}
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

          <div className="guide-side-cta">
            <Link
              href="/app/datasets/new?entry=help-cta"
              className="hero-btn hero-btn-primary guide-primary-cta-btn guide-side-cta-btn"
            >
              instalyze your data
            </Link>
            <p className="guide-primary-cta-note guide-side-cta-note">
              your data stays private and secure.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
