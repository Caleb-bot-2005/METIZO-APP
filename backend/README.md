# Metizo Backend (MVP)

Spring Boot + PostgreSQL backend for **Metizo** — a marketplace that connects
customers with skilled artisans (plumbers, electricians, carpenters, technicians)
through a competitive **bidding** system, a **trust score**, and **escrow** payments.

> 📖 **New to the codebase?** Read [`WALKTHROUGH.md`](WALKTHROUGH.md) — a plain-language
> guide to how everything works, including likely demo questions and answers.

## Tech stack

- Java 17 · Spring Boot 3.3
- Spring Web · Spring Data JPA · Spring Security (JWT)
- PostgreSQL
- Maven

## Features implemented

| Feature (from the proposal)        | Where |
|------------------------------------|-------|
| Auth + roles (CUSTOMER / ARTISAN)  | `auth` package, JWT |
| Post service requests              | `POST /api/requests` |
| Live bidding system                | `POST /api/requests/{id}/bids`, accept a bid |
| Escrow payments (hold → release)   | `EscrowService`, commission deducted on release |
| Trust score system                 | `ArtisanProfile.recalculateTrustScore()` |
| Reviews & ratings                  | `POST /api/requests/{id}/review` |
| Smart matching                     | `GET /api/artisans/match?category=` |
| Emergency requests                 | `emergency` flag on a request |
| Price-transparency dashboard       | `GET /api/pricing/categories` |
| Before & after work photos         | `POST /api/requests/{id}/photos` (multipart) |
| Digital contracts                  | `POST /api/requests/{id}/contract`, `POST /api/contracts/{id}/sign` |
| Price estimator                    | `POST /api/pricing/estimate` |

### Price estimator

A customer can estimate a job's cost **before posting it** (no login required).
It's rule-based — no external AI service — so it always works offline:

- Uses the **average of past completed jobs** in that category when there's
  enough history (`HIGH` confidence); blends with a category default for thin
  history (`MEDIUM`); falls back to a typical starting rate otherwise (`LOW`).
- Adds a **+25% emergency surcharge** when `emergency: true`.
- Nudges the estimate up ~30% when the description reads like an install/replace
  rather than a small repair.

```
POST /api/pricing/estimate
{ "category": "PLUMBING", "description": "kitchen sink is leaking", "emergency": false }

-> { "estimatedCost": 250.00, "lowEstimate": 200.00, "highEstimate": 300.00,
     "estimatedTime": "1-2 days", "confidence": "MEDIUM", ... }
```

> Final price is always set by real artisan bids — the estimate is just guidance.

### Digital contracts

Once a bid is accepted, the customer and assigned artisan agree a scope of work
and both sign it before work begins — reducing disputes.

| Method & path | Who | Notes |
|---|---|---|
| `POST /api/requests/{id}/contract` | customer or assigned artisan | body: `scopeOfWork`, `terms`; price is taken from the accepted bid |
| `GET /api/requests/{id}/contract` | logged-in users | view the contract |
| `POST /api/contracts/{id}/sign` | the contract's customer or artisan | records that party's signature |

A contract starts as `DRAFT`. When **both** parties have signed it becomes `SIGNED`.

### Work photos (before/after proof)

The assigned artisan uploads image proof of their work; customers view it on the job.

| Method & path | Who | Notes |
|---|---|---|
| `POST /api/requests/{id}/photos` | assigned artisan | `multipart/form-data` with `type` (`BEFORE`/`AFTER`) and `file`; image only, max 5 MB |
| `GET /api/requests/{id}/photos` | any logged-in user | returns metadata incl. a `url` for each photo |
| `GET /api/photos/{photoId}` | public | streams the raw image so a mobile `<Image>` can render it directly |

Files are stored on disk under `metizo.uploads.dir` (default `./uploads`, git-ignored).
React Native upload example:

```js
const form = new FormData();
form.append("type", "BEFORE");
form.append("file", { uri: localPhotoUri, name: "before.jpg", type: "image/jpeg" });
await fetch(`${BASE_URL}/api/requests/${jobId}/photos`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` }, // do NOT set Content-Type; fetch sets the boundary
  body: form,
});
// display: <Image source={{ uri: `${BASE_URL}${photo.url}` }} />
```

## Running it

### 1. Start PostgreSQL
```bash
docker compose up -d
```
(or point the app at any Postgres instance — see env vars below)

### 2. Run the app

**No Maven install needed** — use the bundled wrapper:
```bash
# Windows PowerShell
.\mvnw.cmd spring-boot:run
# macOS / Linux / Git Bash
./mvnw spring-boot:run
```
Or, if you installed Maven globally:
```bash
mvn spring-boot:run
```
Or open the folder in **IntelliJ IDEA** (bundles Maven) and run `MetizoApplication`.

> Requires `JAVA_HOME` to point at a JDK 17+ install. On this machine that's
> `C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot` (already set for your user).

App starts on `http://localhost:8080`. Tables are auto-created (`ddl-auto: update`).

### Configuration (env vars, all optional)
| Var | Default |
|-----|---------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/metizo` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | `postgres` |
| `JWT_SECRET` | dev key (override in production!) |
| `SERVER_PORT` | `8080` |
| `METIZO_CORS_ALLOWED_ORIGINS` | Expo Web + common dev ports (see below) |

## Tests

Run the unit-test suite (no database needed — services are tested with mocks):

```bash
.\mvnw.cmd test      # Windows
./mvnw test          # macOS / Linux
```

19 tests cover the core logic: trust-score formula, escrow commission/payout,
bidding rules (role checks, accepting a bid rejects the others), artisan
registration, and the price estimator (emergency surcharge, fallbacks).

## Trying the API

Open [`requests.http`](requests.http) in VS Code (REST Client) or IntelliJ and run
the requests top-to-bottom — it walks the full flow: register → post job → bid →
accept → escrow → complete → review.

## Frontend integration — React Native (Expo)

The mobile app is built with **React Native + Expo**. Because it's a native app
(not a browser), CORS does **not** block its requests — but `localhost` does not
point to the backend machine from a device. Use the right base URL per target:

| Where the app runs        | Base URL |
|---------------------------|----------|
| Physical phone (Expo Go)  | `http://<DEV_MACHINE_LAN_IP>:8080`  (e.g. `http://100.112.17.146:8080`) |
| Android emulator          | `http://10.0.2.2:8080` |
| iOS simulator             | `http://localhost:8080` |
| Expo Web (browser)        | `http://localhost:8080`  (CORS applies — already allowed) |

> The phone and the dev machine must be on the **same Wi-Fi**, and Windows Firewall
> must allow inbound TCP 8080. Find the current LAN IP with `ipconfig` (IPv4 Address).

Minimal API client:

```js
// api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Set this to your dev machine's LAN IP for a physical device.
const BASE_URL = __DEV__
  ? Platform.select({
      android: "http://10.0.2.2:8080",   // emulator; use LAN IP for a real device
      ios: "http://localhost:8080",
      default: "http://localhost:8080",
    })
  : "https://your-production-host";

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = await AsyncStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).message ?? res.statusText);
  return res.status === 204 ? null : res.json();
}

// usage:
// const { token } = await api("/api/auth/login", { method: "POST", auth: false,
//   body: { email, password } });
// await AsyncStorage.setItem("token", token);
// const open = await api("/api/requests");        // browse open jobs
```

Auth: register/login return a JWT `token`. Store it and send it as
`Authorization: Bearer <token>` on every protected request. Public endpoints
(no token needed): `POST /api/auth/**`, and `GET` on `/api/artisans/**` and `/api/pricing/**`.

## Core workflow

```
Customer posts request (OPEN)
        │
Artisans place bids ──────────────► Customer accepts one bid
                                            │  (escrow HOLDS the agreed amount,
                                            │   other bids REJECTED)
                                     Request ASSIGNED
                                            │
                              Artisan starts ► IN_PROGRESS
                                            │
                        Customer confirms ► COMPLETED
                                            │  (escrow RELEASES to artisan
                                            │   minus 10% commission,
                                            │   artisan completion count +1)
                                            │
                              Customer leaves review ► trust score updated
```

## Trust score

`0–100`, recomputed on each review / completion:
- 80% from average star rating (`avg/5 × 80`)
- 20% from completion volume (capped at 20 completed jobs)

## Package layout

```
com.metizo.backend
├── config        SecurityConfig
├── security      JWT service, filter, current-user resolver
├── domain        JPA entities + enums
├── repository    Spring Data repositories
├── dto           request/response records
├── service       business logic (auth, requests, bids, escrow, reviews, pricing)
├── controller    REST endpoints
└── exception     custom exceptions + global handler
```
