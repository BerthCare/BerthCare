bucket         = "berthcare-terraform-state"
key            = "envs/staging/terraform.tfstate"
region         = "ca-central-1"
dynamodb_table = "berthcare-terraform-locks"
encrypt        = true
