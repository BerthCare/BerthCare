variable "identifier" {
  type        = string
  description = "Identifier for the RDS instance (e.g., berthcare-db-staging)."
}

variable "instance_class" {
  type        = string
  description = "RDS instance class (e.g., db.t3.micro)."
}

variable "allocated_storage" {
  type        = number
  description = "Allocated storage in GB."
}

variable "db_name" {
  type        = string
  description = "Database name to create."
}

variable "db_username" {
  type        = string
  description = "Master username for the database."
}

variable "db_password" {
  type        = string
  description = "Master password for the database."
  sensitive   = true
}

variable "vpc_id" {
  type        = string
  description = "VPC ID where the database will reside."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for the DB subnet group."
}

variable "allowed_security_group_id" {
  type        = string
  description = "Security group ID allowed to access the database (ECS tasks)."
}

variable "backup_retention_period" {
  type        = number
  description = "Backup retention period in days (must be >= 7 for compliance)."
  default     = 7
}
