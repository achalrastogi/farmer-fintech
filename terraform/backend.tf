terraform {
  backend "s3" {
    bucket         = "farmer-terraform-state"
    key            = "infra/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "terraform-lock"
  }
}