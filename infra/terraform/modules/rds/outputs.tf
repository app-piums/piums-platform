output "db_endpoint"    { value = aws_db_instance.main.endpoint; sensitive = true }
output "db_ro_endpoint" { value = length(aws_db_instance.read_replica) > 0 ? aws_db_instance.read_replica[0].endpoint : aws_db_instance.main.endpoint; sensitive = true }
output "db_name"        { value = aws_db_instance.main.db_name }
