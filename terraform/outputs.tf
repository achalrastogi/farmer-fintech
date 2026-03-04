output "ecs_cluster_name" {
  value = aws_ecs_cluster.cluster.name
}

output "ecr_repo_url" {
  value = aws_ecr_repository.backend_repo.repository_url
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}