variable "aws_region" {
  default = "ap-south-1"
}

variable "db_user" {
  description = "Postgres username"
}

variable "db_password" {
  description = "Postgres password"
}

variable "project_name" {
  default = "farmer-fintech"
}