# Evidence remediation and RAG enrichment change report

Research date: 2026-11-01.

## Existing records improved

- Reviewed the existing 50 schemes and 78 source records; no scheme, source or relationship identity was removed or replaced.
- Updated 637 evidence entries (546 locators added for inspected sources; 91 generic evidence descriptions rewritten).
- Reclassified 21 directly inspected MP CM Helpline pages as official government summaries, and recorded direct inspection metadata for four central government pages. Six failed access attempts are explicitly noted in the registry.
- Generated additive, evidence-linked English citizen content, partial Hindi equivalents, FAQs, retrieval chunks and search terms in separate files.

## New schemes added

- 0. The catalogue remains at 50 schemes.

## Records deliberately left unchanged

- Scheme records themselves and the existing scheme IDs, source IDs, civic services and grievance channels were preserved. The fact fields were not rewritten in this enrichment pass.
- Existing schema, controlled vocabularies and relationship records were preserved.

## Information still unknown

- 493 evidence entries lack locators; 131 still have generic inherited summaries.
- 59 FAQ answers are explicitly unknown. Six scheme cards have no evidence-linked short summary. Many eligibility/application fields remain null/empty where existing evidence did not establish a value.
- Six live source access attempts failed; see the evidence remediation report. Current application status and 2026–27 continuation were not inferred.

## Conflicting evidence

- Existing conflicts and annual-cycle gaps remain documented in `unresolved-information.md`. This pass did not silently adjudicate claims whose governing source could not be checked.

## Exclusions

- No candidates or records were added; therefore no new candidate exclusions were made.

## Schema changes

- None to the production-facing scheme schema or enums. Added `schema/proposed-application-data-contract.json` as an additive integration proposal only.

## Validation

- All output JSON parsed. Custom structural/type checks, evidence/source and cross-file ID checks, generated content citation checks and relationship checks returned zero errors.
- Formal JSON Schema validation was unavailable (`jsonschema` is not installed); manual schema required-key and declared primitive type checks were performed. Semantic proof of every paraphrase remains a human research task.
- Validation also identified 31 populated material fields lacking field-level evidence references; these are disclosed and not treated as freshly substantiated.
