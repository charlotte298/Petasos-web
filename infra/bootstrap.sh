#!/usr/bin/env bash
# One-time setup for deploying the Amy landing page. Safe to re-run.
#
# Run as a person who can manage IAM in the project (needs resourcemanager.projects.setIamPolicy,
# iam.serviceAccounts.create/setIamPolicy, storage.buckets.create, cloudkms admin). It creates,
# in the amyconnects project:
#
#   amy-landing-deployer@   service account that runs `pulumi up` (no keys; you impersonate it)
#   amy-landing-run@        service account the Cloud Run container runs as (no roles at all)
#   gs://amyconnects-pulumi-state   private, versioned bucket for the Pulumi state
#   KMS pulumi/amy-landing  key that encrypts secrets in the state
#
# and grants the deployer only what the stack needs. Then it creates the "prod" stack.
# Afterwards, commit infra/Pulumi.prod.yaml (stack init adds the KMS secretsprovider lines).
set -euo pipefail

PROJECT="${PROJECT:-amyconnects}"
LOCATION="${LOCATION:-us-central1}"
BUCKET="${BUCKET:-amyconnects-pulumi-state}"
KEYRING="${KEYRING:-pulumi}"
KEY="${KEY:-amy-landing}"
STACK="${STACK:-prod}"
DEPLOYER="amy-landing-deployer@${PROJECT}.iam.gserviceaccount.com"
RUNTIME="amy-landing-run@${PROJECT}.iam.gserviceaccount.com"
KEY_ID="projects/${PROJECT}/locations/global/keyRings/${KEYRING}/cryptoKeys/${KEY}"

cd "$(dirname "$0")"
ME="$(gcloud config get-value account 2>/dev/null)"
echo "Setting up as ${ME} in project ${PROJECT}"

gcloud services enable iam.googleapis.com iamcredentials.googleapis.com storage.googleapis.com \
  cloudkms.googleapis.com --project "$PROJECT"

# --- Service accounts ----------------------------------------------------------------------
ensure_sa() {
  local id="$1" name="$2"
  gcloud iam service-accounts describe "${id}@${PROJECT}.iam.gserviceaccount.com" --project "$PROJECT" >/dev/null 2>&1 \
    || gcloud iam service-accounts create "$id" --display-name "$name" --project "$PROJECT"
}
ensure_sa amy-landing-deployer "Amy landing page: Pulumi deployer"
ensure_sa amy-landing-run "Amy landing page: Cloud Run runtime (no roles)"

# The deployer manages exactly these services.
for role in roles/run.admin roles/artifactregistry.admin roles/dns.admin \
            roles/compute.loadBalancerAdmin roles/serviceusage.serviceUsageAdmin; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member "serviceAccount:${DEPLOYER}" \
    --role "$role" --condition None --quiet >/dev/null
done

# Storage only on the state bucket (IAM condition), not every bucket in the project.
gcloud projects add-iam-policy-binding "$PROJECT" --member "serviceAccount:${DEPLOYER}" \
  --role roles/storage.admin --quiet >/dev/null \
  --condition "expression=resource.name.startsWith(\"projects/_/buckets/${BUCKET}\"),title=pulumi-state-bucket-only,description=Only the Pulumi state bucket"

# The deployer may deploy Cloud Run as the runtime account, and nothing else.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME" --project "$PROJECT" \
  --member "serviceAccount:${DEPLOYER}" --role roles/iam.serviceAccountUser --quiet >/dev/null

# Whoever runs this may impersonate the deployer (keyless; used by ./pulumi.sh).
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER" --project "$PROJECT" \
  --member "user:${ME}" --role roles/iam.serviceAccountTokenCreator --quiet >/dev/null

# --- State bucket --------------------------------------------------------------------------
if ! gcloud storage buckets create "gs://${BUCKET}" --project "$PROJECT" --location "$LOCATION" \
      --uniform-bucket-level-access --public-access-prevention 2>/tmp/amy-bucket.err; then
  grep -q "409" /tmp/amy-bucket.err && echo "Bucket gs://${BUCKET} already exists." || { cat /tmp/amy-bucket.err >&2; exit 1; }
fi

# --- KMS key -------------------------------------------------------------------------------
gcloud kms keyrings describe "$KEYRING" --location global --project "$PROJECT" >/dev/null 2>&1 \
  || gcloud kms keyrings create "$KEYRING" --location global --project "$PROJECT"
gcloud kms keys describe "$KEY" --keyring "$KEYRING" --location global --project "$PROJECT" >/dev/null 2>&1 \
  || gcloud kms keys create "$KEY" --keyring "$KEYRING" --location global --purpose encryption --project "$PROJECT"
gcloud kms keys add-iam-policy-binding "$KEY" --keyring "$KEYRING" --location global --project "$PROJECT" \
  --member "serviceAccount:${DEPLOYER}" --role roles/cloudkms.cryptoKeyEncrypterDecrypter --quiet >/dev/null

# --- As the deployer from here on ----------------------------------------------------------
echo "Waiting for IAM to propagate..."
for _ in $(seq 1 30); do
  gcloud storage buckets update "gs://${BUCKET}" --versioning --impersonate-service-account "$DEPLOYER" >/dev/null 2>&1 && break
  sleep 10
done
gcloud storage buckets describe "gs://${BUCKET}" --impersonate-service-account "$DEPLOYER" \
  --format "value(versioning_enabled)" | grep -qi true || { echo "Deployer can't manage the bucket yet; re-run in a minute." >&2; exit 1; }

if [ ! -d venv ]; then
  python3 -m venv venv
  venv/bin/pip install -q -r requirements.txt
fi
if ./pulumi.sh stack ls --json 2>/dev/null | grep -q "\"name\": \"${STACK}\""; then
  echo "Stack ${STACK} already exists."
else
  ./pulumi.sh stack init "$STACK" --secrets-provider "gcpkms://${KEY_ID}"
fi

echo
echo "Done. Deployer: ${DEPLOYER}  Runtime: ${RUNTIME}"
echo "Next: commit infra/Pulumi.${STACK}.yaml, then ./pulumi.sh up"
