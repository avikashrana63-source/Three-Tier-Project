# Terraform Infrastructure Documentation

This document describes the Terraform code located in `infra/terraform/` and how it is used to provision AWS resources for the BARISTA_CAFE project.

## Files Overview

- `provider.tf`
  - Configures the Terraform AWS provider (region, profile, and required provider versions).
  - Example contents: provider "aws" { region = var.aws_region }

- `variable.tf`
  - Declares input variables used across the modules (e.g., `aws_region`, `vpc_cidr`, instance types, AMI IDs, keypair name).
  - Each variable should include a description and sensible default where appropriate.

- `terraform.tfvars`
  - Local file used to provide concrete values for variables during development.
  - This file should typically be excluded from source control if it contains secrets.

- `vpc.tf`
  - Creates VPC, subnets, route tables, internet gateway, NAT gateway(s) as required.
  - Outputs subnet IDs and VPC ID for use by other resources.

- `security-group.tf` (security-group.tf)
  - Defines security groups for application servers and database.
  - Typical rules:
    - Allow HTTP/HTTPS from 0.0.0.0/0 for frontend (port 80/443)
    - Allow backend port (3000) from internal subnets or load balancer
    - Allow PostgreSQL port (5432) from backend security group only
    - Allow SSH (22) from admin IPs (restrict to your office/home IP)

- `ec2.tf`
  - Provisions EC2 instances (e.g., bastion, app nodes) with user-data to bootstrap (install Docker, k3s agent, etc.).
  - Attaches instances to subnets and security groups.
  - Optionally uses `aws_ami` data sources to select AMIs.

- `output.tf`
  - Exposes useful outputs such as VPC ID, subnet IDs, bastion/public IPs, and any generated resource identifiers.

- `terraform.tfvars` / `variable.tf` best practice
  - Do not commit sensitive values (keys, secrets). Use environment variables, remote state, or Terraform Cloud variables for secrets.


## State Management

- Use a remote backend for Terraform state (S3 + DynamoDB for state locking) in team environments.
- Example backend configuration in `provider.tf` or a separate `backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state-bucket"
    key    = "barista_cafe/terraform.tfstate"
    region = var.aws_region
    dynamodb_table = "terraform-locks"
  }
}
```

## Typical Workflow

1. Initialize Terraform (first time or after provider/modules change):

```bash
terraform init
```

2. Validate configuration:

```bash
terraform validate
```

3. Review planned changes:

```bash
terraform plan -var-file="terraform.tfvars"
```

4. Apply changes (with approval):

```bash
terraform apply -var-file="terraform.tfvars"
```

5. To destroy infrastructure:

```bash
terraform destroy -var-file="terraform.tfvars"
```


## Integration with Ansible and k3s

- Terraform provisions EC2 instances and network resources. After provisioning, Ansible is used to configure the hosts (install Docker, K3s, create users, deploy required packages).
- Typical sequence in CI/CD:
  1. `terraform apply` → resources created
  2. Use `ansible-playbook -i inventory/hosts playbooks/setup.yml` to configure
  3. Deploy Kubernetes manifests to the k3s cluster


## Security Recommendations

- Restrict SSH access to specific IP ranges.
- Use security groups to limit database access to application servers only.
- Use IAM roles for EC2 instances rather than embedding credentials.
- Store secrets (DB passwords, API keys) in a secrets manager (AWS Secrets Manager or SSM Parameter Store) and access them from Ansible or the application at runtime.


## Outputs & Consumption

- `output.tf` should provide values consumed by other automation tools, for example:
  - `bastion_public_ip`
  - `app_subnet_ids`
  - `db_private_ip` or `db_endpoint`

- CI/CD pipelines and Ansible can read these outputs using:

```bash
terraform output -json > infra/terraform/outputs.json
```


## Example Variables

```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "bastion_allowed_cidr" {
  description = "CIDR allowed to SSH to bastion"
  type        = string
}
```


## Troubleshooting

- If `terraform plan` fails for provider or plugin errors, run `terraform init -upgrade`.
- If state is corrupted, restore from S3 backups or consult team processes for state recovery.
- Use `terraform state list` and `terraform state show <resource>` to inspect state.


## Next steps

- Add a `backend.tf` with S3/DynamoDB backend for team state and locking.
- Add CI/CD automation to validate and apply Terraform plans via GitHub Actions with a manual approval step for production.
- Document any AMI creation process and required user-data for bootstrapping instances.


---

Generated documentation for the Terraform code in `infra/terraform`.
