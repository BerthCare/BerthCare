terraform {
  backend "s3" {
    bucket         = "berthcare-terraform-state"
    key            = "global/terraform.tfstate"
    region         = "ca-central-1"
    dynamodb_table = "berthcare-terraform-locks"
    encrypt        = true
  }
}
