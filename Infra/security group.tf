# Security Group for Application Servers and K3s Cluster
resource "aws_security_group" "devops_sg" {
  name        = "devops-security-group"
  description = "Allow SSH, HTTP, HTTPS, and K3s communication"
  vpc_id      = aws_vpc.main.id

  # SSH Access
  ingress {
    description = "SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP Access
  ingress {
    description = "HTTP Access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS Access
  ingress {
    description = "HTTPS Access"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # K3s Kubernetes API Server
  ingress {
    description = "K3s API Server"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  # Internal Communication Between Nodes
  ingress {
    description = "Internal VPC Communication"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
  }

  # Allow All Outbound Traffic
  egress {
    description = "Allow All Outbound Traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "devops-security-group"
  }
}

# Security Group for PostgreSQL Database
resource "aws_security_group" "db_sg" {
  name        = "devops-db-security-group"
  description = "Allow PostgreSQL access from application servers only"
  vpc_id      = aws_vpc.main.id

  # PostgreSQL Access From Application Security Group
  ingress {
    description     = "PostgreSQL Access"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.devops_sg.id]
  }

  # Allow All Outbound Traffic
  egress {
    description = "Allow All Outbound Traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "devops-db-security-group"
  }
}