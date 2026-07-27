# FinVault — AWS Infrastructure (Terraform)
# Provisions: ECS Fargate, RDS PostgreSQL, DocumentDB, MSK Kafka, API Gateway, S3+CloudFront

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket = "finvault-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" { region = var.aws_region }

variable "aws_region"   { default = "us-east-1" }
variable "app_name"     { default = "finvault" }
variable "environment"  { default = "production" }
variable "db_password"  { sensitive = true }

# ── VPC ──────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "${var.app_name}-vpc" }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "${var.app_name}-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "${var.app_name}-private-${count.index}" }
}

data "aws_availability_zones" "available" { state = "available" }

# ── ECS Cluster ───────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
  setting { name = "containerInsights", value = "enabled" }
}

# ── RDS PostgreSQL ────────────────────────────────────────────
resource "aws_db_instance" "postgres" {
  identifier             = "${var.app_name}-postgres"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "finvault"
  username               = "finvault_user"
  password               = var.db_password
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  skip_final_snapshot    = false
  deletion_protection    = true
  backup_retention_period = 7
  tags = { Name = "${var.app_name}-rds" }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet"
  subnet_ids = aws_subnet.private[*].id
}

# ── DocumentDB (MongoDB-compatible) ───────────────────────────
resource "aws_docdb_cluster" "main" {
  cluster_identifier      = "${var.app_name}-docdb"
  engine                  = "docdb"
  master_username         = "finvault_user"
  master_password         = var.db_password
  db_subnet_group_name    = aws_docdb_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.docdb.id]
  skip_final_snapshot     = false
  deletion_protection     = true
}

resource "aws_docdb_subnet_group" "main" {
  name       = "${var.app_name}-docdb-subnet"
  subnet_ids = aws_subnet.private[*].id
}

# ── MSK (Managed Kafka) ───────────────────────────────────────
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "${var.app_name}-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 2

  broker_node_group_info {
    instance_type   = "kafka.t3.small"
    client_subnets  = aws_subnet.private[*].id
    security_groups = [aws_security_group.kafka.id]
    storage_info {
      ebs_storage_info { volume_size = 20 }
    }
  }
}

# ── S3 + CloudFront (Frontend) ────────────────────────────────
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.app_name}-frontend-${var.environment}"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${var.app_name}"
  }
  default_cache_behavior {
    target_origin_id       = "S3-${var.app_name}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }
  # SPA routing: return index.html for 404
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}

# ── Security Groups ───────────────────────────────────────────
resource "aws_security_group" "rds" {
  name   = "${var.app_name}-rds-sg"
  vpc_id = aws_vpc.main.id
  ingress { from_port = 5432; to_port = 5432; protocol = "tcp"; cidr_blocks = ["10.0.0.0/16"] }
}

resource "aws_security_group" "docdb" {
  name   = "${var.app_name}-docdb-sg"
  vpc_id = aws_vpc.main.id
  ingress { from_port = 27017; to_port = 27017; protocol = "tcp"; cidr_blocks = ["10.0.0.0/16"] }
}

resource "aws_security_group" "kafka" {
  name   = "${var.app_name}-kafka-sg"
  vpc_id = aws_vpc.main.id
  ingress { from_port = 9092; to_port = 9092; protocol = "tcp"; cidr_blocks = ["10.0.0.0/16"] }
}

# ── CloudWatch Log Groups ─────────────────────────────────────
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.app_name}/backend"
  retention_in_days = 30
}

output "cloudfront_url" { value = aws_cloudfront_distribution.frontend.domain_name }
output "rds_endpoint"   { value = aws_db_instance.postgres.endpoint }
output "docdb_endpoint" { value = aws_docdb_cluster.main.endpoint }
output "kafka_brokers"  { value = aws_msk_cluster.kafka.bootstrap_brokers }
