variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC."
  default     = "10.0.0.0/16"
}

variable "environment" {
  type        = string
  description = "Deployment environment (e.g., staging, production)."
}

variable "availability_zones" {
  type        = list(string)
  description = "Availability zones to spread subnets across. Defaults to ca-central-1a and ca-central-1b."
  default     = []
}
