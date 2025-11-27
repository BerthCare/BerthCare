locals {
  name_prefix = var.identifier
}

resource "aws_db_subnet_group" "this" {
  name       = "${local.name_prefix}-subnets"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${local.name_prefix}-subnets"
  }
}

resource "aws_security_group" "db" {
  name        = "${local.name_prefix}-db-sg"
  description = "Allow Postgres from ECS tasks only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Postgres from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.allowed_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-db-sg"
  }
}

resource "aws_db_instance" "this" {
  identifier              = var.identifier
  engine                  = "postgres"
  engine_version          = "15.4"
  instance_class          = var.instance_class
  allocated_storage       = var.allocated_storage
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  port                    = 5432
  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  storage_encrypted       = true
  backup_retention_period = var.backup_retention_period
  publicly_accessible     = false
  skip_final_snapshot     = true
  apply_immediately       = true
  deletion_protection     = false
  copy_tags_to_snapshot   = true

  tags = {
    Name = "${local.name_prefix}-db"
  }
}
