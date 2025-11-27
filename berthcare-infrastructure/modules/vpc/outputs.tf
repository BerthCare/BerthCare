output "vpc_id" {
  description = "ID of the created VPC."
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets in the VPC."
  value       = [for az in local.azs : aws_subnet.public[az].id]
}

output "private_subnet_ids" {
  description = "IDs of private subnets in the VPC."
  value       = [for az in local.azs : aws_subnet.private[az].id]
}

output "nat_gateway_ids" {
  description = "IDs of NAT gateways for private subnet egress."
  value       = [aws_nat_gateway.this.id]
}
