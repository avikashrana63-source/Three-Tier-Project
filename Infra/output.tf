output "app_server_public_ip" {
  description = "Public IP address of the application server"
  value       = aws_instance.app_server.public_ip
}

output "app_server_public_dns" {
  description = "Public DNS name of the application server"
  value       = aws_instance.app_server.public_dns
}

output "db_server_private_ip" {
  description = "Private IP address of the PostgreSQL server"
  value       = aws_instance.db_server.private_ip
}

output "vpc_id" {
  description = "ID of the main VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public_subnet.id
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = aws_subnet.private_subnet.id
}

output "app_security_group_id" {
  description = "ID of the application server security group"
  value       = aws_security_group.devops_sg.id
}

output "db_security_group_id" {
  description = "ID of the PostgreSQL server security group"
  value       = aws_security_group.db_sg.id
}
