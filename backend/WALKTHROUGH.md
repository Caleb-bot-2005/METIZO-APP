# Metizo Backend — Team Walkthrough & Study Guide

This document explains how the Metizo backend works, in plain language, so any
team member can understand it and **explain it during the demo/presentation**.

Read it top-to-bottom once. The most important sections for the presentation are
[The job lifecycle](#5-the-job-lifecycle-the-most-important-part) and
[Likely demo questions](#10-likely-demo-questions--answers).

---

## 1. What the app does (the big picture)

Metizo connects **customers** who need work done (plumbing, electrical, etc.)
with **artisans** who do the work. Instead of fixed prices, artisans **bid** on
jobs and the customer picks the best offer. Money is held safely in **escrow**
until the work is confirmed done.

The backend is the "engine" — it has no screens. It exposes a **REST API** (URLs
that return JSON) that the React Native mobile app calls.

---

## 2. The technology, and why

| Tech | What it is | Why we use it |
|------|-----------|---------------|
| **Java + Spring Boot** | The framework that runs the server | Industry standard, required by the brief |
| **PostgreSQL** | The database | Stores users, jobs, bids, etc.; required by the brief |
| **Spring Data JPA / Hibernate** | Translates Java objects ↔ database tables | So we write Java, not raw SQL |
| **Spring Security + JWT** | Login & access control | Protects endpoints; proves who is calling |
| **Maven** | Build tool | Downloads libraries, compiles, runs tests |
| **Lombok** | Removes boilerplate (getters/setters) | Cleaner code |

---

## 3. How the code is organised (the layers)

Every request flows through the **same four layers**. Understanding this one idea
explains 90% of the codebase:

```
   Mobile app
      │  HTTP request (JSON)
      ▼
┌─────────────┐  Controller  → receives the request, returns JSON
│  controller │              (e.g. BidController)
└─────────────┘
      │ calls
      ▼
┌─────────────┐  Service     → the BUSINESS RULES live here
│   service   │              (e.g. BidService: "only artisans can bid")
└─────────────┘
      │ calls
      ▼
┌─────────────┐  Repository  → talks to the database (save/find)
│ repository  │              (e.g. BidRepository)
└─────────────┘
      │
      ▼
   PostgreSQL
```

Supporting packages:

| Package | Role |
|---------|------|
| `domain` | The **entities** — Java classes that map to database tables (User, Bid, …) |
| `dto` | **Data Transfer Objects** — the exact shape of JSON going in/out (keeps entities hidden) |
| `security` | JWT login, the filter that checks tokens, "who is logged in" helper |
| `config` | `SecurityConfig` — which URLs are public vs protected, CORS |
| `exception` | Turns errors into clean JSON responses (e.g. 400, 404) |

> **One-line explanation for the demo:** "We used a layered architecture —
> controllers handle the web, services hold the business logic, repositories
> handle the database. This keeps each part focused and testable."

---

## 4. The data model (the tables)

| Entity (table) | What it represents |
|----------------|--------------------|
| `User` | A person — either a `CUSTOMER` or an `ARTISAN` (the `role` field) |
| `ArtisanProfile` | Extra info for artisans: category, location, **trust score**, jobs completed |
| `ServiceRequest` | A job a customer posts |
| `Bid` | An artisan's offer (price + time) on a job |
| `EscrowTransaction` | The money held for a job, and how it's settled |
| `Review` | A customer's rating (1–5 stars) of an artisan after a job |
| `WorkPhoto` | A before/after photo an artisan uploads as proof |
| `DigitalContract` | The signed agreement (scope + price) between the two parties |

**Enums** (fixed sets of values) define the states:
`Role`, `RequestStatus`, `BidStatus`, `EscrowStatus`, `PhotoType`, `ContractStatus`.

---

## 5. The job lifecycle (the most important part)

This is the heart of the app. Be ready to explain this flow:

```
1. Customer posts a job              POST /api/requests
   → status = OPEN

2. Artisans place bids               POST /api/requests/{id}/bids
   → each Bid starts PENDING

3. Customer accepts the best bid     POST /api/bids/{bidId}/accept
   → that bid = ACCEPTED, all others = REJECTED
   → job = ASSIGNED, artisan attached, price locked
   → ESCROW holds the money (status HELD)

4. (Optional) Both sign a contract   POST /api/requests/{id}/contract + /sign
   → DRAFT → SIGNED when both sign

5. Artisan does the work + uploads    POST /api/requests/{id}/photos
   proof photos                       (BEFORE / AFTER)
   → artisan marks it started: POST /api/requests/{id}/start (IN_PROGRESS)

6. Customer confirms it's done        POST /api/requests/{id}/confirm
   → job = COMPLETED
   → ESCROW RELEASES money to artisan (minus 10% commission)
   → artisan's "jobs completed" +1, trust score recalculated

7. Customer leaves a review           POST /api/requests/{id}/review
   → rating feeds the artisan's trust score
```

If a customer cancels an assigned job, the escrow is **refunded** to them.

---

## 6. How login works (JWT, explained simply)

1. User **registers or logs in** (`/api/auth/register` or `/login`) with email +
   password. Passwords are **hashed** with BCrypt (never stored in plain text).
2. The server returns a **JWT token** — a long signed string that proves who they
   are. Think of it as a wristband you get at an event.
3. For every protected request, the app sends the token in a header:
   `Authorization: Bearer <token>`.
4. `JwtAuthenticationFilter` checks the token on each request. If valid, the
   request is allowed and the server knows *which user* is calling
   (`CurrentUserService.require()`).

**Public endpoints** (no token needed): register/login, viewing artisans,
the pricing dashboard + estimator, and viewing photos. Everything else needs a
valid token. This is configured in `SecurityConfig`.

> **Demo line:** "We use stateless JWT authentication — the server doesn't keep
> sessions; each request carries a signed token that proves the user's identity
> and role."

---

## 7. The signature features (how each works)

### Live bidding — `BidService`
Artisans submit a price + estimated time. The customer sees all bids (cheapest
first) and accepts one. **Accepting one bid automatically rejects the others** and
moves the job to `ASSIGNED`.

### Escrow payments — `EscrowService`
When a bid is accepted, the agreed amount is recorded as **HELD** (as if the
customer paid into a safe holding account). When the customer confirms the work:
- **commission** = 10% of the amount (Metizo's revenue)
- **artisan payout** = amount − commission
- status becomes **RELEASED**

If the job is cancelled, the money is **REFUNDED**. *(It's a simulated ledger — a
real app would connect this to a payment provider like Paystack.)*

### Trust score — `ArtisanProfile.recalculateTrustScore()`
A 0–100 score, recalculated after each review/completion:
```
trustScore = (averageRating / 5 × 80)        // 80% from ratings
           + (min(jobsCompleted, 20) / 20 × 20)  // 20% from experience
```
Example: a 5-star artisan with 1 completed job = (5/5×80) + (1/20×20) = **81.0**.

### Smart matching — `ArtisanService.matchByCategory()`
Given a category, returns the available artisans in it, **best trust score first**.

### Price transparency + estimator — `PricingService`
- **Dashboard:** average/min/max price per category from completed jobs.
- **Estimator:** a customer describes a job and gets an estimated cost. It uses
  the **average of past completed jobs** in that category (or a sensible default
  if there's no history), adds a **+25% emergency surcharge**, and nudges the
  price up for install/replace-type jobs. *It's rule-based — no external AI — so
  it always works.*

### Before/after photos — `WorkPhotoService` + `FileStorageService`
The assigned artisan uploads image proof. Files are saved to disk (`uploads/`);
the database stores only the details. Images are served at `/api/photos/{id}` so
the mobile app can display them.

### Digital contracts — `ContractService`
After a bid is accepted, the two parties record a scope of work and **both sign**.
The contract goes `DRAFT → SIGNED` once both signatures are in.

---

## 8. How errors are handled

`GlobalExceptionHandler` catches problems and returns clean JSON with the right
HTTP status:
- `400 Bad Request` — invalid input or a broken rule (e.g. a customer trying to bid)
- `401 Unauthorized` — wrong password / bad token
- `404 Not Found` — asking for something that doesn't exist
- `403 Forbidden` — not allowed to do that action

So the mobile app always gets a predictable `{ "status": ..., "message": ... }`.

---

## 9. The tests (and why they matter)

`src/test/java` holds **19 unit tests** (run with `./mvnw test`). They check the
logic *without* a database, using "mocks" (fake stand-ins). They prove things like:
- the trust-score formula gives 81.0 for a 5-star, 1-job artisan
- escrow takes exactly 10% commission
- a customer **cannot** place a bid
- accepting one bid rejects the others

> **Demo line:** "We wrote unit tests for the core business logic — the
> trust-score calculation, the escrow commission, and the bidding rules — so we
> can change code confidently without breaking what works."

---

## 10. Likely demo questions & answers

**Q: Walk me through what happens when a customer accepts a bid.**
A: The `acceptBid` method in `BidService` marks that bid `ACCEPTED` and all other
bids `REJECTED`, sets the job to `ASSIGNED` with the chosen artisan and price, and
calls `EscrowService.hold()` to lock the money.

**Q: How is the trust score calculated?**
A: 80% comes from the artisan's average star rating, 20% from how many jobs
they've completed (capped at 20). It's recalculated whenever a review is left or a
job completes.

**Q: How do you keep passwords safe?**
A: We never store them in plain text — they're hashed with BCrypt. Login compares
the hash, and we issue a JWT token instead of keeping the password around.

**Q: What stops one user from acting as another?**
A: Every protected request must carry a valid JWT. The `JwtAuthenticationFilter`
verifies it and loads the real user, and services check roles/ownership (e.g.
only the owning customer can confirm a job).

**Q: Where does Metizo make money?**
A: A 10% commission taken from the escrow when a job's payment is released to the
artisan. (Also premium listings/subscriptions in the business model.)

**Q: Is the escrow real money?**
A: It's a simulated ledger for the MVP — it records HELD/RELEASED/REFUNDED states.
In production we'd connect it to a payment gateway like Paystack.

**Q: Is the price estimator real AI?**
A: It's a smart rule-based estimator built on our own historical price data, so it
works offline with no external dependency. It could be upgraded to an LLM later.

**Q: How does the mobile app talk to this?**
A: Over a REST API returning JSON. The app sends the JWT in the `Authorization`
header. CORS is configured for the web version; native apps aren't restricted by it.

---

## 11. Running it (quick reference)

```bash
# 1. PostgreSQL must be running with a 'metizo' database
# 2. Set the DB password (once): env var DB_PASSWORD
.\mvnw.cmd spring-boot:run     # start the API on http://localhost:8080
.\mvnw.cmd test                # run the tests
```

Full endpoint list and request examples are in `README.md` and `requests.http`.

---

## 12. Who can explain what (suggested split)

So no one is caught off guard, each member can "own" a section:

| Area | Files to study |
|------|----------------|
| Auth & security | `AuthService`, `JwtService`, `SecurityConfig` |
| Bidding & job lifecycle | `BidService`, `ServiceRequestService` |
| Escrow & money | `EscrowService`, `ArtisanProfile` (trust score) |
| Extra features | `PricingService`, `WorkPhotoService`, `ContractService` |

Everyone should know **Section 5 (the job lifecycle)** — it ties it all together.
