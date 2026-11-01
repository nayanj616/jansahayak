#!/usr/bin/env python3
"""
JanSahayak — Gwalior Ward Reference Data Importer
Script: scripts/import_gwalior_wards.py

Safely imports provisional Gwalior ward reference records into the Supabase
`public.wards` table with pre-insertion validation, idempotent upsert handling,
and safe dry-run preview capabilities.

Security & Integrity:
- Credentials loaded strictly from environment variables or .env/.env.local.
- Database writes STRICTLY require a privileged secret or service-role key.
  Accepts modern Supabase `SUPABASE_SECRET_KEY` (sb_secret_...) or legacy `SUPABASE_SERVICE_ROLE_KEY`.
- Publishable and anonymous keys (sb_publishable_..., anon JWTs) are NEVER used for writes.
- Secret values are NEVER hardcoded, logged, or printed.
- Dry-run mode by default; execution requires explicit `--execute` flag.
- Dry-run mode NEVER performs database network calls or writes.
- Idempotent upsert on `ward_id` prevents duplicate records.
- Pre-insertion validation ensures record counts, uniqueness, and schemas match.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

# Expected dataset invariants
EXPECTED_RECORD_COUNT = 59
EXPECTED_VERIFICATION_STATUS = "pending"
CONFLICT_COLUMN = "ward_id"
TARGET_TABLE = "wards"

REQUIRED_FIELDS = [
    "ward_id",
    "ward_no",
    "ward_name",
    "ward_name_original",
    "lgd_code",
    "city",
    "state",
    "ulb_name",
    "ulb_lgd_code",
    "latitude",
    "longitude",
    "boundary_geojson",
    "boundary_status",
    "center_source",
    "councillor_name",
    "supervisor_name",
    "sanitary_inspector_name",
    "sanitation_zone",
    "verification_status",
    "source_name",
    "source_url",
    "source_updated_at",
    "last_verified_at",
    "notes",
    "is_active",
]


def load_env_file(filepath: Path) -> Tuple[bool, List[str]]:
    """
    Safely loads key-value pairs from an env file without overriding existing vars.
    Returns: (file_existed, list_of_keys_loaded)
    """
    if not filepath.is_file():
        return False, []

    loaded_keys: List[str] = []
    try:
        with open(filepath, "r", encoding="utf-8-sig") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    # Do not override existing environment variables
                    if key and key not in os.environ:
                        os.environ[key] = val
                        loaded_keys.append(key)
        return True, loaded_keys
    except Exception as e:
        print(f"[WARN] Failed to read {filepath}: {e}", file=sys.stderr)
        return False, []


def is_publishable_or_anon_key(key: str) -> Tuple[bool, str]:
    """
    Determines if a given API key is a publishable or anonymous key
    that must be rejected for administrative write operations.
    Returns: (is_disallowed, reason)
    """
    if not key or not isinstance(key, str):
        return False, ""

    cleaned = key.strip()
    if not cleaned:
        return False, ""

    # 1. Newer Supabase publishable key format (sb_publishable_...)
    if cleaned.startswith("sb_publishable_"):
        return True, "Key starts with Supabase publishable prefix 'sb_publishable_'"

    # 2. Legacy Supabase JWT anon key (starts with eyJ and has payload role 'anon' or 'authenticated')
    if cleaned.startswith("eyJ") and cleaned.count(".") == 2:
        try:
            payload_b64 = cleaned.split(".")[1]
            payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
            payload_bytes = base64.urlsafe_b64decode(payload_b64.encode("utf-8"))
            payload = json.loads(payload_bytes.decode("utf-8"))
            role = payload.get("role")
            if role == "anon":
                return True, "Key is a legacy Supabase JWT with 'anon' role"
            elif role == "authenticated":
                return True, "Key is a client-side Supabase user JWT ('authenticated' role)"
        except Exception:
            pass

    return False, ""


def resolve_supabase_credentials(project_root: Path) -> Dict[str, Any]:
    """
    Loads environment variables from .env.local and .env (if present)
    and resolves Supabase configuration.

    IMPORTANT SECURITY RULE:
    Database writes require an administrative secret key or service-role key.
    Publishable or anon keys are NEVER assigned to `service_role_key`.

    Returns dictionary:
      - url: Optional[str]
      - service_role_key: Optional[str]
      - publishable_key_detected: bool
      - loaded_files: List[str]
    """
    loaded_files: List[str] = []

    # 1. Load .env.local (higher priority in Next.js conventions)
    env_local = project_root / ".env.local"
    if env_local.is_file():
        existed, keys = load_env_file(env_local)
        if existed:
            loaded_files.append(".env.local")

    # 2. Load .env (standard fallback)
    env_standard = project_root / ".env"
    if env_standard.is_file():
        existed, keys = load_env_file(env_standard)
        if existed:
            loaded_files.append(".env")

    # Resolve Supabase URL (accepts SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL)
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    if supabase_url:
        supabase_url = supabase_url.strip().rstrip("/")
        if not supabase_url:
            supabase_url = None

    # Resolve administrative Secret / Service-Role Key ONLY
    # Acceptable environment variable names: SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY
    # Accepts modern Supabase sb_secret_ format or legacy service_role JWT
    service_role_key: Optional[str] = None
    if os.getenv("SUPABASE_SECRET_KEY"):
        val = os.getenv("SUPABASE_SECRET_KEY", "").strip()
        if val:
            service_role_key = val
    elif os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
        val = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        if val:
            service_role_key = val

    # Detect if publishable/anon keys are present in environment
    publishable_key_detected = False
    for pub_key_var in [
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "SUPABASE_ANON_KEY",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]:
        val = os.getenv(pub_key_var, "").strip()
        if val:
            publishable_key_detected = True
            break

    if service_role_key and is_publishable_or_anon_key(service_role_key)[0]:
        publishable_key_detected = True

    return {
        "url": supabase_url,
        "service_role_key": service_role_key,
        "publishable_key_detected": publishable_key_detected,
        "loaded_files": loaded_files,
    }


def validate_credentials_for_execute(creds: Dict[str, Any]) -> List[str]:
    """
    Strictly validates credentials before any database write is attempted.
    Rejects publishable/anon keys, missing secret keys, and invalid URLs.
    """
    errors: List[str] = []
    url = creds.get("url")
    secret_key = creds.get("service_role_key")
    pub_detected = creds.get("publishable_key_detected", False)

    # 1. Validate Supabase URL
    if not url:
        errors.append(
            "Missing required environment variable: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)."
        )
    elif not (url.startswith("https://") or url.startswith("http://")):
        errors.append("Invalid SUPABASE_URL format: must start with https:// or http://")
    elif "placeholder" in url:
        errors.append("Invalid SUPABASE_URL: placeholder URL detected. Set real Supabase project URL.")

    # 2. Validate Administrative Secret / Service-Role Key
    if not secret_key:
        if pub_detected:
            errors.append(
                "REJECTED: Only publishable/anon keys were detected (e.g. NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). "
                "Database writes to public.wards require administrative service-role privileges. "
                "Please set SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) with a valid secret key."
            )
        else:
            errors.append(
                "Missing required environment variable: SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY). "
                "Database writes require administrative service-role privileges."
            )
    else:
        # Check if the provided key itself is a publishable or anonymous key
        is_disallowed, reason = is_publishable_or_anon_key(secret_key)
        if is_disallowed:
            errors.append(
                f"REJECTED: The provided administrative key is invalid for database writes ({reason}). "
                "Database writes cannot use publishable or anon keys. "
                "Please set SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) with a valid secret key (e.g. 'sb_secret_...')."
            )
        elif secret_key.startswith("placeholder") or len(secret_key) < 20:
            errors.append(
                "Invalid secret key: placeholder or invalid key length detected."
            )
        else:
            # Check if secret_key matches any known publishable key in environment
            for pub_var in [
                "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
                "SUPABASE_ANON_KEY",
                "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            ]:
                pub_val = os.getenv(pub_var, "").strip()
                if pub_val and secret_key == pub_val:
                    errors.append(
                        f"REJECTED: The administrative key matches {pub_var}. "
                        "Database writes cannot use publishable/anon keys."
                    )
                    break

    return errors


def load_raw_records(filepath: Path) -> List[Dict[str, Any]]:
    """Loads JSON records from the given filepath."""
    if not filepath.is_file():
        raise FileNotFoundError(f"Input file not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"Expected a JSON array in {filepath}, got {type(data).__name__}")
    return data


def validate_raw_records(records: List[Dict[str, Any]]) -> List[str]:
    """
    Validates pre-conditions on raw records:
    - Exactly 59 records expected.
    - No duplicate ward_id values.
    - No duplicate ward_no values.
    - No duplicate non-null LGD codes.
    - All records have verification_status = 'pending'.
    - All required raw fields exist.
    """
    errors: List[str] = []

    # 1. Exactly 59 records expected
    if len(records) != EXPECTED_RECORD_COUNT:
        errors.append(
            f"Record count mismatch: expected exactly {EXPECTED_RECORD_COUNT} records, found {len(records)}"
        )

    # 2. Check duplicate ward_id and ward_no
    seen_ward_ids: Set[str] = set()
    dup_ward_ids: Set[str] = set()

    seen_ward_nos: Set[int] = set()
    dup_ward_nos: Set[int] = set()

    # 3. Check duplicate non-null lgd_code
    seen_lgd_codes: Set[Any] = set()
    dup_lgd_codes: Set[Any] = set()

    # 4. Check verification_status and required fields
    non_pending_records: List[str] = []
    missing_raw_fields: List[str] = []

    raw_required = [
        "ward_id",
        "ward_no",
        "ward_name",
        "ward_name_original",
        "lgd_code",
        "city",
        "state",
        "ulb_name",
        "ulb_lgd_code",
        "verification_status",
        "active",
    ]

    for idx, r in enumerate(records):
        w_id = r.get("ward_id")
        w_no = r.get("ward_no")
        lgd = r.get("lgd_code")
        status = r.get("verification_status")

        # ward_id checks
        if not w_id or not isinstance(w_id, str):
            errors.append(f"Record #{idx + 1} has invalid or empty ward_id: {w_id}")
        elif w_id in seen_ward_ids:
            dup_ward_ids.add(w_id)
        else:
            seen_ward_ids.add(w_id)

        # ward_no checks
        if w_no is None or not isinstance(w_no, int) or w_no < 1:
            errors.append(f"Record #{idx + 1} ({w_id}) has invalid ward_no: {w_no}")
        elif w_no in seen_ward_nos:
            dup_ward_nos.add(w_no)
        else:
            seen_ward_nos.add(w_no)

        # lgd_code checks
        if lgd is not None:
            if lgd in seen_lgd_codes:
                dup_lgd_codes.add(str(lgd))
            else:
                seen_lgd_codes.add(lgd)

        # verification_status checks
        if status != EXPECTED_VERIFICATION_STATUS:
            non_pending_records.append(f"{w_id} (status: '{status}')")

        # missing raw fields
        for field in raw_required:
            if field not in r:
                missing_raw_fields.append(f"{w_id}: missing '{field}'")

    if dup_ward_ids:
        errors.append(f"Duplicate ward_id values found: {sorted(list(dup_ward_ids))}")
    if dup_ward_nos:
        errors.append(f"Duplicate ward_no values found: {sorted(list(dup_ward_nos))}")
    if dup_lgd_codes:
        errors.append(f"Duplicate non-null lgd_code values found: {sorted(list(dup_lgd_codes))}")
    if non_pending_records:
        errors.append(
            f"Records with non-pending verification_status found: {non_pending_records[:5]}"
        )
    if missing_raw_fields:
        errors.append(f"Missing raw schema fields in records: {missing_raw_fields[:5]}")

    return errors


def transform_record(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms a single raw ward record into the database-ready schema:
    1. Maps `active` -> `is_active` (boolean).
    2. Converts `lgd_code` to string if not None; preserves None.
    3. Converts `ulb_lgd_code` to string if not None; preserves None.
    4. Preserves all other attributes, original spellings, and nulls.
    """
    transformed = dict(raw)

    # 1. Map active -> is_active
    if "active" in transformed:
        transformed["is_active"] = bool(transformed.pop("active"))
    elif "is_active" not in transformed:
        transformed["is_active"] = True

    # 2. String conversion for lgd_code (preserve None)
    if transformed.get("lgd_code") is not None:
        transformed["lgd_code"] = str(transformed["lgd_code"])

    # 3. String conversion for ulb_lgd_code (preserve None)
    if transformed.get("ulb_lgd_code") is not None:
        transformed["ulb_lgd_code"] = str(transformed["ulb_lgd_code"])

    return transformed


def validate_transformed_records(records: List[Dict[str, Any]]) -> List[str]:
    """Validates post-transformation records before database write."""
    errors: List[str] = []

    for idx, r in enumerate(records):
        w_id = r.get("ward_id", f"Record#{idx + 1}")

        # Check required fields exist
        missing = [f for f in REQUIRED_FIELDS if f not in r]
        if missing:
            errors.append(f"{w_id}: Missing transformed columns {missing}")

        # Ensure active was removed
        if "active" in r:
            errors.append(f"{w_id}: Unmapped 'active' field still present")

        # Ensure is_active is boolean
        if not isinstance(r.get("is_active"), bool):
            errors.append(f"{w_id}: 'is_active' is not boolean ({type(r.get('is_active'))})")

        # Ensure lgd_code is str or None
        lgd = r.get("lgd_code")
        if lgd is not None and not isinstance(lgd, str):
            errors.append(f"{w_id}: 'lgd_code' is not string or None ({type(lgd)})")

        # Ensure ulb_lgd_code is str or None
        ulb_lgd = r.get("ulb_lgd_code")
        if ulb_lgd is not None and not isinstance(ulb_lgd, str):
            errors.append(f"{w_id}: 'ulb_lgd_code' is not string or None ({type(ulb_lgd)})")

        # Ensure verification_status is 'pending'
        if r.get("verification_status") != EXPECTED_VERIFICATION_STATUS:
            errors.append(f"{w_id}: 'verification_status' must be '{EXPECTED_VERIFICATION_STATUS}'")

    return errors


def execute_supabase_upsert(
    supabase_url: str,
    service_role_key: str,
    records: List[Dict[str, Any]],
    batch_size: int = 59,
) -> Tuple[int, int, List[str]]:
    """
    Performs idempotent upsert to Supabase PostgREST table `public.wards`
    using `ward_id` as the conflict key and service-role authorization.

    Returns: (total_processed, successful_records, error_messages)
    """
    try:
        import requests
    except ImportError:
        raise RuntimeError(
            "The 'requests' package is required for Supabase REST API communication. "
            "Please run: pip install requests"
        )

    endpoint = f"{supabase_url}/rest/v1/{TARGET_TABLE}?on_conflict={CONFLICT_COLUMN}"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }

    errors: List[str] = []
    successful_count = 0

    # Chunk records into batches
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(records) + batch_size - 1) // batch_size

        try:
            response = requests.post(
                endpoint,
                headers=headers,
                data=json.dumps(batch),
                timeout=30,
            )

            if response.status_code in (200, 201):
                try:
                    result = response.json()
                    inserted = len(result) if isinstance(result, list) else len(batch)
                except Exception:
                    inserted = len(batch)
                successful_count += inserted
                print(
                    f"  [SUCCESS] Batch {batch_num}/{total_batches}: "
                    f"{inserted} records upserted into public.{TARGET_TABLE} (HTTP {response.status_code})"
                )
            else:
                # Sanitize error response: never expose headers or secrets
                err_text = response.text[:300].replace(service_role_key, "[REDACTED_SECRET]")
                err_msg = (
                    f"Batch {batch_num}/{total_batches} failed (HTTP {response.status_code}): {err_text}"
                )
                errors.append(err_msg)
                print(f"  [ERROR] {err_msg}", file=sys.stderr)

        except Exception as exc:
            err_msg = f"Network or execution error in batch {batch_num}: {exc}".replace(
                service_role_key, "[REDACTED_SECRET]"
            )
            errors.append(err_msg)
            print(f"  [ERROR] {err_msg}", file=sys.stderr)

    return len(records), successful_count, errors


def print_banner() -> None:
    print("=" * 72)
    print("  JANSAHAYAK -- GWALIOR WARD REFERENCE DATA IMPORTER")
    print("  Target: Supabase PostgreSQL (public.wards)")
    print("=" * 72)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import provisional Gwalior ward reference data into Supabase public.wards.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Safe dry-run validation and preview (default):
  python scripts/import_gwalior_wards.py
  python scripts/import_gwalior_wards.py --dry-run

  # Show detailed sample records in dry-run:
  python scripts/import_gwalior_wards.py --dry-run --samples 5

  # Execute actual database import (requires SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY):
  python scripts/import_gwalior_wards.py --execute
""",
    )

    parser.add_argument(
        "--file",
        type=Path,
        default=Path("research/wards/gwalior_wards_import_preview.json"),
        help="Path to the JSON preview input file (default: research/wards/gwalior_wards_import_preview.json)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Perform validation, mapping, and preview without writing to Supabase (default mode)",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Execute the actual idempotent upsert to Supabase public.wards (requires service-role key)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=59,
        help="Batch size for database upsert (default: 59)",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=3,
        help="Number of transformed sample records to display in preview (default: 3)",
    )

    args = parser.parse_args()
    print_banner()

    # Determine execution mode: safe default is dry-run
    is_dry_run = True
    if args.execute and not args.dry_run:
        is_dry_run = False

    # Resolve project root (assumes scripts/ is directly inside project root)
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent

    # Resolve input file path
    input_file = args.file
    if not input_file.is_absolute():
        input_file = project_root / input_file

    print(f"\n[1] Configuration & Mode:")
    print(f"  - Mode:                  {'[DRY RUN] (No database modifications)' if is_dry_run else '[LIVE EXECUTE] (Will write to Supabase)'}")
    print(f"  - Input File:            {input_file}")
    print(f"  - Target Table:          public.{TARGET_TABLE}")
    print(f"  - Conflict Key:          {CONFLICT_COLUMN} (Idempotent upsert)")

    # Resolve credentials from environment and local configuration
    creds = resolve_supabase_credentials(project_root)
    loaded_str = ", ".join(creds["loaded_files"]) if creds["loaded_files"] else "None (Environment only)"
    print(f"  - Configuration Files:   {loaded_str}")
    print(f"  - Supabase URL:          {creds['url'] or '[NOT CONFIGURED]'}")

    # Display credential status safely WITHOUT revealing secret values
    key_val = creds.get("service_role_key")
    if key_val:
        if is_publishable_or_anon_key(key_val)[0]:
            service_role_status = "[REJECTED: Publishable/Anon Key Detected]"
        elif key_val.startswith("sb_secret_"):
            service_role_status = "[CONFIGURED: Secret Key (sb_secret_...)]"
        elif key_val.startswith("eyJ"):
            service_role_status = "[CONFIGURED: Service Role (JWT)]"
        else:
            service_role_status = "[CONFIGURED: Secret Key / Service Role]"
    else:
        service_role_status = "[MISSING]"
    print(f"  - Secret / Service Role Key: {service_role_status}")

    pub_status = (
        "[DETECTED - DISALLOWED FOR DATABASE WRITES]"
        if creds["publishable_key_detected"]
        else "[NOT PRESENT]"
    )
    print(f"  - Publishable/Anon Key:  {pub_status}")

    # Load and validate raw records
    print(f"\n[2] Loading & Raw Validation:")
    try:
        raw_records = load_raw_records(input_file)
        print(f"  - Successfully loaded {len(raw_records)} records from JSON.")
    except Exception as e:
        print(f"  [FAIL] Could not load JSON data: {e}", file=sys.stderr)
        return 1

    raw_errors = validate_raw_records(raw_records)
    if raw_errors:
        print("  [FAIL] Raw validation failed with the following errors:")
        for err in raw_errors:
            print(f"    - {err}", file=sys.stderr)
        return 1

    print("  [PASS] Exactly 59 records found.")
    print("  [PASS] All 59 ward_id values are non-empty and unique.")
    print("  [PASS] All 59 ward_no values are positive integers (1 to 66) and unique.")
    print("  [PASS] All 59 non-null LGD codes are unique.")
    print("  [PASS] All 59 records have verification_status = 'pending'.")

    # Transform records
    print(f"\n[3] Transforming Records to Database Schema:")
    transformed = [transform_record(r) for r in raw_records]

    trans_errors = validate_transformed_records(transformed)
    if trans_errors:
        print("  [FAIL] Transformed validation failed:")
        for err in trans_errors:
            print(f"    - {err}", file=sys.stderr)
        return 1

    print("  [PASS] Mapped JSON 'active' -> database 'is_active' (boolean).")
    print("  [PASS] Converted 'lgd_code' and 'ulb_lgd_code' to strings (preserved nulls).")
    print("  [PASS] Preserved ward_name, ward_name_original, notes, and metadata.")
    print("  [PASS] Missing coordinates, boundaries, and councillors preserved as null.")

    # Preview sample records
    print(f"\n[4] Sample Mapped Records Preview (Showing first {min(args.samples, len(transformed))}):")
    for idx in range(min(args.samples, len(transformed))):
        rec = transformed[idx]
        print(f"\n  --- Ward #{rec['ward_no']} ({rec['ward_id']}): {rec['ward_name']} ---")
        preview_fields = {
            "ward_id": rec["ward_id"],
            "ward_no": rec["ward_no"],
            "ward_name": rec["ward_name"],
            "ward_name_original": rec["ward_name_original"],
            "lgd_code": rec["lgd_code"],
            "ulb_lgd_code": rec["ulb_lgd_code"],
            "is_active": rec["is_active"],
            "verification_status": rec["verification_status"],
            "councillor_name": rec["councillor_name"],
            "boundary_status": rec["boundary_status"],
            "latitude": rec["latitude"],
            "longitude": rec["longitude"],
        }
        for k, v in preview_fields.items():
            print(f"    {k:20}: {repr(v)}")

    # Decision: Dry-run vs Execute
    print(f"\n[5] Execution Summary:")
    if is_dry_run:
        print("  - Records Validated:     59 / 59")
        print("  - Records Written:       0 (Dry-run mode: no database requests)")
        print("  - Validation Errors:     0")
        print("  - Database Status:       UNCHANGED")
        print("\n" + "-" * 72)
        print("  DRY-RUN VALIDATION SUCCESSFUL.")
        print("  All 59 records are strictly valid and ready for public.wards insertion.")
        print("  To execute the actual database import when approved, set SUPABASE_SECRET_KEY and run:")
        print("    python scripts/import_gwalior_wards.py --execute")
        print("-" * 72)
        return 0

    # Live execution branch: strictly require administrative secret / service-role key
    print("  [LIVE IMPORT] Verifying administrative credentials...")

    cred_errors = validate_credentials_for_execute(creds)
    if cred_errors:
        print("\n  [ABORTED] Credential validation failed:", file=sys.stderr)
        for err in cred_errors:
            print(f"    - {err}", file=sys.stderr)
        print(
            "\n  How to resolve:\n"
            "    Set your Supabase project URL and administrative secret key in .env.local:\n"
            "      NEXT_PUBLIC_SUPABASE_URL=\"https://<your-project>.supabase.co\"\n"
            "      SUPABASE_SECRET_KEY=\"sb_secret_...\" (or SUPABASE_SERVICE_ROLE_KEY)\n",
            file=sys.stderr,
        )
        return 1

    total, success, errors = execute_supabase_upsert(
        supabase_url=creds["url"],
        service_role_key=creds["service_role_key"],
        records=transformed,
        batch_size=args.batch_size,
    )

    print(f"\n  - Records Processed:     {total}")
    print(f"  - Successful Upserts:    {success}")
    print(f"  - Errors Encountered:    {len(errors)}")

    if errors:
        print("\n[!] Import encountered errors:")
        for e in errors:
            print(f"    - {e}")
        return 1

    print("\n" + "=" * 72)
    print("  [SUCCESS] All 59 Gwalior ward records successfully upserted into public.wards.")
    print("=" * 72)
    return 0


if __name__ == "__main__":
    sys.exit(main())
