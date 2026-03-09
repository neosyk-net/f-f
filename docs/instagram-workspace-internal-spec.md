# Instagram Workspace Internal Spec

## Vision

Build a dataset-based Instagram SaaS where users upload their Instagram export once, create reusable datasets, and run multiple tools against those datasets.

The product is not a single unfollow checker. The product is an Instagram dataset workspace with tools.

Core model:

`Instagram export -> processed dataset -> dataset workspace -> multiple tools -> results`

## Product Positioning

Working positioning:

`Upload your Instagram export once, create a reusable dataset, and run AI-powered tools to analyze and improve your account.`

Preferred category language:

- Instagram dataset workspace
- Instagram intelligence workspace

Guidance:

- Use `workspace` or `platform` for the product identity.
- Use `analyzer` as a capability or tool type inside the platform.
- `Not Following Back` is Tool 1, not the whole brand.

## Core Product Model

Primary object:

`Dataset`

Definition:

A dataset is a processed Instagram export that stores normalized account data, metadata, and tool-ready records for repeated use across multiple tools.

Each dataset should eventually contain:

- import source context
- normalized follower/following records
- metadata
- dataset name
- notes
- creation timestamps
- tool-compatible derived records
- saved outputs/history later

## Core Workflow

1. User lands on homepage
2. User uploads Instagram export
3. System validates and processes files
4. User reviews upload summary
5. User names dataset and adds optional notes
6. System creates dataset
7. User enters dataset workspace
8. User selects a tool
9. Tool runs against dataset
10. User reviews results

Key principle:

`Upload once. Use many times.`

## Export Requirements

Current rule:

- `JSON` export format is required for the current product

Current recommendation:

- use `medium` media quality by default
- choose the date range based on what you want to analyze

Future compatibility direction:

- `HTML` export support may be added later if it meaningfully reduces user friction
- do not broaden format support until the JSON-first dataset model is stable

## Main Pages

### Homepage

Purpose:

Explain the platform, drive dataset creation, and preview tool value.

Core sections:

- hero
- primary CTA: `Create Dataset` / `Upload Export`
- secondary CTA: `Explore Tools`
- short "how it works" section
- tool preview section
- tutorial/help section

### Datasets List

Purpose:

Show all user datasets and allow entry into a specific dataset workspace.

Core elements:

- dataset cards/list
- create dataset button
- dataset status/meta
- search/filter later

### Dataset Workspace

Purpose:

Central operating page for one dataset.

Core elements:

- dataset name
- created date
- notes
- dataset overview metrics
- available tools
- recent outputs/history later

### Tool Page

Purpose:

Run a specific tool against a selected dataset and review outputs.

Core elements:

- tool name
- dataset context
- tool controls
- result panels
- export/copy actions where relevant

## Dataset Workspace Metrics

Base workspace metrics should stay factual and directly supported by the data.

Recommended base metrics:

- follower count
- following count
- mutual count
- not-following-back count
- imported file count
- import date
- dataset created date

Advanced inferred insights such as engagement rate, active hour, or account activity patterns should not be treated as base dataset metrics unless the export clearly supports them. Those belong in tools.

## Tool System

Architecture:

One dataset can power multiple tools.

### MVP Tool

`Not Following Back`

Current role:

Tool 1 and proof of concept for the platform.

Core capabilities:

- compare following vs followers
- identify users who do not follow back
- review/manage results
- copy/export results
- support workflow handling

### Near-Term Tools

- Mutuals / relationship analysis
- Ghost follower analysis
- Audience/activity insights

### Later Tools

- Posting-time recommendations
- AI growth recommendations
- exportable creator/account reports

Tool rule:

Every tool must define:

- input data used
- transformation/logic performed
- output shown to user
- trust basis for the output

## Naming Guidance

Preferred language:

- Dataset Workspace
- Tools
- Insights
- Reports

Less preferred as primary product language:

- Dashboard
- Analyzer as the whole product identity

Model:

- Product = workspace/platform
- Features = tools/analyzers/reports

## Navigation Model

Marketing/account navigation:

- Home
- Login / Signup
- App
- Datasets
- Tools
- Account / Billing later

In-app flow:

- Datasets list
- Dataset workspace
- Tool page
- Results/output view

The dataset workspace should be the center of navigation, not skipped.

## Current Codebase Fit

What already aligns:

- homepage direction
- dataset-first onboarding
- upload and parsing flow
- Tool 1 already exists
- local dataset handoff works

What is temporary:

- static front-end architecture
- prototype-first file structure
- limited persistence model
- no real SaaS backend/auth model yet

## Technical Direction

Current stack:

Static HTML, CSS, and JavaScript.

Assessment:

- good for prototype and workflow validation
- not ideal as the final architecture for a real SaaS

Long-term recommendation:

Move to a proper app architecture once the product structure is locked.

Likely fit:

- Next.js / React app
- backend for users, datasets, jobs, and tool outputs
- persistent storage and processing model

Do not rewrite immediately just for fashion. Rewrite when:

- page structure is stable
- dataset model is clearer
- second and third tools are defined
- auth/account architecture becomes necessary

## Immediate Next Steps

1. Inspect a real Instagram export sample.
2. Define actual available data fields.
3. Decide which future tools are truly supportable.
4. Finalize product naming and page structure.
5. Then decide whether to continue iterating in the current codebase or begin a framework migration.
