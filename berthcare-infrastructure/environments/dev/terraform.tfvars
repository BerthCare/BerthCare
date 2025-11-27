environment  = "dev"
project_name = "berthcare"

# Networking
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["ca-central-1a", "ca-central-1b"]

# S3 buckets
photos_bucket_name   = "berthcare-dev-photos"
exports_bucket_name  = "berthcare-dev-exports"
task_role_arn        = "arn:aws:iam::123456789012:role/berthcare-dev-task"
s3_bucket_arns       = []
secrets_manager_arns = []

# ECS / ALB
cluster_name                = "berthcare-dev"
instance_type               = "t3.micro"
instance_profile_arn        = "arn:aws:iam::123456789012:instance-profile/berthcare-dev-ecs"
instance_security_group_ids = ["sg-0123456789abcdef0"]
min_size                    = 1
max_size                    = 2
desired_capacity            = 1
app_port                    = 3000
acm_certificate_arn         = "arn:aws:acm:ca-central-1:123456789012:certificate/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

# RDS
identifier              = "berthcare-dev"
instance_class          = "db.t3.micro"
allocated_storage       = 20
db_name                 = "berthcare"
db_username             = "berthcare_admin"
db_password             = "CHANGEME_DEV_DB_PASSWORD"
backup_retention_period = 7
