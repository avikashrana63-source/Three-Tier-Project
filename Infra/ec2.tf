# ==========================================
# 2. APPLICATION SERVER (Public Subnet)
# ==========================================
resource "aws_instance" "app_server" {
  ami           = var.ami_id
  instance_type = "t3.micro"

  # Placed in the Public Subnet (accessible from the internet)
  subnet_id = aws_subnet.public_subnet.id

  # Attached to the App/K3s Security Group
  vpc_security_group_ids = [aws_security_group.devops_sg.id]

  # SSH Key Pair variable applied here
  key_name = var.key_name

  tags = {
    Name = "devops-app-server"
  }

  # Bootstrap script to install Docker and Docker Compose automatically
  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io
              systemctl start docker
              systemctl enable docker
              curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose
              EOF
}

# ==========================================
# 3. POSTGRESQL SERVER (Private Subnet)
# ==========================================
resource "aws_instance" "db_server" {
  ami           = var.ami_id
  instance_type = "t3.micro"

  # Placed in the Private Subnet (completely isolated from the internet)
  subnet_id = aws_subnet.private_subnet.id

  # Attached to the Database Security Group (Only allows port 5432 from app_server)
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  # SSH Key Pair applied here as well (accessible internally via App Server if needed)
  key_name = var.key_name

  tags = {
    Name = "devops-db-server"
  }

  # Bootstrap script to install Docker on the database machine
  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io
              systemctl start docker
              systemctl enable docker
              EOF
}
