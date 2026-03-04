provider "aws" {
  region = "ap-south-1"
}

############################
# READ DB SECRET
############################

data "aws_secretsmanager_secret" "db_secret" {
  name = "farmer-fintech-db-secret"
}

data "aws_secretsmanager_secret_version" "db_secret_value" {
  secret_id = data.aws_secretsmanager_secret.db_secret.id
}

locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db_secret_value.secret_string)
}

############################
# VPC
############################

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  enable_dns_hostnames = true
  enable_dns_support   = true
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-south-1a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "ap-south-1a"
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

############################
# SECURITY GROUPS
############################

resource "aws_security_group" "alb_sg" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port = 80
    to_port   = 80
    protocol  = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_sg" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds_sg" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }
}

############################
# ALB
############################

resource "aws_lb" "alb" {
  name               = "farmer-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]

  subnets = [aws_subnet.public.id]
}

resource "aws_lb_target_group" "tg" {
  name        = "farmer-backend-tg"
  port        = 8000
  protocol    = "HTTP"
  target_type = "ip"

  vpc_id = aws_vpc.main.id

  health_check {
    path = "/health"
  }
}

resource "aws_lb_listener" "listener" {

  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg.arn
  }
}

############################
# ECR
############################

resource "aws_ecr_repository" "backend" {
  name = "farmer-backend"
}

############################
# ECS
############################

resource "aws_ecs_cluster" "cluster" {
  name = "farmer-cluster"
}

resource "aws_cloudwatch_log_group" "logs" {
  name = "/ecs/farmer-backend"
}

resource "aws_iam_role" "ecs_execution_role" {
  name = "ecsTaskExecutionRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_ecs_task_definition" "task" {

  family                   = "farmer-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]

  cpu    = "512"
  memory = "1024"

  execution_role_arn = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([

    {
      name  = "backend"
      image = "${aws_ecr_repository.backend.repository_url}:latest"

      portMappings = [
        {
          containerPort = 8000
        }
      ]

      environment = [
        {
          name  = "DB_HOST"
          value = aws_db_instance.postgres.address
        }
      ]

      secrets = [
        {
          name      = "DB_USERNAME"
          valueFrom = data.aws_secretsmanager_secret.db_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          awslogs-group         = aws_cloudwatch_log_group.logs.name
          awslogs-region        = "ap-south-1"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "service" {

  name            = "farmer-backend-service"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.task.arn

  desired_count = 1
  launch_type   = "FARGATE"

  network_configuration {

    subnets = [aws_subnet.private.id]

    security_groups = [
      aws_security_group.ecs_sg.id
    ]

    assign_public_ip = false
  }

  load_balancer {

    target_group_arn = aws_lb_target_group.tg.arn
    container_name   = "backend"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.listener]
}

############################
# RDS
############################

resource "aws_db_instance" "postgres" {

  identifier = "farmer-db"

  engine         = "postgres"
  instance_class = "db.t3.micro"

  allocated_storage = 20

  db_name  = "farmerdb"
  username = local.db_creds.username
  password = local.db_creds.password

  vpc_security_group_ids = [
    aws_security_group.rds_sg.id
  ]

  skip_final_snapshot = true
}

############################
# OUTPUTS
############################

output "alb_url" {
  value = aws_lb.alb.dns_name
}

output "ecr_repo" {
  value = aws_ecr_repository.backend.repository_url
}