#!/usr/bin/env python3
"""
Unit tests for scripts/import_gwalior_wards.py
Verifies validation logic, transformation rules, credential validation,
and rejection of publishable/anon keys for database writes.
"""

import copy
import json
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add project root to sys.path
import sys
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts.import_gwalior_wards import (
    load_raw_records,
    validate_raw_records,
    transform_record,
    validate_transformed_records,
    resolve_supabase_credentials,
    validate_credentials_for_execute,
    load_env_file,
    EXPECTED_RECORD_COUNT,
)


class TestGwaliorWardImport(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.preview_file = ROOT / "research" / "wards" / "gwalior_wards_import_preview.json"
        cls.raw_records = load_raw_records(cls.preview_file)

    def test_preview_record_count(self):
        """Verifies exactly 59 records are loaded from preview JSON."""
        self.assertEqual(len(self.raw_records), EXPECTED_RECORD_COUNT)

    def test_raw_records_valid(self):
        """Verifies all 59 records pass initial validation without errors."""
        errors = validate_raw_records(self.raw_records)
        self.assertEqual(errors, [], f"Expected 0 errors, got: {errors}")

    def test_reject_incorrect_count(self):
        """Verifies validation fails if record count is not 59."""
        truncated = self.raw_records[:-1]
        errors = validate_raw_records(truncated)
        self.assertTrue(any("Record count mismatch" in e for e in errors))

    def test_reject_duplicate_ward_id(self):
        """Verifies validation fails if duplicate ward_id exists."""
        corrupted = copy.deepcopy(self.raw_records)
        corrupted[1]["ward_id"] = corrupted[0]["ward_id"]
        errors = validate_raw_records(corrupted)
        self.assertTrue(any("Duplicate ward_id" in e for e in errors))

    def test_reject_duplicate_lgd_code(self):
        """Verifies validation fails if duplicate non-null lgd_code exists."""
        corrupted = copy.deepcopy(self.raw_records)
        corrupted[1]["lgd_code"] = corrupted[0]["lgd_code"]
        errors = validate_raw_records(corrupted)
        self.assertTrue(any("Duplicate non-null lgd_code" in e for e in errors))

    def test_reject_non_pending_status(self):
        """Verifies validation fails if verification_status is not 'pending'."""
        corrupted = copy.deepcopy(self.raw_records)
        corrupted[0]["verification_status"] = "verified"
        errors = validate_raw_records(corrupted)
        self.assertTrue(any("verification_status" in e for e in errors))

    def test_transform_record_mapping(self):
        """Verifies field mappings: active -> is_active, codes -> string, null preservation."""
        sample = {
            "ward_id": "GWL-W-001",
            "ward_no": 1,
            "ward_name": "Gargaj Ward",
            "ward_name_original": "Gargaj ward",
            "lgd_code": 4751,
            "city": "Gwalior",
            "state": "Madhya Pradesh",
            "ulb_name": "Gwalior Municipal Corporation",
            "ulb_lgd_code": 250694,
            "latitude": None,
            "longitude": None,
            "boundary_geojson": None,
            "boundary_status": "unavailable",
            "center_source": None,
            "councillor_name": "Saeeda Begum Arif Ali",
            "supervisor_name": None,
            "sanitary_inspector_name": None,
            "sanitation_zone": None,
            "verification_status": "pending",
            "source_name": "gwalior_wards_verified.json",
            "source_url": None,
            "source_updated_at": None,
            "last_verified_at": None,
            "notes": "Sample note",
            "active": True,
        }

        transformed = transform_record(sample)

        # active must be removed and mapped to is_active
        self.assertNotIn("active", transformed)
        self.assertIn("is_active", transformed)
        self.assertIs(transformed["is_active"], True)

        # lgd_code and ulb_lgd_code must be strings
        self.assertEqual(transformed["lgd_code"], "4751")
        self.assertEqual(transformed["ulb_lgd_code"], "250694")

        # Nulls and other fields must be preserved
        self.assertIsNone(transformed["latitude"])
        self.assertIsNone(transformed["longitude"])
        self.assertIsNone(transformed["boundary_geojson"])
        self.assertEqual(transformed["councillor_name"], "Saeeda Begum Arif Ali")
        self.assertEqual(transformed["ward_name_original"], "Gargaj ward")
        self.assertEqual(transformed["verification_status"], "pending")

    def test_all_transformed_records_valid(self):
        """Verifies transformed preview dataset passes all schema checks."""
        transformed = [transform_record(r) for r in self.raw_records]
        errors = validate_transformed_records(transformed)
        self.assertEqual(errors, [])


class TestCredentialValidation(unittest.TestCase):
    """Verifies that missing credentials and publishable/anon keys are rejected in execute mode."""

    def test_reject_missing_url_in_execute(self):
        creds = {
            "url": None,
            "service_role_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid_service_role_key_long_enough",
            "publishable_key_detected": False,
        }
        errors = validate_credentials_for_execute(creds)
        self.assertTrue(any("Missing required environment variable: SUPABASE_URL" in e for e in errors))

    def test_reject_missing_service_role_key_in_execute(self):
        creds = {
            "url": "https://xyzcompany.supabase.co",
            "service_role_key": None,
            "publishable_key_detected": False,
        }
        errors = validate_credentials_for_execute(creds)
        self.assertTrue(any("SUPABASE_SERVICE_ROLE_KEY" in e for e in errors))

    def test_reject_publishable_or_anon_key_in_execute(self):
        """
        CRITICAL TEST:
        When ONLY a publishable or anon key is detected, execute mode must explicitly reject it
        and refuse to perform database writes.
        """
        creds = {
            "url": "https://xyzcompany.supabase.co",
            "service_role_key": None,
            "publishable_key_detected": True,
        }
        errors = validate_credentials_for_execute(creds)
        self.assertTrue(any("REJECTED: Only publishable/anon keys were detected" in e for e in errors))
        self.assertTrue(any("Database writes to public.wards require administrative service-role privileges" in e for e in errors))

    def test_reject_placeholder_key_in_execute(self):
        creds = {
            "url": "https://xyzcompany.supabase.co",
            "service_role_key": "placeholder-service-role-secret",
            "publishable_key_detected": False,
        }
        errors = validate_credentials_for_execute(creds)
        self.assertTrue(any("placeholder or invalid key length detected" in e for e in errors))

    def test_accept_valid_service_role_credentials(self):
        creds = {
            "url": "https://validproject.supabase.co",
            "service_role_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.a_very_long_valid_service_role_key_secret_for_supabase",
            "publishable_key_detected": False,
        }
        errors = validate_credentials_for_execute(creds)
        self.assertEqual(errors, [])

    def test_accept_sb_secret_key_in_execute(self):
        """Verifies that modern Supabase sb_secret_ format is accepted as privileged secret key."""
        creds = {
            "url": "https://validproject.supabase.co",
            "service_role_key": "sb_secret_mock_test_key_12345678901234567890",
            "publishable_key_detected": False,
        }
        errors = validate_credentials_for_execute(creds)
        self.assertEqual(errors, [])

    def test_reject_sb_publishable_key_in_execute(self):
        """Verifies that modern sb_publishable_ keys are explicitly rejected for write operations."""
        creds = {
            "url": "https://validproject.supabase.co",
            "service_role_key": "sb_publishable_mock_test_key_12345678901234567890",
            "publishable_key_detected": False,
        }
        errors = validate_credentials_for_execute(creds)
        self.assertTrue(any("publishable" in e.lower() for e in errors))

    def test_reject_legacy_anon_jwt_in_execute(self):
        """Verifies that legacy anon JWTs (role: anon) are explicitly rejected for write operations."""
        # Standard legacy anon JWT with payload {"role": "anon"}
        # Header: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
        # Payload: eyJyb2xlIjoiYW5vbiJ9 ({"role":"anon"})
        # Sig: 12345678901234567890
        anon_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.12345678901234567890"
        creds = {
            "url": "https://validproject.supabase.co",
            "service_role_key": anon_jwt,
            "publishable_key_detected": False,
        }
        errors = validate_credentials_for_execute(creds)
        self.assertTrue(any("anon" in e.lower() for e in errors))

    def test_reject_matching_publishable_key_in_execute(self):
        """Verifies that secret key matching an environment publishable key is rejected."""
        fake_pub_key = "custom_publishable_key_that_is_at_least_20_chars_long"
        test_env = {
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": fake_pub_key,
        }
        with patch.dict("os.environ", test_env, clear=True):
            creds = {
                "url": "https://validproject.supabase.co",
                "service_role_key": fake_pub_key,
                "publishable_key_detected": True,
            }
            errors = validate_credentials_for_execute(creds)
            self.assertTrue(any("matches NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" in e for e in errors))

    def test_accept_next_public_supabase_url(self):
        """Verifies NEXT_PUBLIC_SUPABASE_URL is accepted as the project URL."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            test_env = {
                "NEXT_PUBLIC_SUPABASE_URL": "https://ugkpeghwuzzasdhkowag.supabase.co",
                "SUPABASE_SECRET_KEY": "sb_secret_valid_key_12345678901234567890",
            }
            with patch.dict("os.environ", test_env, clear=True):
                creds = resolve_supabase_credentials(Path(tmpdir))
                self.assertEqual(creds["url"], "https://ugkpeghwuzzasdhkowag.supabase.co")
                errors = validate_credentials_for_execute(creds)
                self.assertEqual(errors, [])

    def test_avoid_requiring_legacy_service_role_key(self):
        """Verifies that modern SUPABASE_SECRET_KEY does not require legacy service_role keys or naming."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            test_env = {
                "SUPABASE_URL": "https://ugkpeghwuzzasdhkowag.supabase.co",
                "SUPABASE_SECRET_KEY": "sb_secret_valid_key_12345678901234567890",
            }
            with patch.dict("os.environ", test_env, clear=True):
                creds = resolve_supabase_credentials(Path(tmpdir))
                self.assertEqual(creds["service_role_key"], "sb_secret_valid_key_12345678901234567890")
                errors = validate_credentials_for_execute(creds)
                self.assertEqual(errors, [])

    def test_resolve_credentials_never_assigns_publishable_key_to_service_role(self):
        """
        Verifies that resolve_supabase_credentials never puts publishable keys into service_role_key.
        """
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            test_env = {
                "NEXT_PUBLIC_SUPABASE_URL": "https://test.supabase.co",
                "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_anon_key_only",
            }
            with patch.dict("os.environ", test_env, clear=True):
                creds = resolve_supabase_credentials(Path(tmpdir))
                self.assertEqual(creds["url"], "https://test.supabase.co")
                self.assertIsNone(creds["service_role_key"])
                self.assertTrue(creds["publishable_key_detected"])

    def test_load_env_file_detects_existing_file(self):
        """Verifies that load_env_file successfully loads .env.local if present."""
        env_local = ROOT / ".env.local"
        if env_local.is_file():
            existed, keys = load_env_file(env_local)
            self.assertTrue(existed)


if __name__ == "__main__":
    unittest.main()
