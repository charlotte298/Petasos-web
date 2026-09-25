#!/usr/bin/env bash
# One-time setup for the Pulumi state backend. Safe to re-run.
#
# Creates, in the amyconnects project:
#   - gs://amyconnects-pulumi-state   private, versioned bucket that holds the Pulumi state
#   - KMS key ring "pulumi" + key "amy-landing" (global) that encrypts secrets in that state
# then creates the "prod" stack with the KMS secrets provider.
#
# Afterwards, commit infra/Pulumi.prod.yaml: `pulumi stack init` adds the secretsprovider and
# encryptedkey lines that everyone deploying needs.
set -euo pipefail

PROJECT="${PROJECT:-amyconnects}"
LOCATION="${LOCATION:-us-central1}"
BUCKET="${BUCKET:-amyconnects-pulumi-state}"
KEYRING="${KEYRING:-pulumi}"
KEY="${KEY:-amy-landing}"
STACK="${STACK:-prod}"
SECRETS_PROVIDER="gcpkms://projects/${PROJECT}/locations/global/keyRings/${KEYRING}/cryptoKeys/${KEY}"

cd "$(dirname "$0")"

if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
  echo "Run 'gcloud auth application-default login' first (Pulumi uses Application Default Credentials)." >&2
  exit 1
fi

gcloud services enable storage.googleapis.com cloudkms.googleapis.com --project "$PROJECT"

if gcloud storage buckets describe "gs://${BUCKET}" --project "$PROJECT" >/dev/null 2>&1; then
  echo "Bucket gs://${BUCKET} already exists."
else
  gcloud storage buckets create "gs://${BUCKET}" \
    --project "$PROJECT" \
    --location "$LOCATION" \
    --uniform-bucket-level-access \
    --public-access-prevention
fi
# Versioning lets you recover an earlier state file if one ever gets corrupted.
gcloud storage buckets update "gs://${BUCKET}" --versioning

if gcloud kms keyrings describe "$KEYRING" --location global --project "$PROJECT" >/dev/null 2>&1; then
  echo "Key ring ${KEYRING} already exists."
else
  gcloud kms keyrings create "$KEYRING" --location global --project "$PROJECT"
fi
if gcloud kms keys describe "$KEY" --keyring "$KEYRING" --location global --project "$PROJECT" >/dev/null 2>&1; then
  echo "Key ${KEY} already exists."
else
  gcloud kms keys create "$KEY" --keyring "$KEYRING" --location global --purpose encryption --project "$PROJECT"
fi

if [ ! -d venv ]; then
  python3 -m venv venv
  venv/bin/pip install -q -r requirements.txt
fi

if pulumi stack ls --json 2>/dev/null | grep -q "\"name\": \"${STACK}\""; then
  echo "Stack ${STACK} already exists."
else
  pulumi stack init "$STACK" --secrets-provider "$SECRETS_PROVIDER"
fi

echo
echo "Done. Next:"
echo "  git add infra/Pulumi.${STACK}.yaml && git commit   # keeps the secretsprovider/encryptedkey lines"
echo "  pulumi config set posthogKey phc_...                # optional"
echo "  pulumi config set formsEndpoint https://script.google.com/macros/s/.../exec"
echo "  pulumi up"
