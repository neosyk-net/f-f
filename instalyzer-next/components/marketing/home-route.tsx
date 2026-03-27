import { Fragment } from "react";
import Link from "next/link";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { HeroScrollLink } from "@/components/marketing/hero-scroll-link";
import { MarketingScrollReveal } from "@/components/marketing/marketing-scroll-reveal";

const toolTiers = [
  {
    tierClassName: "tier-column-free",
    label: "free",
    tools: [
      {
        title: "not following back",
        copy: "See which accounts don't follow you back.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 15c2.2 0 3.8-1.8 6-1.8S15.8 15 18 15" />
            <path d="M4 6h16" />
            <path d="M8 6v12" />
            <path d="M16 6v12" />
          </svg>
        ),
      },
      {
        title: "export overview",
        copy: "Quick summary of your dataset.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7h10" />
            <path d="M7 12h10" />
            <path d="M7 17h10" />
            <path d="M5 7h.01" />
            <path d="M5 12h.01" />
            <path d="M5 17h.01" />
          </svg>
        ),
      },
      {
        title: "visibility snapshot",
        copy: "Instant read on account visibility signals.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        ),
      },
    ],
  },
  {
    tierClassName: "tier-column-basic",
    label: "basic",
    tools: [
      {
        title: "ghost followers",
        copy: "Spot followers who never interact.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
            <circle cx="12" cy="12" r="8" />
          </svg>
        ),
      },
      {
        title: "activity insights",
        copy: "Understand engagement across your posts.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 17 9 13l3 3 7-8" />
            <path d="M5 5v12h14" />
          </svg>
        ),
      },
      {
        title: "audience insights",
        copy: "Track follower movement and growth.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4a8 8 0 1 0 8 8" />
            <path d="M12 4v8h8" />
          </svg>
        ),
      },
    ],
  },
  {
    tierClassName: "tier-column-premium",
    label: "premium",
    tools: [
      {
        title: "growth summary",
        copy: "Track follower growth trends.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 18V9" />
            <path d="M12 18V5" />
            <path d="M18 18v-6" />
          </svg>
        ),
      },
      {
        title: "visibility summary",
        copy: "Understand reach and impressions.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        ),
      },
      {
        title: "engagement summary",
        copy: "Measure overall interaction performance.",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v16" />
            <path d="M4 12h16" />
            <path d="M7 7l10 10" />
          </svg>
        ),
      },
    ],
  },
] as const;

const howItWorksSteps = [
  {
    step: "step 1",
    title: "upload your export",
    copy: "download your instagram data and upload the export file.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v11" />
        <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
        <path d="M5 19h14" />
      </svg>
    ),
  },
  {
    step: "step 2",
    title: "we analyze your network",
    copy: "instalyzer processes your followers, following, and engagement signals.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 18h14" />
        <path d="M7 15V9" />
        <path d="M12 15V6" />
        <path d="M17 15v-4" />
        <path d="M8 8h10" />
      </svg>
    ),
  },
  {
    step: "step 3",
    title: "get powerful insights",
    copy: "see ghost followers, unfollows, and growth signals instantly.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 18V8" />
        <path d="M5 18h14" />
        <path d="m8 14 3-3 3 2 4-5" />
        <circle cx="18" cy="8" r="1.5" />
      </svg>
    ),
  },
] as const;

const resultsPreviewMetrics = [
  { label: "followers", value: 2184 },
  { label: "accounts reached", value: 12430 },
  { label: "profile visits", value: 1287 },
  { label: "content interactions", value: 436 },
  { label: "impressions", value: 48920 },
  { label: "accounts engaged", value: 823 },
] as const;

const resultsPreviewPills = [
  { label: "not following back", className: "is-free" },
  { label: "ghost followers", className: "is-basic" },
  { label: "activity insights", className: "is-basic" },
  { label: "growth summary", className: "is-premium" },
] as const;

const pricingPlans = [
  {
    cardClassName: "pricing-card-free",
    tier: "free",
    price: "$0",
    billingLabel: null,
    copy:
      "start with the core relationship workflow and preview what your export can unlock.",
    features: ["not following back", "export overview", "visibility snapshot"],
    ctaLabel: "start free",
    ctaClassName: "",
    badge: null,
  },
  {
    cardClassName: "pricing-card-basic",
    tier: "basic",
    price: "$3.99",
    billingLabel: "/ month",
    copy:
      "unlock the most useful creator tools in one lightweight monthly plan.",
    features: ["ghost followers", "activity insights", "audience insights"],
    ctaLabel: "upgrade to basic",
    ctaClassName: "pricing-card-btn-featured",
    badge: "most popular",
    featured: true,
  },
  {
    cardClassName: "pricing-card-premium",
    tier: "premium",
    price: "$7.99",
    billingLabel: "/ month",
    copy:
      "go deeper with premium summary tools and the most polished reporting layer.",
    features: ["growth summary", "visibility summary", "engagement summary"],
    ctaLabel: "unlock premium",
    ctaClassName: "pricing-card-btn-premium",
    badge: null,
  },
] as const;

const faqColumns = [
  [
    {
      question: "how do i download my data?",
      answer:
        "request your export from instagram in your account settings. once downloaded, upload the zip file here to start analyzing your data.",
      startsOpen: true,
    },
    {
      question: "is my data stored on your servers?",
      answer:
        "your export is processed securely and is not permanently stored. your data stays private and is only used to generate your insights.",
    },
    {
      question: "what happens after i upload?",
      answer:
        "we analyze your followers, activity, and engagement data to generate a personalized dashboard with insights and tools.",
    },
  ],
  [
    {
      question: "do i need to log into instagram?",
      answer:
        "no. you never log into instagram through our platform. we only use the export file you provide.",
    },
    {
      question: "what file format is supported?",
      answer:
        "we support the official instagram export zip file. no additional setup or formatting is required.",
    },
    {
      question: "can i cancel anytime?",
      answer:
        "yes. all paid plans can be canceled anytime. you'll keep access until the end of your billing period.",
    },
  ],
] as const;

export function MarketingHomeRoute() {
  return (
    <main className="landing-shell" aria-label="Home landing page">
      <MarketingScrollReveal />

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-content">
          <p className="hero-eyebrow">instagram dataset workspace</p>

          <h1 id="hero-title" className="hero-title">
            <span className="hero-title-line">unlock powerful tools</span>
            <span className="hero-title-line">from your instagram export</span>
          </h1>

          <p className="hero-copy">
            upload once and instantly see who is not following you back, discover
            ghost followers, and uncover engagement insights.
          </p>

          <div className="hero-actions">
            <Link href="/app/datasets/new?entry=home-hero" className="hero-btn hero-btn-primary">
              get started
            </Link>

            <a href="#how-it-works" className="hero-btn hero-btn-secondary">
              how it works
            </a>
          </div>
        </div>

        <HeroScrollLink
          targetId="tools-section"
          className="hero-scroll-cue"
          ariaLabel="Scroll to tools section"
        >
          <span className="hero-scroll-mouse" aria-hidden="true">
            <span className="hero-scroll-wheel" />
          </span>
          <span className="hero-scroll-text">scroll to explore</span>
        </HeroScrollLink>
      </section>

      <section
        id="tools-section"
        className="landing-tools-section"
        aria-labelledby="tools-section-title"
        data-reveal
      >
        <div id="tools-scroll-target" className="section-scroll-target">
          <div className="section-intro tools-section-intro">
            <p className="section-kicker">dataset tools</p>
            <h2 id="tools-section-title" className="section-title">
              tools unlocked by your instagram export
            </h2>
            <p className="section-copy">
              upload your instagram export once to unlock relationship, audience, and
              growth insights.
            </p>
          </div>

          <div className="tier-columns-grid" aria-label="Instalyzer tool tiers">
            {toolTiers.map((tier) => (
              <article key={tier.label} className={`tier-column ${tier.tierClassName}`}>
                <div className="tier-column-head">
                  <span className="tier-column-label">{tier.label}</span>
                </div>

                <div className="tier-tool-list">
                  {tier.tools.map((tool) => (
                    <article key={tool.title} className="tier-tool-row">
                      <span className="tier-tool-icon" aria-hidden="true">
                        {tool.icon}
                      </span>

                      <div className="tier-tool-body">
                        <h3 className="tier-tool-title">{tool.title}</h3>
                        <p className="tier-tool-copy">{tool.copy}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="tier-columns-meta">
          <p className="tier-columns-note">
            <span className="tier-columns-note-mark" aria-hidden="true">
              +
            </span>
            <span>more tools unlock as you upgrade</span>
          </p>
          <HeroScrollLink
            targetId="pricing-scroll-target"
            className="tier-columns-link"
            ariaLabel="Scroll to pricing section"
          >
            view pricing
          </HeroScrollLink>
        </div>
      </section>

      <section
        id="how-it-works"
        className="how-it-works-section"
        aria-labelledby="how-it-works-title"
        data-reveal
      >
        <div className="section-intro how-it-works-intro">
          <p className="section-kicker">how it works</p>
          <h2 id="how-it-works-title" className="section-title">
            turn your instagram export into insights
          </h2>
          <p className="section-copy">
            upload your export, analyze your network, and explore the insights.
          </p>
        </div>

        <div className="how-it-works-grid" aria-label="How Instalyzer works">
          {howItWorksSteps.map((step, index) => (
            <Fragment key={step.step}>
              <article className="how-it-works-card">
                <span className="how-it-works-step">{step.step}</span>
                <span className="how-it-works-icon" aria-hidden="true">
                  {step.icon}
                </span>
                <h3 className="how-it-works-card-title">{step.title}</h3>
                <p className="how-it-works-card-copy">{step.copy}</p>
              </article>

              {index < howItWorksSteps.length - 1 ? (
                <span className="how-it-works-chevron" aria-hidden="true" />
              ) : null}
            </Fragment>
          ))}
        </div>

        <div className="how-it-works-help">
          <p className="how-it-works-help-copy">need help exporting your data?</p>
          <Link href="/help" className="how-it-works-help-link">
            how to download your instagram data
          </Link>
        </div>
      </section>

      <section
        className="results-preview-section"
        aria-labelledby="results-preview-title"
        data-reveal
      >
        <div className="section-intro results-preview-intro">
          <p className="section-kicker">results preview</p>
          <h2 id="results-preview-title" className="section-title">
            the dashboard behind your export
          </h2>
          <p className="section-copy">
            analyze followers, engagement, and growth signals from your instagram
            data.
          </p>
        </div>

        <div className="results-preview-stage" aria-hidden="true">
          <div className="results-preview-shell">
            <article className="results-preview-panel">
              <p className="results-preview-label">account overview</p>

              <div className="results-preview-profile">
                <div className="results-preview-avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 12a3.75 3.75 0 1 0-3.75-3.75A3.75 3.75 0 0 0 12 12Z" />
                    <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
                  </svg>
                </div>

                <div className="results-preview-profile-copy">
                  <span className="results-preview-profile-handle">@username</span>
                  <strong>creator profile</strong>
                  <span>last 90 days</span>
                </div>
              </div>

              <div className="results-preview-metrics">
                {resultsPreviewMetrics.map((metric) => (
                  <article key={metric.label} className="results-preview-metric">
                    <span>{metric.label}</span>
                    <strong data-countup-target={metric.value}>
                      {metric.value.toLocaleString()}
                    </strong>
                  </article>
                ))}
              </div>
            </article>

            <aside className="results-preview-side">
              <p className="results-preview-side-kicker">tools unlocked</p>

              <div className="results-preview-pill-stack">
                {resultsPreviewPills.map((pill) => (
                  <span
                    key={pill.label}
                    className={`results-preview-pill ${pill.className}`}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
            </aside>
          </div>
        </div>

        <div className="results-preview-cta">
          <p className="results-preview-cta-copy">
            ready to unlock your instagram insights?
          </p>
          <Link
            href="/app/datasets/new?entry=home-results-preview"
            className="results-preview-cta-link"
          >
            instalyze your export
          </Link>
        </div>
      </section>

      <section
        id="pricing-section"
        className="pricing-section"
        aria-labelledby="pricing-title"
        data-reveal
      >
        <div id="pricing-scroll-target" className="section-scroll-target">
          <div className="section-intro pricing-intro">
            <p className="section-kicker">pricing</p>
            <h2 id="pricing-title" className="section-title">
              pick the right plan for your workflow
            </h2>
            <p className="section-copy">
              start free, unlock more tools as you grow, and upgrade when you want
              deeper insights.
            </p>
          </div>

          <div className="pricing-grid" aria-label="Pricing plans">
            {pricingPlans.map((plan) => (
              <article
                key={plan.tier}
                className={`pricing-card ${plan.cardClassName}${plan.featured ? " is-featured" : ""}`}
              >
                {plan.badge ? <div className="pricing-card-badge">{plan.badge}</div> : null}

                <div className="pricing-card-head">
                  <p className="pricing-card-tier">{plan.tier}</p>
                  <p className="pricing-card-price">
                    <span>{plan.price}</span>
                    {plan.billingLabel ? <small>{plan.billingLabel}</small> : null}
                  </p>
                </div>

                <p className="pricing-card-copy">{plan.copy}</p>

                <ul className="pricing-feature-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <Link
                  href={`/app/datasets/new?entry=${`home-pricing-${plan.tier}`}`}
                  className={`pricing-card-btn ${plan.ctaClassName}`.trim()}
                >
                  {plan.ctaLabel}
                </Link>
              </article>
            ))}
          </div>
        </div>

        <div className="pricing-footer">
          <p className="pricing-reassurance">
            cancel anytime. no instagram login required. your export stays private.
          </p>

          <div className="pricing-footer-cta">
            <p className="pricing-footer-copy">need help choosing a plan?</p>
            <HeroScrollLink
              targetId="tools-scroll-target"
              className="pricing-footer-link"
              ariaLabel="Scroll to tools section"
            >
              compare tools
            </HeroScrollLink>
          </div>
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-title" data-reveal>
        <div className="section-intro faq-intro">
          <p className="section-kicker">faq</p>
          <h2 id="faq-title" className="section-title">
            common questions before you upload
          </h2>
          <p className="section-copy">
            everything you need to know about your export, privacy, and how your
            data is handled.
          </p>
        </div>

        <FaqAccordion columns={faqColumns} />

        <div className="faq-footer">
          <p className="faq-footer-copy">still have questions?</p>
          <a href="#" className="faq-footer-link">
            contact support
          </a>
        </div>
      </section>

      <section
        className="final-cta-section"
        aria-labelledby="final-cta-title"
        data-reveal
      >
        <div className="section-intro final-cta-intro">
          <p className="section-kicker">final step</p>
          <h2 id="final-cta-title" className="section-title">
            ready to analyze your instagram data?
          </h2>
          <p className="section-copy">
            upload your export and get instant insights - no login required, your
            data stays private.
          </p>
        </div>

        <div className="final-cta-placeholder">
          <Link
            href="/app/datasets/new?entry=home-final-cta"
            className="final-cta-placeholder-btn"
          >
            instalyze your export
          </Link>
          <p
            className="final-cta-placeholder-trust"
            aria-label="no instagram login required, cancel anytime, your data stays private"
          >
            <span>no instagram login required</span>
            <span>cancel anytime</span>
            <span>your data stays private</span>
          </p>
        </div>
      </section>
    </main>
  );
}

