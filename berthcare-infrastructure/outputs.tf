output "vpc_id" {
  description = "ID of the created VPC."
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of public subnets."
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of private subnets."
  value       = module.vpc.private_subnet_ids
}

output "rds_endpoint" {
  description = "Endpoint for the RDS instance."
  value       = module.rds.endpoint
}

output "photos_bucket_name" {
  description = "S3 bucket name for photos."
  value       = module.s3.photos_bucket_name
}

output "exports_bucket_name" {
  description = "S3 bucket name for exports."
  value       = module.s3.exports_bucket_name
}

output "alb_dns_name" {
  description = "DNS name for the ALB."
  value       = module.ecs.alb_dns_name
}

output "internal_zone_id" {
  description = "Private hosted zone ID for internal DNS."
  value       = module.dns.zone_id
}

output "internal_alb_record" {
  description = "FQDN for the internal ALB alias record."
  value       = module.dns.record_fqdn
}
