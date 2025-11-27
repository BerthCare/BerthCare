module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = var.vpc_cidr
  environment        = var.environment
  availability_zones = var.availability_zones
}

module "s3" {
  source = "./modules/s3"

  environment         = var.environment
  photos_bucket_name  = var.photos_bucket_name
  exports_bucket_name = var.exports_bucket_name
  task_role_arn       = var.task_role_arn
}

module "ecs" {
  source = "./modules/ecs"

  cluster_name                = var.cluster_name
  environment                 = var.environment
  vpc_id                      = module.vpc.vpc_id
  private_subnet_ids          = module.vpc.private_subnet_ids
  public_subnet_ids           = module.vpc.public_subnet_ids
  instance_type               = var.instance_type
  instance_profile_arn        = var.instance_profile_arn
  instance_security_group_ids = var.instance_security_group_ids
  min_size                    = var.min_size
  max_size                    = var.max_size
  desired_capacity            = var.desired_capacity
  app_port                    = var.app_port
  acm_certificate_arn         = aws_acm_certificate.this.arn
  s3_bucket_arns              = concat([module.s3.photos_bucket_arn, module.s3.exports_bucket_arn], var.s3_bucket_arns)
  secrets_manager_arns        = var.secrets_manager_arns
}

module "rds" {
  source = "./modules/rds"

  identifier                = var.identifier
  instance_class            = var.instance_class
  allocated_storage         = var.allocated_storage
  db_name                   = var.db_name
  db_username               = var.db_username
  db_password               = var.db_password
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  allowed_security_group_id = module.ecs.task_security_group_id
  backup_retention_period   = var.backup_retention_period
}

module "dns" {
  source = "./modules/dns"

  environment  = var.environment
  zone_name    = var.internal_zone_name
  vpc_id       = module.vpc.vpc_id
  alb_dns_name = module.ecs.alb_dns_name
  alb_zone_id  = module.ecs.alb_zone_id
}
