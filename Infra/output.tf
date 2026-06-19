# Show K3s Master public IP
output "master_public_ip" {
  value = aws_instance.master_server.public_ip
}

# Show K3s Worker public IP
output "worker_public_ip" {
  value = aws_instance.worker_server.public_ip
}

# Show K3s Master private IP
output "master_private_ip" {
  value = aws_instance.master_server.private_ip
}

# Show K3s Worker private IP
output "worker_private_ip" {
  value = aws_instance.worker_server.private_ip
}

# Show generated private key file path
output "private_key_path" {
  value = local_file.barista_private_key.filename
}

# Show VPC ID
output "vpc_id" {
  value = aws_vpc.main.id
}

# Show Security Group ID
output "security_group_id" {
  value = aws_security_group.devops_sg.id
}