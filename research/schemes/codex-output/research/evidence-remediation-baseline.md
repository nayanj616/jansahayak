# Evidence remediation baseline and proposed output structure

Inspection was completed before edits. A byte-for-byte workspace copy of `outputs/` is preserved at `work/backups/outputs-2026-11-01/outputs/`.

## Baseline inventory (2026-11-01)

- Schemes: 50; sources: 78; field evidence entries: 1193.
- Scheme level: {'central': 16, 'central_state': 13, 'state': 21}.
- Civic service catalog/edges: 9/12; grievance channels/edges: 5/24.
- Evidence entries with no locator: 1039; generic summaries: 222.
- Fields with most missing locators: [('official_name', 49), ('description', 49), ('benefits', 47), ('beneficiary_groups', 46), ('application_mode', 46), ('department', 46), ('category', 46), ('short_name', 46), ('jurisdiction', 46), ('scheme_level', 45), ('application_portal', 37), ('application_steps', 36), ('benefit_amount', 32), ('aliases', 31), ('benefit_type', 30), ('residency_requirement', 29), ('objectives', 29), ('other_eligibility_conditions', 29), ('mandatory_documents', 28), ('benefit_frequency', 27)].
- Records citing only official summaries: ['pm_kisan_mandhan', 'pm_svanidhi'].
- Unknown evidence source references: 0.

The prior `validation-report.json` was read but will be independently recomputed. Summary-only source classification is preserved; an official summary is not reclassified as an implementing-authority rule. Existing scheme IDs and source IDs will be preserved.

## Proposed output structure

- Keep `data/schemes.json`, `data/sources.json`, service links and grievance links as the official-fact base; preserve their schema and IDs.
- Add `data/citizen-content.json`: generated English/Hindi card and detail copy, each factual sentence with evidence references and unknown notes.
- Add `data/scheme-faqs.json`: deduplicated evidence-grounded FAQs; answers with evidence refs; unknown questions recorded with null answer and reason.
- Add `data/rag-chunks.json`: subject-specific retrieval chunks with scheme ID, language, content origin, evidence refs, source IDs and unresolved/conflict flags.
- Add `data/search-terms.json`: aliases, citizen terms and bilingual keywords, distinguished from eligibility facts.
- Add `schema/proposed-application-data-contract.json`: non-breaking future-facing contract separating official scheme facts, generated copy, FAQ/chunks and evidence links.
- Update `research/evidence-remediation-report.md`, `research/citizen-content-report.md`, `research/unresolved-information.md`, and `validation/validation-report.json`.

This structure keeps explanatory prose out of the official-facts record and avoids a breaking change to the current scheme schema. If evidence cannot be inspected, its locator remains null and the limitation is explicit.
