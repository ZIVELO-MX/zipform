# TLOZ operational permission matrix

Status: normative policy extended by TLO-0067. Enforcement is deployed with the
role-management implementation.

## Purpose

This document is the normative authorization policy for the TLOZ domain across
Server Actions and the Data API. It defines the same decision for a given actor,
entity, and operation regardless of the transport used.

The policy applies only after authentication. It does not grant access to agent
administration, API keys, secrets, sessions, or infrastructure configuration.

## Roles

The role strings below match the current production identities.

| User type | Role | Operational purpose |
| --- | --- | --- |
| `human` | `Platform Owner` | Full TLOZ administration and destructive operations |
| `human` | `Full Stack Developer` | Global visibility and owner-scoped contribution |
| `agent` | `agent:operative` | Global TLOZ operation, Mission deletion, and guarded role administration |
| `agent` | `agent:reader` | Global, sanitized, read-only access |

Unknown role strings have no TLOZ access. Adding a role requires an explicit
matrix revision; a new authenticated role must not inherit operative access.

## Permission vocabulary

| Decision | Meaning |
| --- | --- |
| Global | The operation is allowed for every entity in the TLOZ domain |
| Own | The operation is allowed only when `entity.ownerId === actor.id` |
| Self | Creation is allowed only when the server fixes `ownerId` to `actor.id` |
| System | The operation is produced by the application, not directly by a user |
| Deny | The operation is not allowed for the role |

Project ownership does not propagate. Owning a Project does not grant mutation
rights over Missions or Quest Items owned by someone else.

## Mission permissions

| Operation | Platform Owner | Full Stack Developer | `agent:operative` | `agent:reader` |
| --- | --- | --- | --- | --- |
| List, query, and read detail | Global | Global | Global | Global |
| Create | Global, any owner | Self | Global, any owner | Deny |
| Edit title, description, dates, icon, or type | Global | Own | Global | Deny |
| Save Markdown document and checklist | Global | Own | Global | Deny |
| Change status, including complete or block | Global | Own | Global | Deny |
| Add or remove dependencies | Global | Own | Global | Deny |
| Link or unlink Quest Items | Global | Own | Global | Deny |
| Move to another Project, Season, or Episode | Global | Deny | Global | Deny |
| Assign or reassign owner | Global | Deny | Global | Deny |
| Delete Mission | Global | Deny | Global | Deny |

For developer creation, a supplied `ownerId` that differs from the actor is
denied rather than silently accepted. Platform Owners and operative agents may
assign during creation or update. Process-level requirements such as obtaining
human confirmation before self-assignment remain caller responsibilities and do
not weaken the server-side role check.

Mission deletion is destructive but is allowed globally for Platform Owners and
operative agents. Removing a relationship or Resource is not Mission deletion
and follows the owning Mission's mutation rule.

## Supporting entity permissions

| Entity and operation | Platform Owner | Full Stack Developer | `agent:operative` | `agent:reader` |
| --- | --- | --- | --- | --- |
| Read Projects | Global | Global | Global | Global |
| Create Project | Global, any owner | Self | Global, any owner | Deny |
| Edit or archive Project | Global | Own | Global | Deny |
| Assign Project owner | Global | Deny | Global | Deny |
| Delete Project, if introduced | Global | Deny | Deny | Deny |
| Read Quest Items | Global | Global | Global | Global |
| Create Quest Item | Global, any owner | Self | Global, any owner | Deny |
| Edit Quest Item | Global | Own | Global | Deny |
| Assign Quest Item owner | Global | Deny | Global | Deny |
| Delete Quest Item, if introduced | Global | Deny | Deny | Deny |
| Read Seasons and Episodes | Global | Global | Global | Global |
| Create or edit Seasons and Episodes, if exposed | Global | Deny | Global | Deny |
| Delete Seasons and Episodes, if introduced | Global | Deny | Deny | Deny |

An unowned Quest Item can only be mutated by the Platform Owner or an operative
agent. Archive operations are reversible edits; hard deletion remains a
Platform Owner capability even if a delete endpoint is added later.

## Resources and attachments

Resource visibility follows authenticated global TLOZ visibility. The parent
relationship determines mutation rights.

| Operation | Platform Owner | Full Stack Developer | `agent:operative` | `agent:reader` |
| --- | --- | --- | --- | --- |
| List, query, open, or download | Global | Global | Global | Global |
| Attach to Mission, Project, or Quest Item | Global | Own parent | Global | Deny |
| Remove from Mission, Project, or Quest Item | Global | Own parent | Global | Deny |
| Prepare, finalize, or replace Mission attachment batch | Global | Own Mission | Global | Deny |

A nested Resource or attachment operation must verify both identifiers. A
Resource that does not belong to the parent in the route is treated as not found
and must not be mutated by raw identifier alone. Removing a Resource removes the
association or underlying object according to its documented lifecycle; it does
not authorize deleting the parent entity.

## Activity

Activity is globally readable by all four authenticated roles. Activity entries
are immutable audit facts:

- only the system appends Activity as a consequence of an authorized operation;
- no role creates arbitrary Activity directly;
- no role edits or deletes Activity;
- an Activity read exposes only fields already visible to the actor;
- secrets, API keys, session identifiers, raw authorization headers, and private
  payloads are never recorded or serialized.

Until Activity persistence is delivered by TLO-0017, existing derived timestamps
and fixture activity are not evidence of an authorization audit trail.

## Users and administrative operations

Authenticated TLOZ users may resolve users for ownership controls. Platform
Owners, Full Stack Developers, and operative agents receive the operational
profile needed for assignment. Reader agents receive a public profile without
email.

Only the Platform Owner may create users or agents, create/revoke/list API keys,
or use other administrative surfaces. Platform Owners and `agent:operative` may
change compatible roles through `PATCH /users/{userId}/role`; an operative cannot
change itself or an existing Platform Owner. The last Platform Owner cannot be
removed (`409`). No API response may expose a password hash, raw API key, key
hash, session, database URL, service-role key, or authentication secret.

## Authentication and error contract

Authorization is deny-by-default and runs before the repository mutation.

| Condition | HTTP | Code | Response rule |
| --- | --- | --- | --- |
| Missing, malformed, invalid, revoked, or expired credential | `401` | `UNAUTHORIZED` | Generic message and `requestId`; no actor or entity data |
| Valid credential without permission for the operation | `403` | `FORBIDDEN` | Generic message and `requestId`; no entity representation or policy detail |
| Entity does not exist, or nested child does not belong to route parent | `404` | `NOT_FOUND` | Same not-found shape; do not disclose an alternate parent |
| Authorized request with invalid input | `400` | `INVALID_REQUEST` | Field errors may describe submitted fields but not protected data |
| Attempt to remove the last Platform Owner | `409` | `LAST_OWNER` | Role remains unchanged |

Every denied mutation is side-effect free. Data API handlers and Server Actions
must call the same policy before changing data. Server Actions may translate the
decision into a typed application error, but the role/operation result must be
identical to the Data API result.

## Verifiable cases

These cases form the minimum acceptance suite for TLO-0026.

| Actor | Request or action | Context | Expected result |
| --- | --- | --- | --- |
| Platform Owner | `DELETE /missions/{id}` | Existing Mission | Allow |
| Full Stack Developer | Update Mission document | Actor owns Mission | Allow |
| Full Stack Developer | Update Mission document | Another owner | `403`, unchanged |
| Full Stack Developer | Create Mission for another user | `ownerId !== actor.id` | `403`, no Mission |
| Full Stack Developer | Change `ownerId` or `projectId` | Actor owns Mission | `403`, unchanged |
| Full Stack Developer | Remove Mission Resource | Actor owns parent Mission | Allow |
| `agent:operative` | Assign Mission to a resolved user | Any Mission | Allow |
| `agent:operative` | Edit Project or Quest Item | Any owner | Allow |
| `agent:operative` | Delete Mission | Any Mission | Allow |
| `agent:operative` | `PATCH /users/{id}/role` | Compatible non-owner target | Allow |
| `agent:operative` | `PATCH /users/{id}/role` | Self or existing owner | `403`, unchanged |
| Platform Owner | Demote the only owner | One Platform Owner remains | `409`, unchanged |
| `agent:reader` | `GET /missions/{id}` | Any Mission | `200` |
| `agent:reader` | `POST /missions/query` | Valid filters | `200` |
| `agent:reader` | `GET /users` | Any users | `200`, no email |
| `agent:reader` | Any mutation family | Any entity | `403`, unchanged |
| Any authenticated role | Remove Resource through wrong parent | Child belongs elsewhere | `404`, unchanged |
| Unknown authenticated role | Read or mutate TLOZ | Any entity | `403`, no data |
| Anonymous or invalid API key | Any TLOZ endpoint | Any entity | `401`, no data |

The mutation-family test for a reader covers Mission create/update/status/delete,
document, dependencies, Quest Item links, Resources, attachments, Projects, Quest
Items, Seasons/Episodes when writable, and administrative endpoints.

## Current implementation gaps

This matrix is also the contract covered by the deployed backend. Remaining
implementation work is tracked separately:

- `agent:reader` already has global TLOZ reads, sanitized profiles, and broad
  mutation denial;
- the UI still needs to consume server-derived capabilities and present typed
  authorization errors;
- Activity is derived or fixture-backed rather than a persistent audit log;
- manual role verification remains assigned to TLO-0040.

TLO-0067 owns the role endpoint and the operative deletion extension. TLO-0068
owns client-side visibility and authorization error presentation; it must not
duplicate this policy in the browser.
