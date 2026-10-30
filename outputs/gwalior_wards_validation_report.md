# Gwalior ward dataset validation report

## Summary

- Source: `gwalior_wards_verified.json` (treated as provisional; filename is not evidence of verification).
- Declared city total: 66; declared included records: 59; parsed records: 59.
- Prepared records: 59. All are marked `pending`; because none has independent verification evidence, **59 records require manual review before production import**.
- Missing/disputed numbers: 40, 41, 42, 43, 44, 45, 46. They are absent from this source, not confirmed nonexistent.

## Passed checks

- JSON parsed successfully.
- Required top-level city, body, ULB LGD code, total, included count, excluded numbers, exclusion reason, and wards properties are present and have expected basic types.
- All 59 records include non-empty `ward_id`, positive integer `ward_no`, and non-empty English name.
- No duplicate ward IDs: True.
- No duplicate ward numbers: True.
- No duplicate non-null LGD codes: True.
- All ward numbers are within 1–66.
- All supplied IDs follow `GWL-W-NNN` with numeric suffix equal to `ward_no`.
- Exclusion numbers are explicitly documented and are absent from included records.
- Declared included count (59) agrees with parsed count (59); 59 + 7 excluded numbers = declared city total 66.

## Failed checks

- None of the structural, uniqueness, range, ID mapping, or count checks failed.
- Independent authenticity/currentness checks were not possible from the supplied file alone; therefore records remain pending, not verified.

## Warnings and missing information

- The source states numbering differs across sources for wards 40–46 but supplies no reconciliation evidence or alternative identifiers.
- No ward polygons, coordinates, center provenance, source update timestamp, or last verification timestamp were supplied. These fields are null and boundaries are `unavailable`.
- `councillor_name` is absent for 38 records and retained as null. Names present in source are not independently confirmed.
- Supervisor, sanitary inspector, sanitation zone are absent for all records and null.
- LGD codes are present for all records, but were not independently verified.
- Source names show mixed capitalization. `ward_name` applies whitespace normalization and simple title capitalization; `ward_name_original` retains the exact supplied spelling. This is mechanical normalization, not authoritative name correction. Examples: ward 1: “Gargaj ward” → “Gargaj Ward”, ward 2: “Bhuteshwar ward” → “Bhuteshwar Ward”, ward 3: “Shabd pratap ashram” → “Shabd Pratap Ashram”, ward 7: “Indira nagar” → “Indira Nagar”, ward 9: “Kashi naresh” → “Kashi Naresh”, ward 11: “Azad chandra shekhar” → “Azad Chandra Shekhar”, ward 14: “Sewa nagar” → “Sewa Nagar”, ward 16: “Lal bahadur shashtri” → “Lal Bahadur Shashtri”.
- `source_url` is null because the input does not provide a ward dataset URL. Its listed municipal contact page is not treated as the source of ward records.

## Duplicate checks

- Duplicate IDs: none.
- Duplicate ward numbers: none.
- Duplicate non-null LGD codes: none.

## Records requiring manual review

All 59 included records require review of source authority/currentness and ward name/LGD mapping. Councillor values, where present, also require confirmation. Ward numbers 40–46 require authoritative reconciliation.

## Import readiness

The import preview is shape-compatible with the proposed `wards` columns and excludes operational counters. It is **not ready for production import as verified master data** until an authoritative ward mapping is obtained and disputed numbering, names, LGD codes, and councillor details are reconciled. No SQL was written or executed and no Supabase connection was made.

## Architecture notes

The ward master contains no complaints, assignments, workers, image records, AI metrics, notifications, or operational counts. Those belong in separate operational tables and should be calculated from live records.
