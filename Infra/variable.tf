variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-south-1"
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
  default     = "ami-01a00762f46d584a1"
}
variable "key_name" {
  description = "Key pair name for SSH access to EC2 instances"
  type        = string
  default     = "my-key"
}