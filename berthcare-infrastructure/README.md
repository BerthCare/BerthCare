# BerthCare Infrastructure

## Prerequisites
- Terraform >= 1.5.0 (`terraform -version`)
- AWS CLI installed (`aws --version`)
- AWS credentials configured (via `aws configure` or environment vars such as `AWS_PROFILE`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AWS_REGION`)

## Initialization
Run from the repository root of `berthcare-infrastructure`.

1) Ensure the backend config exists for the target environment (e.g., `envs/staging/backend.hcl` or `envs/production/backend.hcl`).
2) Initialize Terraform with the backend config:

```bash
# Example for staging
terraform init -backend-config=envs/staging/backend.hcl

# Example for production
terraform init -backend-config=envs/production/backend.hcl
```

## Plan and Apply
Use environment-specific variable files to keep state and configuration separated.

### Staging
```bash
terraform plan -var-file=envs/staging.tfvars -out=plan-staging.tfplan
terraform apply plan-staging.tfplan
```

### Production
```bash
terraform plan -var-file=envs/production.tfvars -out=plan-production.tfplan
terraform apply plan-production.tfplan
```

> Tip: Always review the plan output before applying, and ensure you are targeting the correct environment.
