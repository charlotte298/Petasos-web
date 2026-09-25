#!/usr/bin/env bash
# Run Pulumi as the amy-landing-deployer service account, without a key file.
#
# Builds an "impersonated_service_account" credentials file from your own gcloud Application
# Default Credentials and points GOOGLE_APPLICATION_CREDENTIALS at it for this command only, so
# the state backend (GCS), the KMS secrets provider and the GCP provider all act as the deployer.
# Your normal gcloud login is untouched.
#
#   ./pulumi.sh preview
#   ./pulumi.sh up
#
# Needs: `gcloud auth application-default login` once, and roles/iam.serviceAccountTokenCreator
# on the deployer (bootstrap.sh grants it to whoever runs it).
set -euo pipefail

PROJECT="${PROJECT:-amyconnects}"
DEPLOYER="${DEPLOYER:-amy-landing-deployer@${PROJECT}.iam.gserviceaccount.com}"
ADC="${CLOUDSDK_CONFIG:-$HOME/.config/gcloud}/application_default_credentials.json"
OUT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/amy-landing"
OUT="${OUT_DIR}/deployer-credentials.json"

if [ ! -f "$ADC" ]; then
  echo "No Application Default Credentials. Run: gcloud auth application-default login" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
umask 077
python3 - "$ADC" "$DEPLOYER" "$OUT" <<'EOF'
import json, sys
adc, sa, out = sys.argv[1:]
source = json.load(open(adc))
if source.get("type") == "impersonated_service_account":
    source = source["source_credentials"]  # ADC already impersonates something; start from the user
json.dump({
    "type": "impersonated_service_account",
    "service_account_impersonation_url":
        f"https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/{sa}:generateAccessToken",
    "delegates": [],
    "source_credentials": source,
}, open(out, "w"))
EOF

cd "$(dirname "$0")"
GOOGLE_APPLICATION_CREDENTIALS="$OUT" exec pulumi "$@"
