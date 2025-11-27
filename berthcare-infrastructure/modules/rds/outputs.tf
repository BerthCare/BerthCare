output "endpoint" {
  description = "Connection endpoint for the RDS instance."
  value       = aws_db_instance.this.address
}

output "port" {
  description = "Port the RDS instance listens on."
  value       = aws_db_instance.this.port
}

output "db_name" {
  description = "Database name configured on the instance."
  value       = aws_db_instance.this.db_name
}

output "security_group_id" {
  description = "Security group protecting the RDS instance."
  value       = aws_security_group.db.id
}
