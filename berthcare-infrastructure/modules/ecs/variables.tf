variable "cluster_name" {
  type        = string
  description = "ECS cluster name."
}

variable "environment" {
  type        = string
  description = "Deployment environment (e.g., staging, production)."
}

variable "vpc_id" {
  type        = string
  description = "VPC ID for ECS networking resources."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for ECS instances and tasks."
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Public subnet IDs for ALB."
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
  description = "Security groups applied to ECS instances."
}

variable "min_size" {
  type        = number
  description = "Minimum size of the ASG."
}

variable "max_size" {
  type        = number
  description = "Maximum size of the ASG."
}

variable "desired_capacity" {
  type        = number
  description = "Desired capacity of the ASG."
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
  description = "S3 bucket ARNs ECS tasks need access to."
  default     = []
}

variable "secrets_manager_arns" {
  type        = list(string)
  description = "Secrets Manager ARNs ECS tasks need access to."
  default     = []
}
