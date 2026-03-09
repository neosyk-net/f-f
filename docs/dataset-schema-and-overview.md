# Dataset Schema And Overview

## Purpose

This document locks the first practical dataset model for the Instagram workspace based on a real export sample.

It defines:

- what data is confirmed in the export
- what the dataset should store
- what belongs in the dataset overview
- what should stay out of the overview for now

## Confirmed From Real Export

Confirmed from the sample archive in `import/instagram-sykoanalyst-2026-03-07-huslh1uO.zip`:

- account username exists in `personal_information/personal_information/personal_information.json`
- profile photo exists in `personal_information/personal_information/personal_information.json`
- profile photo also appears in `your_instagram_activity/media/profile_photos.json`
- follower records exist in `connections/followers_and_following/followers_1.json`
- following records exist in `connections/followers_and_following/following.json`
- following entries include timestamps
- follower entries include usernames and timestamps
- some insights files include a `Date Range` field, such as `logged_information/past_instagram_insights/profiles_reached.json`

## Important Scope Rule

Do not treat the export as one clean real-time account snapshot.

Use these distinctions:

- `account profile data`: who the account is
- `dataset relationship data`: follower/following records captured in the export
- `time-scoped activity data`: insights, media, and other records that may reflect a selected export window

This matters because:

- follower and following counts in the dataset are reliable as dataset counts
- they are not guaranteed to be the same as the live Instagram app counts at viewing time
- the export may contain date-ranged data in some sections without exposing one universal archive-level range field

## Trust Tiers

Use this split when deciding what belongs in the overview versus tools or supporting detail.

### Insight-backed metrics

These are the strongest candidates for the main dataset overview because they come from Instagram insight summary files.

- follower total
- accounts reached
- impressions
- profile visits
- external link taps
- content interactions
- accounts engaged
- detected insight range

### Export-derived metrics

These come from relationship files, import structure, or exported profile data. They are still useful, but they should be treated more carefully.

- following records
- follower record count
- mutuals in export
- not-following-back from export records
- categories detected
- import source
- username
- display name
- profile photo
- follows in range
- unfollows in range
- net follower change

Rule:

- if a metric is not trustworthy enough to stand on its own, it should not be a headline overview metric
- keep ambiguous but useful metrics in tools, secondary sections, or clearly qualified UI

## Recommended Dataset Schema

### Dataset root

```json
{
  "id": "dataset_xxx",
  "name": "My dataset",
  "notes": "",
  "createdAt": "2026-03-08",
  "createdAtMs": 1772940000000,
  "source": {
    "importType": "zip",
    "sourceLabel": "ZIP archive",
    "scannedJsonCount": 0,
    "ignoredJsonCount": 0
  },
  "profile": {},
  "scope": {},
  "records": {},
  "metrics": {},
  "meta": {}
}
```

### `profile`

Stable account identity fields that can be shown at the top of the dataset workspace.

```json
{
  "username": "sykoanalyst",
  "displayName": "account display name if present",
  "bio": "profile bio if present",
  "website": "https://...",
  "isPrivate": false,
  "profilePhoto": {
    "uri": "media/other/18377982049089558.jpg",
    "sourceFile": "personal_information/personal_information/personal_information.json",
    "createdAt": 1771986389
  }
}
```

### `scope`

Information about what this dataset covers.

```json
{
  "importedAt": "2026-03-08",
  "insightsDateRangeLabel": "Dec 7 - Mar 6",
  "hasDetectedDateRange": true,
  "dateRangeSource": "logged_information/past_instagram_insights/profiles_reached.json",
  "detectedCategories": [
    ["connections", 3],
    ["insights", 2]
  ]
}
```

Notes:

- `insightsDateRangeLabel` should be optional
- do not pretend this is the range for every dataset record unless the source supports that claim
- if multiple insight files disagree, show no single range until a better rule exists

### `records`

Raw and normalized data used by tools.

```json
{
  "followers": [],
  "following": [],
  "derived": {
    "mutuals": [],
    "notFollowingBack": []
  }
}
```

Recommended record shape:

```json
{
  "username": "example_user",
  "href": "https://www.instagram.com/example_user",
  "timestamp": 1772818273,
  "source": "followers"
}
```

### `metrics`

Dataset-level factual counts.

```json
{
  "followerCount": 0,
  "followingCount": 0,
  "mutualCount": 0,
  "notFollowingBackCount": 0,
  "followerTotalFromInsights": 0,
  "accountsReached": 0,
  "impressions": 0,
  "profileVisits": 0,
  "externalLinkTaps": 0,
  "contentInteractions": 0,
  "accountsEngaged": 0,
  "followsInRange": 0,
  "unfollowsInRange": 0,
  "netFollowersInRange": 0,
  "importedFileCount": 0
}
```

Rule:

- these counts are derived from imported dataset records
- they are not live account metrics

### `meta`

Implementation and debugging metadata.

```json
{
  "followersFiles": [],
  "followingFiles": [],
  "scannedJsonCount": 0,
  "ignoredJsonCount": 0,
  "detectedDataLabel": "connections, insights"
}
```

## Dataset Overview

The dataset overview should show only stable, defensible information.

### Top identity band

- profile photo
- username
- display name if available
- optional short profile line later

### Primary metric row

- followers
- accounts reached
- profile visits

### Secondary metric row

- external link taps
- content interactions
- accounts engaged

### Dataset meta section

- dataset name
- dataset created date
- import source
- impressions
- detected categories
- detected insights date range if available

## What Not To Put In The Base Overview Yet

Do not place these in the base overview unless the export support is proven and the metric definition is stable:

- ghost followers
- admirers
- profile interactions by audience type
- story interactions as a headline metric
- top followers
- AI recommendations
- engagement quality labels

These belong in tools or later insight modules.

## Product Wording Recommendation

Use labels that make the data boundaries clear:

- `Followers`
- `Accounts reached`
- `Profile visits`
- `External link taps`
- `Content interactions`
- `Accounts engaged`
- `Impressions`
- `Detected insight range`
- `Imported from ZIP archive`

Avoid labels that imply live sync:

- `Current followers`
- `Live following`
- `Real-time audience`

## Recommended Implementation Order

1. Extend the upload parser to read account profile fields from `personal_information/personal_information/personal_information.json`.
2. Preserve profile photo file references from the zip so the workspace can render the avatar.
3. Detect and parse insight-backed summary metrics from supported insight files.
4. Detect optional insight date range labels from supported insight files.
5. Populate the dataset overview with profile, trusted insight metrics, and dataset meta.
6. Keep export-derived relationship metrics available for tools and secondary UI.

## Decision

The first overview version should be built from:

- username
- profile photo
- follower total from insights
- accounts reached
- profile visits
- external link taps
- content interactions
- accounts engaged
- impressions
- dataset created date
- import source
- detected categories
- optional detected insight range

That gives the workspace a stronger, more trustworthy overview while keeping weaker export-derived relationship metrics out of the headline layer until their meaning is proven.
