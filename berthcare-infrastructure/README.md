# BerthCare Infrastructure

## Overview
Terraform stack for BerthCare’s platform (networking, compute/ECS, RDS PostgreSQL, S3, and supporting AWS services) with environment-specific state.

## Architecture / Technical Blueprint
See the end-to-end system diagram in the Technical Blueprint: [Architecture Overview](../project-documentation/technical-blueprint.md#the-simplest-thing-that-could-possibly-work).

## Prerequisites
- Terraform >= 1.5.0 (`terraform -version`)
- AWS CLI installed (`aws --version`)
- AWS credentials configured (via `aws configure` or environment vars such as `AWS_PROFILE`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AWS_REGION`)

## How to Run Locally
Run from the repository root of `berthcare-infrastructure`.

1) Pick environment and confirm backend config exists: `environments/dev|staging|production/backend.hcl`.
2) Initialize Terraform with the backend config (sets S3 state and DynamoDB locks):

```bash
# Example for staging
terraform init -backend-config=environments/staging/backend.hcl

# Example for production
terraform init -backend-config=environments/production/backend.hcl

# Example for dev
terraform init -backend-config=environments/dev/backend.hcl
```

## Plan and Apply
Use environment-specific variable files to keep state and configuration separated.

### Staging
```bash
terraform plan -var-file=environments/staging/terraform.tfvars -out=plan-staging.tfplan
terraform apply plan-staging.tfplan
```

### Production
```bash
terraform plan -var-file=environments/production/terraform.tfvars -out=plan-production.tfplan
terraform apply plan-production.tfplan
```

> Tip: Always review the plan output before applying, and ensure you are targeting the correct environment.

## Environments
- **dev**: state backend `environments/dev/backend.hcl`; vars `environments/dev/terraform.tfvars`; region `ca-central-1`.
- **staging**: state backend `environments/staging/backend.hcl`; vars `environments/staging/terraform.tfvars`; region `ca-central-1`.
- **production**: state backend `environments/production/backend.hcl`; vars `environments/production/terraform.tfvars`; region `ca-central-1`.

Promotion flow: apply changes to dev first, validate resources/tests, then plan/apply staging, then production. Always review the plan file you apply and confirm the backend/varfile match the target environment.

## Terraform Commands (per environment)
- Format & validate:  
  ```bash
  terraform fmt -recursive
  terraform validate
  ```
- Plan (example: dev):  
  ```bash
  terraform init -backend-config=environments/dev/backend.hcl
  terraform plan -var-file=environments/dev/terraform.tfvars -out=plan-dev.tfplan
  ```
- Apply (from reviewed plan):  
  ```bash
  terraform apply plan-dev.tfplan
  ```
- Destroy (use with care; match backend/varfile):  
  ```bash
  terraform destroy -var-file=environments/dev/terraform.tfvars
  ```

## Contributing / Engineering Rituals
- Branch/PR flow: short-lived branches (e.g., `infra/<topic>`), linked issues, at least one review before merge.
- Required gates before merge: `terraform fmt -recursive`, `terraform validate`, and any infrastructure-specific tests under `tests/`; include `terraform plan` output for the target environment in the PR.
- Docs/diagrams: update this README and any architecture references when changing modules, networking, or state layout.
- Security/compliance: no plaintext secrets in code; rely on AWS auth via profiles/role assumption; ensure tagging, TLS, and region constraints stay enforced (see tests).
- Plan verification and apply: reviewers must read the plan; apply only the reviewed plan file for the matching backend/varfile; for rollback, re-apply the previous known-good plan/state version (S3 versioning + DynamoDB lock protect state).
