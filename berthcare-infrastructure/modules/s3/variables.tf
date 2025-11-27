variable "environment" {
  type        = string
  description = "Deployment environment (e.g., staging, production)."
}

variable "photos_bucket_name" {
  type        = string
  description = "S3 bucket name for storing photos."
}

variable "exports_bucket_name" {
  type        = string
  description = "S3 bucket name for storing exports."
}

variable "task_role_arn" {
  type        = string
  description = "IAM role ARN for ECS tasks granted access to buckets."
}
