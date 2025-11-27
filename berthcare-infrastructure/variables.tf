variable "environment" {
  type        = string
  description = "Deployment environment (e.g., staging, production)."
}

variable "project_name" {
  type        = string
  description = "Name of the project for tagging and resource grouping."
  default     = "berthcare"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC."
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "Availability zones to deploy into."
  default     = []
}

variable "photos_bucket_name" {
  type        = string
  description = "S3 bucket name for photos."
}

variable "exports_bucket_name" {
  type        = string
  description = "S3 bucket name for exports."
}

variable "cluster_name" {
  type        = string
  description = "ECS cluster name."
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type for ECS capacity."
}

variable "instance_profile_arn" {
  type        = string
  description = "IAM instance profile ARN for ECS instances."
}

variable "instance_security_group_ids" {
  type        = list(string)
  description = "Security groups for ECS instances."
  default     = []
}

variable "min_size" {
  type        = number
  description = "Minimum size of the ECS ASG."
}

variable "max_size" {
  type        = number
  description = "Maximum size of the ECS ASG."
}

variable "desired_capacity" {
  type        = number
  description = "Desired capacity of the ECS ASG."
}

variable "app_port" {
  type        = number
  description = "Application port for ECS tasks."
  default     = 3000
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN for ALB HTTPS listener."
}

variable "s3_bucket_arns" {
  type        = list(string)
  description = "Additional S3 bucket ARNs ECS tasks need access to."
  default     = []
}

variable "secrets_manager_arns" {
  type        = list(string)
  description = "Secrets Manager ARNs ECS tasks need access to."
  default     = []
}

variable "identifier" {
  type        = string
  description = "Identifier for the RDS instance."
}

variable "instance_class" {
  type        = string
  description = "RDS instance class."
}

variable "allocated_storage" {
  type        = number
  description = "Allocated storage for RDS in GB."
}

variable "db_name" {
  type        = string
  description = "Database name."
}

variable "db_username" {
  type        = string
  description = "Database master username."
}

variable "db_password" {
  type        = string
  description = "Database master password."
  sensitive   = true
}

variable "backup_retention_period" {
  type        = number
  description = "Backup retention period in days."
  default     = 7
}

variable "task_role_arn" {
  type        = string
  description = "IAM role ARN for ECS tasks (used for S3 bucket policies)."
}

variable "internal_zone_name" {
  type        = string
  description = "Private Route 53 zone for internal DNS."
  default     = "berthcare.internal"
}
