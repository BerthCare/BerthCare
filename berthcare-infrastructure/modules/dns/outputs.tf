output "zone_id" {
  description = "Private hosted zone ID."
  value       = aws_route53_zone.private.zone_id
}

output "record_fqdn" {
  description = "FQDN of the ALB alias record."
  value       = aws_route53_record.alb_alias.fqdn
}
