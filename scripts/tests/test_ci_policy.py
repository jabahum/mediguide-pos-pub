import base64
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


changes = load("ci-changes")
credentials = load("ci-mobile-preflight")


class ChangesTest(unittest.TestCase):
    def test_docs_only_skips_apps(self):
        self.assertFalse(any(changes.classify(["docs/readme.md", "README.md"]).values()))

    def test_worker_only(self):
        self.assertEqual(["worker"], [key for key, value in changes.classify(["ai-worker/app/worker.py"]).items() if value])

    def test_backend_invalidates_consumers(self):
        result = changes.classify(["backend/internal/api/handlers.go"])
        for name in ("backend", "dashboard", "guidelines", "mobile"):
            self.assertTrue(result[name])

    def test_legacy_assets_invalidate_backend_image(self):
        self.assertTrue(changes.classify(["dashboard/samples/tool.html"])["backend"])
        self.assertTrue(changes.classify(["clinical-tools/tool.json"])["backend"])

    def test_shared_policy_checks_everything(self):
        for path in ("scripts/ci-changes.py", "proto/service.proto", ".github/workflows/mobile-release.yml", "VERSION", ".dockerignore"):
            self.assertTrue(all(changes.classify([path]).values()))

    def test_full_release_checks_everything(self):
        self.assertTrue(all(changes.classify([], full=True).values()))

    def test_component_scopes(self):
        for prefix, name in (("user_app", "mobile"), ("dashboard", "dashboard"), ("guidelines-platform", "guidelines"), ("infra", "infra")):
            self.assertTrue(changes.classify([prefix + "/file"])[name])


class CredentialsTest(unittest.TestCase):
    def android_env(self):
        env = {key: "test" for key in credentials.required_fields("firebase-android")}
        env["ANDROID_UPLOAD_KEYSTORE_BASE64"] = base64.b64encode(b"test-keystore").decode()
        account = {"project_id": "test", "client_email": "test@example.org", "private_key": "test"}
        env["FIREBASE_APP_DISTRIBUTION_SERVICE_ACCOUNT_BASE64"] = base64.b64encode(json.dumps(account).encode()).decode()
        env["FIREBASE_MOBILE_CONFIG_JSON"] = json.dumps({"MEDIGUIDE_FLAVOR": "staging", **{key: "test" for key in ("FIREBASE_PROJECT_ID", "FIREBASE_API_KEY", "FIREBASE_MESSAGING_SENDER_ID", "FIREBASE_ANDROID_APP_ID")}})
        return env

    def test_android_needs_no_apple_credentials(self):
        self.assertEqual([], credentials.validate("firebase-android", self.android_env()))

    def test_missing_secrets_only_report_names(self):
        self.assertIn("ANDROID_UPLOAD_KEYSTORE_BASE64", credentials.validate("firebase-android", {}))

    def test_invalid_base64_rejected(self):
        env = self.android_env()
        env["ANDROID_UPLOAD_KEYSTORE_BASE64"] = "not base64"
        self.assertEqual(["ANDROID_UPLOAD_KEYSTORE_BASE64"], credentials.validate("firebase-android", env))

    def test_wrong_flavor_rejected(self):
        env = self.android_env()
        env["MOBILE_FLAVOR"] = "production"
        self.assertIn("FIREBASE_MOBILE_CONFIG_JSON", credentials.validate("firebase-android", env))

    def test_destination_specific_apple_requirements(self):
        flight = credentials.required_fields("testflight")
        self.assertIn("APP_STORE_CONNECT_PRIVATE_KEY_BASE64", flight)
        self.assertNotIn("IOS_FIREBASE_PROVISIONING_PROFILE_BASE64", flight)
        self.assertNotIn("FIREBASE_APP_DISTRIBUTION_SERVICE_ACCOUNT_BASE64", flight)
        self.assertIn("IOS_APP_STORE_PROVISIONING_PROFILE_BASE64", credentials.required_fields("app-store"))

    def test_unknown_destination_fails(self):
        with self.assertRaises(ValueError):
            credentials.required_fields("unknown")


if __name__ == "__main__":
    unittest.main()
