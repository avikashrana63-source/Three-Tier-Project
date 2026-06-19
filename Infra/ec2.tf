# Create SSH key pair for both EC2 instances
resource "tls_private_key" "barista_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "barista_key" {
  key_name   = "barista-key"
  public_key = tls_private_key.barista_key.public_key_openssh
}

resource "local_file" "barista_private_key" {
  content         = tls_private_key.barista_key.private_key_pem
  filename        = "${path.module}/barista-key.pem"
  file_permission = "0400"
}

# Create K3s Master EC2 instance in public subnet
resource "aws_instance" "master_server" {
  ami                         = var.ami_id
  instance_type               = "c7i-flex.large"
  subnet_id                   = aws_subnet.public_subnet.id
  vpc_security_group_ids      = [aws_security_group.devops_sg.id]
  key_name                    = aws_key_pair.barista_key.key_name
  associate_public_ip_address = true

  tags = {
    Name = "k3s-master"
    Role = "master"
  }
}

# Create K3s Worker EC2 instance in public subnet
resource "aws_instance" "worker_server" {
  ami                         = var.ami_id
  instance_type               ="c7i-flex.large"
  subnet_id                   = aws_subnet.public_subnet.id
  vpc_security_group_ids      = [aws_security_group.devops_sg.id]
  key_name                    = aws_key_pair.barista_key.key_name
  associate_public_ip_address = true

  tags = {
    Name = "k3s-worker"
    Role = "worker"
  }
}