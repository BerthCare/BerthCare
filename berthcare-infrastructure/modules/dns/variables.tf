variable "zone_name" {
  type        = string
  description = "Route 53 private hosted zone name (e.g., berthcare.internal)."
}

variable "environment" {
  type        = string
  description = "Deployment environment (e.g., dev, staging, production)."
}

variable "vpc_id" {
  type        = string
  description = "VPC ID to associate with the private hosted zone."
}

variable "alb_dns_name" {
  type        = string
  description = "DNS name of the Application Load Balancer for alias target."
}

variable "alb_zone_id" {
  type        = string
  description = "Hosted zone ID of the Application Load Balancer for alias target."
}
