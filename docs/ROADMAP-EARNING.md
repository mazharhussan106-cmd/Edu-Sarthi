# What to add so EduSarthi earns — in-product only (6 Oct 2026)

No marketing here, only things to build. Order = my suggested order. Effort: S ≈ days, M ≈ 1–2 weeks, L ≈ month.

## Tier 1 — without these there is no revenue
1. **Payments + plans (M)** — Razorpay (UPI, cards), GST invoice PDFs, `Plan`/`Entitlement` tables, a single `can(user, feature)` check used by every API. Everything below hangs on this.
2. **Audit credits (S after 1)** — a free monthly quota of teacher audits, then paid packs or a subscription. The audit is the scarce, costly thing; meter it.
3. **Teacher earnings ledger (M)** — each audit is worth X; ledger, monthly statement, payout request that the admin approves. Today teachers are unpaid in the system.
4. **Institute seats (M)** — the Institute module exists; add seat limits, per-seat price, institute dashboard (progress per student, pending audits), bulk CSV invite, assignments with due dates.
5. **Premium & paid decks (M)** — creators (teachers/institutes) can price a deck; revenue share; admin review already exists.

## Tier 2 — raises price and cuts cost
6. **AI speech feedback (L)** — transcript + pronunciation/fluency score right after recording; sold as the instant tier, teacher audit as the premium tier.
7. **AI draft audit for teachers (M)** — pre-filled rubric and notes the teacher edits; more audits per teacher-hour = margin.
8. **AI card generation (M)** — topic → deck draft, goes through the same admin review; metered by plan.
9. **Express audits (S)** — 24-hour guarantee at a higher price, with queue priority and SLA timer.
10. **Certificates / skill badges (M)** — verifiable public page per student; institutes pay for branded ones.
11. **Streaks, reminders, email/push digests (M)** — drives the daily review habit, which is what makes subscriptions renew.
12. **Learner insights (S)** — progress over rubric criteria; the reason to keep paying.

## Tier 3 — growth of the model
13. **Teacher marketplace / 1:1 and live classes booking (L)** — commission per session.
14. **Exam tracks (L)** — IELTS/PTE speaking, interview mocks, built on existing decks + audits.
15. **White-label institute sites (L)** — own logo/subdomain, higher plan.
16. **Offline / export (S)** — premium PDF or Anki export of owned decks.
17. **Creator self-serve Excel import (S)** — the admin-only importer opened to approved creators, paid publishing.
18. **Admin finance + cost control (M)** — revenue, refunds, coupons, usage metering and per-plan quotas for storage/AI.

## Risks to settle first
- Taking money means DPDP duties, refund policy, GST registration, and Terms; the privacy page was updated but parental consent for under-18 is not built.
- Audit quality is the product: payouts should be tied to review pass-rate.
- Upload quotas and a rate-limit store (deferred in the audit) become mandatory once paid.
