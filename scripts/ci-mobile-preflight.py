#!/usr/bin/env python3
"""Check selected mobile credentials without printing their values or writing files."""
import base64
import json
import os
import plistlib
import sys

ANDROID = ["ANDROID_UPLOAD_KEYSTORE_BASE64", "ANDROID_UPLOAD_STORE_PASSWORD", "ANDROID_UPLOAD_KEY_ALIAS", "ANDROID_UPLOAD_KEY_PASSWORD"]
APPLE = ["IOS_DISTRIBUTION_CERTIFICATE_BASE64", "IOS_DISTRIBUTION_CERTIFICATE_PASSWORD", "APPLE_TEAM_ID"]
CONNECT = ["APP_STORE_CONNECT_KEY_ID", "APP_STORE_CONNECT_ISSUER_ID", "APP_STORE_CONNECT_PRIVATE_KEY_BASE64"]


def required_fields(destination):
    if destination == "production-all":
        return list(dict.fromkeys(required_fields("google-play") + required_fields("app-store")))
    if destination in {"ios-artifacts", "web-artifacts", "macos-artifacts"}:
        return ["FIREBASE_MOBILE_CONFIG_JSON"]
    required = ["FIREBASE_MOBILE_CONFIG_JSON"]
    if destination in {"all", "firebase-android", "google-play", "android-artifacts"}:
        required += ANDROID
    if destination in {"all", "firebase-android", "firebase-ios"}:
        required += ["FIREBASE_APP_DISTRIBUTION_SERVICE_ACCOUNT_BASE64"]
    if destination in {"all", "firebase-android"}:
        required += ["FIREBASE_ANDROID_APP_ID"]
    if destination in {"all", "firebase-ios", "testflight", "app-store"}:
        required += APPLE
    if destination in {"all", "firebase-ios"}:
        required += ["FIREBASE_IOS_APP_ID", "IOS_FIREBASE_PROVISIONING_PROFILE_BASE64", "IOS_FIREBASE_EXPORT_OPTIONS_PLIST_BASE64"]
    if destination in {"all", "testflight"}:
        required += CONNECT + ["IOS_TESTFLIGHT_PROVISIONING_PROFILE_BASE64", "IOS_TESTFLIGHT_EXPORT_OPTIONS_PLIST_BASE64"]
    if destination == "app-store":
        required += CONNECT + ["IOS_APP_STORE_PROVISIONING_PROFILE_BASE64", "IOS_APP_STORE_EXPORT_OPTIONS_PLIST_BASE64"]
    if destination == "google-play":
        required += ["GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64"]
    if destination not in {"all", "firebase-android", "firebase-ios", "testflight", "google-play", "app-store", "android-artifacts"}:
        raise ValueError("Unsupported destination")
    return required


def validate(destination, environ):
    invalid = []
    for name in required_fields(destination):
        value = environ.get(name, "")
        if not value.strip():
            invalid.append(name)
            continue
        try:
            if name.endswith("_BASE64"):
                decoded = base64.b64decode("".join(value.split()), validate=True)
                if not decoded:
                    raise ValueError()
                if "SERVICE_ACCOUNT" in name:
                    account = json.loads(decoded)
                    if not all(account.get(key) for key in ("client_email", "private_key", "project_id")):
                        raise ValueError()
                if "EXPORT_OPTIONS" in name:
                    options = plistlib.loads(decoded)
                    if not options.get("method") or not options.get("teamID"):
                        raise ValueError()
            if name == "FIREBASE_MOBILE_CONFIG_JSON":
                config = json.loads(value)
                keys = ["FIREBASE_PROJECT_ID", "FIREBASE_API_KEY", "FIREBASE_MESSAGING_SENDER_ID"]
                if destination in {"firebase-android", "google-play", "android-artifacts"}:
                    keys += ["FIREBASE_ANDROID_APP_ID"]
                elif destination in {"firebase-ios", "testflight", "app-store", "ios-artifacts", "all", "production-all"}:
                    keys += ["FIREBASE_IOS_APP_ID"]
                if destination in {"all", "production-all"}:
                    keys += ["FIREBASE_ANDROID_APP_ID"]
                if not all(isinstance(config.get(key), str) and config[key].strip() for key in keys):
                    raise ValueError()
                if config.get("MEDIGUIDE_FLAVOR") != environ.get("MOBILE_FLAVOR", "staging"):
                    raise ValueError()
        except (ValueError, TypeError, plistlib.InvalidFileException):
            invalid.append(name)
    return invalid


if __name__ == "__main__":
    errors = validate(sys.argv[1], os.environ)
    if errors:
        print("Missing or invalid mobile configuration: " + ", ".join(errors), file=sys.stderr)
        sys.exit(1)
    print("Selected mobile release credentials passed preflight.")
