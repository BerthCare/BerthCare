provider "aws" {
  region = "ca-central-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      Region      = "ca-central-1"
    }
  }
}
