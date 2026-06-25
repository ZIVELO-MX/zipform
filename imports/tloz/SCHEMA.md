# TLOZ Schema

This document defines the initial data model for implementing TLOZ inside Zipform.

It is a product reference, not a database specification. Adapt names and relationships to the existing architecture when appropriate.

---

# Core Entities

## Season

Represents a major product version.

Fields

- id
- name
- version
- description
- status
- startDate
- endDate
- createdAt
- updatedAt

Example

- Season 1
- v1.0.0

---

## Episode

Represents a milestone inside a Season.

Fields

- id
- seasonId
- name
- romanNumber
- description
- status
- startDate
- endDate
- createdAt
- updatedAt

Example

- Episode I — Authentication

---

## Project

Represents a product area or workstream.

Fields

- id
- name
- description
- color
- icon
- status
- createdAt
- updatedAt

Examples

- Auth
- Join Flow
- Wallets
- Rewards

---

## Mission

Primary work entity.

Fields

- id
- title
- description
- type
- status
- conclusion
- ownerId
- projectId
- seasonId
- episodeId
- dueDate
- startDate
- completedAt
- blockedReason
- createdAt
- updatedAt

Rules

- A Mission belongs to one Project.
- A Mission may belong to one Season.
- A Mission may belong to one Episode.
- A Mission may depend on other Missions.
- A Mission may require Quest Items.
- Exploration Quests must always finish with a conclusion.
- Completed Missions preserve history.

---

## Mission Types

Mission type already defines the business importance.

There is no separate Kano classification.

- main_quest
    - Critical product work.
    - Represents required product progress.

- side_quest
    - Valuable improvements.
    - Nice-to-have functionality.

- farming_quest
    - Maintenance and product health.
    - Documentation, cleanup, bug fixing, reviews.

- exploration_quest
    - Research and validation.
    - Used to make future decisions.

---

## Mission Dependency

Represents Mission-to-Mission blocking relationships.

Fields

- id
- missionId
- dependsOnMissionId
- createdAt

Rule

A Mission cannot move to Now while required dependencies remain incomplete.

---

## Quest Item

Reusable unlock or prerequisite.

Fields

- id
- name
- description
- icon
- status
- acquiredAt
- createdAt
- updatedAt

Examples

- Apple Developer Account
- Approved Budget
- Signed Contract
- Purchased Domain
- Selected Provider

---

## Mission Quest Item

Relationship between Missions and Quest Items.

Fields

- id
- missionId
- questItemId
- required
- createdAt

Rules

- A Mission may require multiple Quest Items.
- One Quest Item may unlock multiple Missions.
- Blocked Missions should visually display their required Quest Items.

---

## Checklist Item

Simple checklist inside a Mission.

Fields

- id
- missionId
- title
- completed
- position
- createdAt
- updatedAt

Rules

- Flat checklist only.
- No nested tasks.

---

## Resource

Attachment associated with a Mission.

Fields

- id
- missionId
- type
- title
- url
- fileId
- createdAt
- updatedAt

Supported resource types

- link
- document
- image
- file
- note

---

## User Mission State

Tracks active work limits for each user.

Fields

- id
- userId
- missionId
- slot
- createdAt
- updatedAt

Rules

A user may have at most:

- one active Quest
    - Main Quest OR Side Quest

and

- one active Support Quest
    - Exploration Quest OR Farming Quest

This rule applies only to Missions in the Now state.

---

# Enums

## MissionType

```ts
export type MissionType =
  | "main_quest"
  | "side_quest"
  | "exploration_quest"
  | "farming_quest";
```

## MissionStatus

```ts
export type MissionStatus =
  | "now"
  | "next"
  | "later"
  | "completed";
```

## MissionConclusion

Only valid for Exploration Quests.

```ts
export type MissionConclusion =
  | "do_it"
  | "dont_do_it"
  | "postpone"
  | "needs_exploration";
```

## QuestItemStatus

```ts
export type QuestItemStatus =
  | "needed"
  | "acquired"
  | "expired"
  | "archived";
```

## ResourceType

```ts
export type ResourceType =
  | "link"
  | "document"
  | "image"
  | "file"
  | "note";
```

---

# Initial Implementation

Do not hardcode data inside pages or UI components.

Instead, create a dedicated data layer that exposes the current application state.

Example:

```ts
export async function getTlozData() {
  return {
    seasons: [],
    episodes: [],
    projects: [],
    missions: [],
    questItems: [],
  };
}
```

Components should consume this function as if it were backed by a database.

Replacing the implementation with Prisma, Supabase, or another backend should require no UI changes.

---

# Missing Information

If implementation requires information not defined in IDEA_v2.md or TLOZ_UI_v2.md:

- do not invent new product rules
- leave a TODO
- document the missing decision in TODO.md
- continue implementing using reasonable placeholders
