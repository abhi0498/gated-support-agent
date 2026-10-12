# gated-support-agent: build spec

> This file lives in the repo root as `spec.md`. The project is built from it phase by phase (see Phases).

## Why this exists

A public portfolio project: an autonomous customer-support agent for a print-on-demand / e-commerce store (stickers, posters, shirts). It should work as a code sample for any AI-agent, full-stack or backend application, so keep it brand-neutral: no real company names in code, data or docs. Reviewers spend about 60 seconds on it. In that time they should see:

1. An agent that does real work on its own (answers support tickets with tools)
2. Autonomy that is **bounded by deterministic code**, not by the model's opinion of itself
3. **Evals as a first-class feature**, with a written rule for when to turn the agent off
4. Clean, typed, tested TypeScript in their stack (TS, GraphQL, Postgres, React)

## Architecture: generic core, concrete domain

- `packages/core` is **domain-agnostic**: agent loop, model adapters, gate engine, eval runner, metrics, scorecard and kill switch. It never mentions orders, proofs or shipping.
- `packages/pod` is the **reference policy** for a print-on-demand store: tools, intents, seed data and a `Policy` object.
- The gate is driven by a typed `Policy`: `{ autoSendIntents[], guardedTools[], stagedTools[], requiredFactsByIntent, escalateIntents[], escalationKeywords[], intentSeverity[] }`. Swapping domains means writing a new policy and tools, not touching the core.

## Stack (don't add more)

- Node 22, TypeScript `strict`, pnpm, ESLint + Prettier
- Postgres 16 via Docker Compose; Drizzle ORM + migrations
- GraphQL Yoga (schema-first, typed resolvers via graphql-codegen)
- Zod for tool input/output schemas
- LLM adapters behind one interface: Anthropic, OpenAI, xAI Grok (OpenAI-compatible base URL), plus a deterministic `mock` model for tests and CI
- React + Vite for a single-page review UI
- Vitest (+ a real Postgres in tests via compose or testcontainers)
- GitHub Actions: lint, typecheck, test, eval on the mock model

## Domain

Tables:

- `customers`
- `orders` (status: paid → printing → shipped → delivered; `total_cents`)
- `shipments` (carrier, tracking, eta)
- `proofs` (status: pending → sent → approved / changes_requested)
- `tickets` (subject, body, customer, order ref, created_at)
- `agent_runs` (ticket, model, tokens, cost_usd, latency_ms, trace jsonb)
- `decisions` (run, intent, confidence, action, reasons[])
- `drafts` (ticket, body, status: pending / approved / rejected / auto_sent, reviewer_note, `flagged_at`, `flag_note`). The flag fields record a post-hoc audit saying an auto-sent reply was wrong.
- `address_changes` (order, new_address, status: staged / applied / discarded): staged by the agent, applied only on send
- `reprint_proposals` (order, reason, status: pending / approved / rejected)
- `settings`: a **single row** (`auto_send_enabled`, `threshold` default 0.85, `policy_limit_cents`, `disabled_reason`)

Ticket intents: `order_status`, `proof_status`, `address_change`, `reprint_defect`, `refund_request`, `artwork_question`, `angry_escalation`, `other`.

**Multi-intent rule:** a ticket gets one intent, the most severe present, in this order: `angry_escalation` > `refund_request` > `reprint_defect` > `address_change` > `artwork_question` > `proof_status` > `order_status` > `other`. The agent prompt and the seed labels both follow this rule.

## Agent behaviour

1. **Run:** a tool-calling loop (max 6 steps) with tools:
   - `getOrder(orderId | email)`
   - `getShipment(orderId)`
   - `getProofStatus(orderId)`
   - `updateAddress(orderId, address)`: **staged**. It validates that the order isn't printing or shipped yet and writes a `staged` row to `address_changes`, but it does not touch the order. The change is applied only when the reply is auto-sent or the draft is approved (and the order status is re-checked at that moment). Rejecting the draft discards it.
   - `proposeReprint(orderId, reason)`: **guarded**. It creates a `reprint_proposals` row only, and a human must approve it.
   - `escalateToHuman(reason)`
   - Principle: **no tool causes a side effect before the gate decides.** The gate controls actions, not just replies.
2. **Output:** a structured verdict `{ intent, confidence 0–1, proposedAction: auto_send | draft | escalate, reply, citedFacts[], reasons[] }`. `citedFacts` are the exact values from tool results that the reply relies on (tracking number, ETA, proof status, new address).
3. **Gate (plain code, not the LLM; this is the heart of the repo).** Auto-send only if ALL of these hold:
   - auto-send is enabled in settings (kill switch)
   - the intent is in `policy.autoSendIntents`: `order_status`, `proof_status`, `address_change`
   - every tool call succeeded, and no guarded tool was used
   - confidence ≥ threshold. The confidence is self-reported and uncalibrated, so it is one check among several and never enough on its own; the evals measure how well it is calibrated.
   - **required facts are present:** for each fact in `policy.requiredFactsByIntent[intent]` (e.g. tracking number + ETA for `order_status`), a matching `citedFact` must exist, it must appear in a tool output, and it must appear in the reply. Matching is plain code after normalization: trim and lowercase, collapse whitespace, and parse dates to ISO `YYYY-MM-DD` on both sides, so "Oct 14" and "2026-10-14" match. Tracking numbers and IDs must match exactly. No LLM is involved.
   - no escalation keywords or angry signals
     Otherwise → `draft` (a human reviews it), or `escalate` for intents in `policy.escalateIntents` (`angry_escalation`, `refund_request`) and for any order whose `total_cents > settings.policy_limit_cents`. Every outcome stores its reasons.
4. Persist the full trace (prompts, tool calls, results, verdict, gate result) in `agent_runs.trace` so the UI can show _why_.

## Data and evals

- `seed/tickets.json`: ~60 realistic tickets with ground-truth labels: `{ intent, expectedAction, requiredFacts[] }`. Spread them across the intents, and include tricky ones: wrong order number, two intents in one ticket (labeled with the multi-intent rule), sarcasm, a non-English ticket, a refund disguised as a question. Generate them once with an LLM, then **I review and fix the labels by hand** and commit the result.
- Seed the orders, shipments and proofs that the tickets refer to, including at least one order above `policy_limit_cents`.
- `pnpm eval --model <claude|openai|grok|mock> [--limit n]` runs every ticket through agent + gate and reports:
  - **wrong-auto-send rate**: auto-sent when the label wasn't auto_send, or when required facts were missing. This is THE metric.
  - intent accuracy, action accuracy (confusion matrix), facts coverage
  - **confidence calibration**: accuracy per confidence bucket (e.g. <0.7, 0.7–0.85, 0.85–0.95, ≥0.95)
  - cost per ticket (from token usage) and p50/p95 latency
  - **Report raw counts next to every rate** (e.g. `1/24 (4.2%)`). With ~60 tickets a single error moves a rate by several points, so a rate shown alone is misleading.
  - It writes `results/<model>-<date>.json` and regenerates the table in `EVALS.md`.
- The `mock` model returns scripted verdicts per ticket. Its eval results test the **harness, gate and metrics**, not agent quality. Label it that way in `EVALS.md`.
- Never hand-edit or fabricate numbers in `EVALS.md`. It's generated only.

## Kill switch and scorecard

- `agentScorecard(window: Int = 200)`: rolling metrics from real decisions plus human review outcomes (draft acceptance rate, override rate, wrong-auto-send rate).
- A wrong auto-send is an `auto_sent` draft flagged after the fact through `flagAutoSent(id, note)`. Already-sent replies can't be "rejected", so they get flagged instead.
- Rule: wrong-auto-send rate = flagged ÷ **200**, counted over the last 200 auto-sends. The divisor stays 200 even when fewer auto-sends exist, so early on this is an absolute rule: 3 flagged trips the switch, whether that's 3 of 10 or 3 of 200. When the rate goes above 1%, set `auto_send_enabled = false` and write the reason to `settings.disabled_reason`. Re-enabling is manual only. Unit-test the boundary cases (2 flagged → stays on, 3 → off, fewer than 200 auto-sends, flags that have aged out of the window).

## GraphQL API

- Queries: `tickets(status)`, `ticket(id)` (with runs, decision, trace, draft, staged address change, reprint proposals), `drafts(status)`, `agentScorecard(window)`
- Mutations: `processTicket(id, model)`, `approveDraft(id)` (applies any staged address change), `rejectDraft(id, note)` (discards it), `flagAutoSent(id, note)` (may trip the kill switch), `approveReprint(id)`, `rejectReprint(id, note)`, `setAutoSend(enabled)`

## UI (one page, plain and fast)

An inbox list with status chips. Ticket detail shows the customer message, the agent's reply, the gate result with reasons, any staged address change or reprint proposal, and a collapsible trace of tool calls. Approve and reject buttons on drafts and proposals; a "flag as wrong" button on auto-sent replies. A header shows the scorecard, the auto-send toggle, and the disabled reason when the kill switch has fired. No design system, just tidy CSS.

## Tests (TDD for gate and metrics)

- Table-driven unit tests for the gate (every condition, alone and combined), using the POD policy and a minimal fake policy to prove the core is domain-agnostic
- Fact-matching tests: date formats normalize, IDs require an exact match, a fact cited but absent from tool output fails, and a fact in tool output but missing from the reply fails
- Tests for the metric functions (wrong-auto-send, facts coverage, confusion matrix, calibration buckets)
- Kill-switch boundary tests (see above)
- Tool tests against real Postgres: `updateAddress` stages but never changes the order; the change applies on approve and is discarded on reject; applying is refused if the order started printing in the meantime; `proposeReprint` never executes a reprint
- An end-to-end test: seed → processTicket with the mock model → expected decision → approveDraft → staged change applied
- CI: green on every push; it runs the mock-model eval

## README (the reviewer's 60 seconds)

1. One line: what it is
2. A GIF or screenshot of the review UI
3. A diagram: ticket → agent loop (tools, side effects staged) → **gate** → auto-send / draft / escalate → scorecard → kill switch
4. Eval table (copied from EVALS.md) for at least 2 real models plus mock, with counts next to rates
5. "Run it": `docker compose up -d && pnpm i && pnpm seed && pnpm dev` (and `pnpm eval --model mock`)
6. Design decisions (6 bullets): why the gate is code, why side effects are staged until the gate decides, why facts are matched as strings (with normalization), why confidence is never trusted alone, a generic core with a pluggable policy, and what I'd do next
7. Non-goals: real email ingestion, auth, multi-tenant, production deployment
8. "Iterations": a short changelog of eval-driven improvements, with before and after numbers

## Phases (one PR-sized chunk each; stop for my review after each)

- P0 Scaffold: pnpm workspace (`apps/api`, `apps/web`, `packages/core`, `packages/pod`), tsconfig strict, lint, Vitest, compose, CI skeleton
- P1 Schema + migrations + seed data (I review the ticket labels here)
- P2 Tools with Zod schemas + DB tests (including staged address changes and reprint proposals)
- P3 `Policy` type + gate + fact matching + table-driven tests (TDD)
- P4 Model adapters (mock first, then Anthropic, OpenAI, Grok) + agent loop + trace persistence
- P5 Eval runner + metrics tests + EVALS.md generation
- P6 GraphQL schema, codegen and resolvers
- P7 React review UI
- P8 Scorecard + flagging + kill switch + tests
- P9 README, diagram, screenshots, CI badge, final cleanup
- P10 Eval-driven iteration (ongoing, over the following days): run real-model evals, find the worst failure (e.g. a wrong auto-send), fix it in the gate, prompt or tools, add a regression ticket to the eval set, re-run, and log the before and after numbers in `CHANGELOG.md` and the README "Iterations" section. Aim for 2–3 genuine iterations.

## Repo hygiene

- Real commit dates only: no backdating or rewriting history. Push after every phase, so the history shows steady work.
- Small Conventional Commits with meaningful messages; one PR per phase if convenient.
- MIT licence; `.env.example` included; no secrets ever committed.
