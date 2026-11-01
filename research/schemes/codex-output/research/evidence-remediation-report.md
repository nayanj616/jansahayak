# Evidence remediation report

Research date: 2026-11-01. This pass preserved all 50 scheme IDs, all 78 source IDs, and existing cross-file record identities. A byte-for-byte pre-edit backup is stored at `work/backups/outputs-2026-11-01/outputs/` (workspace backup, not part of the import bundle).

## Remediation totals

- 1193 field-level evidence entries remain across the catalogue.
- 637 evidence entries were materially changed in this pass: 546 previously missing locators were populated for directly inspected source pages and 91 generic “supports the recorded…” summaries were rewritten to identify the source and field/value.
- 131 entries still use the prior generic summary wording; these entries were not source-inspected during this pass and are not presented as newly verified.
- 493 evidence entries still have no locator. This includes inherited evidence whose referenced source could not be inspected or whose exact source section could not be established; no page or heading was guessed.
- 25 sources were inspected directly: 21 Madhya Pradesh CM Helpline scheme summary/detail pages and 4 central government pages (APY, PMAY-U 2.0 FAQ, PMJDY and PMJJBY). MP CM Helpline entries are explicitly classified as official government summaries, not the underlying orders/guidelines.
- Six access attempts failed or timed out: MGNREGA portal (401 at redirected endpoint), PM-KISAN portal (502), PM Surya Ghar portal (403), PMEGP guidelines PDF (unavailable), PMFBY FAQ (timeout), and PMSBY FAQ (timeout). Registry notes record that these contents were not inspected.
- The registry contains 16 scheme records with evidence to source records classified as primary guidelines/notifications/primary pages; this is inherited registry classification and should not be read as 16 freshly checked records. Only the four central pages listed above were directly inspected as primary/operational pages in this pass; MP summary pages are not primary rules.

## Locator policy and source authority

For live pages, locators identify actual page headings or named field rows. Central pages were inspected with line/headings locators. Madhya Pradesh CM Helpline locators identify the actual Hindi dashboard field rows (for example, scheme objective, beneficiary conditions, application process, documents, deadline and payment process); they are source-section locators, not fabricated PDF page numbers. Inaccessible pages retain unknown locators and cannot support any new claim from this pass.

The source registry preserves source IDs and exact URLs. `official_government_summary` is used for the directly inspected CM Helpline scheme pages; the APY/PMAY-U/PMJDY/PMJJBY pages are identified as official government primary/operational scheme sources. Other inherited source types and evidence are retained without claiming a fresh check.

## Remaining priorities

1. Resolve the 493 missing locators against accessible primary sources, starting with benefit and eligibility fields.
2. Replace the 131 generic summaries only after inspecting the cited source.
3. Independently confirm current 2026–27 amounts, windows, eligibility changes and application workflows from operative notices; this pass does not establish that every scheme continues unchanged in 2026–27.
4. Keep the source registry’s direct-inspection date distinct from inherited research provenance when sources are next rechecked.
- A custom audit found 31 populated material scheme fields with no field-level `evidence_by_field` entry. These values remain inherited facts and were excluded from generated content whenever the missing field evidence mattered; they need source-level research before assistant use. The output validator lists each field.


## Final content QA addendum — 2026-11-01

A final pass used the current 50-scheme dataset and the pre-pass snapshot at `work/backups/final-qa-2026-11-01/outputs/`. It resolved field-level evidence for 26 of the previously 31 populated material fields; five remain unresolved. The recorded remaining counts are 463 field-evidence entries without locators and 115 entries matching the generic-summary heuristic. See `field-level-evidence-remediation.md`; this does not semantically verify the remaining claims.

The final focused pass filled locators for 25 existing evidence entries and rewrote 23 existing evidence summaries with more specific source descriptions; it also added field-level support to 26 previously unsupported populated fields. Overall evidence without locators fell from 493 to 463 and generic-summary heuristic hits fell from 131 to 115. These count changes do not constitute semantic verification.
