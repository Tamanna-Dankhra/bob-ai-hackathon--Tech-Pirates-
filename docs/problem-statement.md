# Problem Statement — PharmaGuard AI

## IBM Bob AI Hackathon — Problem Statement P2

### Challenge

The pharmaceutical industry faces two major, persistent operational challenges:

1. **Drug Safety Signal Detection (Pharmacovigilance)**  
   Adverse-event reports accumulate faster than human reviewers can process them. Important safety signals — patterns that may indicate a drug is causing harm — can go undetected or be detected too late, putting patients at risk and exposing companies to regulatory and legal consequences.

2. **Regulatory Submission Readiness**  
   Preparing a Common Technical Document (CTD) submission for a drug regulatory authority (FDA, EMA, etc.) is a complex, multi-section process. Teams must verify that every required section and module is present, complete, and coherent before submission. Manual checklists are error-prone, time-consuming, and poorly scalable.

---

### Impact

- **Patient safety**: Undetected signals delay intervention for real adverse outcomes.
- **Regulatory risk**: Incomplete CTD submissions result in rejection, costly resubmissions, and product launch delays.
- **Operational cost**: Expert pharmacovigilance reviewers spend significant time on routine signal screening and document checklist work that could be automated.

---

### How AI Helps

Proportional Reporting Ratio (PRR) calculation, a standard pharmacovigilance method, is computationally straightforward but laborious at scale. Pairing it with an AI-powered copilot that can:

- explain detected signals in plain English,
- prioritise which signals need immediate expert review,
- answer questions about regulatory gaps with grounding in submission data,

…dramatically reduces the time from data ingestion to actionable decision.

---

### Scope (This Submission)

This hackathon submission focuses on:

- Automated **PRR-based safety signal detection** from adverse-event CSV reports.
- **CTD Section Readiness Checking** against a structured requirement schema.
- An **AI Copilot** (powered by IBM watsonx.ai Granite or OpenRouter) that answers natural-language questions grounded in the actual analysis results — not generic pharmaceutical knowledge.
- A **Dashboard** that consolidates signal and readiness information for a reviewer at a glance.

The system is intentionally scoped to a working prototype that demonstrates the full data-to-insight pipeline, not a production-grade pharmacovigilance system.
