# Lead Comments Access Manual Test Plan

This plan verifies that the `/api/leads/[id]/comments` endpoints enforce ownership and admin access while concealing lead existence from unauthorized users.

## Prerequisites
- Database seeded with at least one lead `L1` owned by user `owner@example.com` and an unrelated user `user@example.com`.
- Admin account `admin@example.com`.
- Ability to authenticate requests as each user (e.g., via session cookie or Authorization header).

## Test Matrix
| Scenario | Actor | Endpoint | Expected Result |
| --- | --- | --- | --- |
| Fetch comments (GET) | Admin | `/api/leads/L1/comments` | `200` with comments payload |
| Fetch comments (GET) | Owner | `/api/leads/L1/comments` | `200` with comments payload |
| Fetch comments (GET) | Unrelated user | `/api/leads/L1/comments` | `403` with `{ "error": "Forbidden" }` |
| Fetch comments (GET) | Unrelated user, missing lead | `/api/leads/does-not-exist/comments` | `403` with `{ "error": "Forbidden" }` |
| Fetch comments (GET) | Admin, missing lead | `/api/leads/does-not-exist/comments` | `404` |
| Create comment (POST) | Admin | `/api/leads/L1/comments` | `201` with created comment |
| Create comment (POST) | Owner | `/api/leads/L1/comments` | `201` with created comment |
| Create comment (POST) | Unrelated user | `/api/leads/L1/comments` | `403` with `{ "error": "Forbidden" }` |
| Create comment (POST) | Admin, missing lead | `/api/leads/does-not-exist/comments` | `404` |
| Create comment (POST) | Unauthenticated request | `/api/leads/L1/comments` | `403` with `{ "error": "Forbidden" }` |

## Step-by-Step Execution
1. **Admin GET success**
   - Authenticate as `admin@example.com`.
   - Send `GET /api/leads/L1/comments`.
   - Confirm the response status is `200` and the JSON matches existing comments.
2. **Owner GET success**
   - Authenticate as `owner@example.com`.
   - Send `GET /api/leads/L1/comments`.
   - Expect `200` and payload identical to admin response.
3. **Unrelated GET denied (existing lead)**
   - Authenticate as `user@example.com`.
   - Send `GET /api/leads/L1/comments`.
   - Expect `403` with `{ "error": "Forbidden" }` and no comment data.
4. **Unrelated GET denied (missing lead)**
   - Authenticate as `user@example.com`.
   - Send `GET /api/leads/does-not-exist/comments`.
   - Expect `403` with `{ "error": "Forbidden" }`, confirming no leak of existence.
5. **Admin GET missing lead**
   - Authenticate as `admin@example.com`.
   - Send `GET /api/leads/does-not-exist/comments`.
   - Expect `404` because admins are authorized to learn the lead is missing.
6. **Admin POST success**
   - Authenticate as `admin@example.com`.
   - Send `POST /api/leads/L1/comments` with body `{ "content": "Admin note" }`.
   - Expect `201` with the newly created comment payload.
7. **Owner POST success**
   - Authenticate as `owner@example.com`.
   - Send `POST /api/leads/L1/comments` with body `{ "content": "Owner note" }`.
   - Expect `201`.
8. **Unrelated POST denied**
   - Authenticate as `user@example.com`.
   - Send `POST /api/leads/L1/comments` with body `{ "content": "Should fail" }`.
   - Expect `403` with `{ "error": "Forbidden" }` and verify no new comment exists.
9. **Admin POST missing lead**
   - Authenticate as `admin@example.com`.
   - Send `POST /api/leads/does-not-exist/comments` with body `{ "content": "Missing" }`.
   - Expect `404`.
10. **Unauthenticated POST denied**
    - Send `POST /api/leads/L1/comments` without authentication.
    - Expect `403` with `{ "error": "Forbidden" }` and verify body was not processed (no new comment).

Document results alongside timestamps or screenshots as needed.
