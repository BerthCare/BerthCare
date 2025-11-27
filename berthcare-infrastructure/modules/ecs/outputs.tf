output "cluster_id" {
  description = "ID of the ECS cluster."
  value       = aws_ecs_cluster.this.id
}

output "cluster_name" {
  description = "Name of the ECS cluster."
  value       = aws_ecs_cluster.this.name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer."
  value       = aws_lb.this.dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the ALB."
  value       = aws_lb.this.zone_id
}

output "task_security_group_id" {
  description = "Security group ID for ECS tasks."
  value       = aws_security_group.tasks.id
}

output "task_execution_role_arn" {
  description = "IAM role ARN for ECS task execution."
  value       = aws_iam_role.task_execution.arn
}

output "task_role_arn" {
  description = "IAM role ARN for ECS task."
  value       = aws_iam_role.task.arn
}
