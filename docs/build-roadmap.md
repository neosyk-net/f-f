# Build Roadmap

## Purpose

This roadmap defines the path from the current static prototype to a production-ready Instagram dataset SaaS.

The sequencing goal is:

`validate product shape first, then migrate architecture, then scale features`

## Current State

What already exists:

- marketing-style homepage
- dataset upload and staging flow
- local dataset creation
- dataset workspace overview with embedded Tool 1 flow
- Tool 1: `Not Following Back`
- export guidance and relationship-tool range gating

What is still provisional:

- product naming
- final page structure
- home/workspace copy polish
- future tool feasibility
- SaaS app architecture
- auth, accounts, billing, and backend processing

## Phase 0: Product and Data Validation

Goal:

Lock the product model before committing to a framework migration.

Deliverables:

- inspect one real Instagram export sample
- define the real dataset schema
- confirm which future tools are truly supportable
- finalize product naming direction
- finalize page-level information architecture

Success criteria:

- dataset shape is documented
- Tool 1 input/output is documented
- Tool 2 candidates are narrowed to realistic options
- homepage, datasets, workspace, and tool pages are conceptually locked

Decision at end of phase:

If the product structure is stable, begin Next.js migration.

## Phase 1: UX Refinement in Current Prototype

Goal:

Use the current static app for one more focused pass on UX and flow clarity, without overbuilding on the old architecture.

Recommended scope:

- refine homepage messaging around workspace/platform positioning
- improve dataset creation copy and flow
- define the dataset workspace layout
- align current `f&f` tool language with future tool-system language
- add clear recommended export settings to the landing/tutorial flow

Avoid in this phase:

- adding auth
- adding billing
- heavy backend logic
- large numbers of future tools

Success criteria:

- product flow feels coherent
- dataset-first story is visible in the UI
- Tool 1 is clearly positioned as the first tool, not the whole product

Export settings guidance for this phase:

- `JSON` is required for the current product
- `HTML` support is a possible future compatibility feature
- `medium` media quality is the recommended default
- `all time` should be recommended for relationship tools such as `Not Following Back`
- shorter date ranges may still be useful for future insight-style tools

## Phase 2: Next.js Migration

Goal:

Move from prototype architecture to a real application structure.

Why here:

This is the cleanest time to migrate because the product shape is defined but the app is not yet overloaded with SaaS complexity.

Migration targets:

- move marketing pages into app routing
- move dataset pages into app routing
- separate shared UI from tool-specific UI
- preserve existing prototype logic where useful
- replace local-only structure with app-ready state/data boundaries

Success criteria:

- homepage, datasets, workspace, and tool routes exist
- Tool 1 works in the new app structure
- architecture supports adding auth and persistent storage next

## Phase 3: Backend and Account Foundation

Goal:

Make the app multi-user and persistent.

Core additions:

- authentication
- user accounts
- persistent dataset storage
- dataset ownership model
- backend processing model for uploads
- job/status handling for dataset imports

Success criteria:

- users can sign up and log in
- users can create and revisit datasets across sessions
- dataset processing is reliable and not dependent on browser local storage

## Phase 4: Tool Platform Expansion

Goal:

Turn the app from one useful tool into a reusable tool platform.

Priority order:

1. `Not Following Back`
2. Mutuals / relationship analysis
3. Ghost follower analysis
4. Audience/activity insights
5. AI recommendations / reports

Rule:

Only build tools that are defensible from actual available dataset fields.

Success criteria:

- at least two or three tools run from the same dataset model
- the dataset workspace clearly surfaces available tools
- outputs feel consistent across tools

## Phase 5: SaaS Maturity

Goal:

Add the business-critical SaaS layers once the product is proven.

Potential additions:

- billing
- free vs paid usage limits
- premium reports
- saved outputs and history
- exportable reports
- team or collaborator features later if relevant

Success criteria:

- pricing model is supported by product value
- retention comes from reusable datasets and repeated tool usage
- the product no longer depends on a single utility use case

## Recommended Immediate Priorities

The next highest-value sequence is:

1. Inspect a real Instagram export sample
2. Define the dataset schema
3. Lock Tool 2 candidates based on real data
4. Finalize app sitemap
5. Then migrate to Next.js

## Current UX Focus

The current static UX pass is now centered on finishing the export-support flow before migration:

1. keep the written `help` / export guide as the visual reference
2. replace the current visual-guide placeholders with real screenshot assets
3. keep the guide intentionally focused on `quick guide` + `visual guide` after dropping the planned video layer
4. continue polishing the upload/create modal and core workspace surfaces
5. only begin the Next.js migration once the static support and dataset flow feels clearly settled

## What Not To Do Yet

Do not do these before the schema and page structure are clearer:

- full auth implementation
- billing
- broad AI features with weak data support
- too many new tools
- deep investment in the static architecture

## Practical Recommendation

The best transition point is:

`after product and dataset structure are validated, before SaaS backend complexity expands`

That means:

- not immediately
- but soon
- likely before major new feature development beyond the current prototype
