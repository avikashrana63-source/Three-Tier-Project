# Barista Cafe Documentation Summary

This file is the central summary for the project documentation in the `docs/` folder.

## Project Overview

Barista Cafe is a three-tier web application:

- Frontend: static HTML, CSS, and JavaScript served by Nginx.
- Backend: Node.js and Express API for menu and order operations.
- Database: PostgreSQL for persistent menu and order data.

The project also includes infrastructure and deployment tooling:

- Terraform for AWS infrastructure.
- Ansible for server configuration.
- Docker and Docker Compose for local development.
- K3s for Kubernetes deployment.
- Shell scripts for backup, cleanup, deployment, health checks, and monitoring.

## Documents In This Folder

### `architecture.md`

Explains the full project architecture and how each layer fits together.

Key points:

- Describes the frontend, backend, database, infrastructure, deployment, and monitoring layers.
- Shows the overall flow from developer changes to AWS infrastructure and K3s deployment.
- Documents the three-tier architecture: frontend, backend, PostgreSQL.
- Lists recommended next steps such as better monitoring, Kubernetes probes, and deployment automation.

### `frontend backend .md`

Summarizes how the frontend and backend work together.

Key points:

- Frontend loads menu data from `GET /api/menu`.
- Frontend submits orders to `POST /api/orders`.
- Admin form can add or edit menu items through backend API endpoints.
- Backend creates required PostgreSQL tables automatically.
- Reservation page exists as frontend UI, but no backend reservation API is currently implemented.

Main API endpoints:

- `GET /api/health`
- `GET /api/menu`
- `POST /api/menu`
- `PUT /api/menu/:id`
- `POST /api/orders`
- `GET /api/orders`

### `terraform_infra.md`

Explains the Terraform infrastructure setup.

Key points:

- Terraform provisions AWS networking and compute resources.
- VPC, subnets, route tables, security groups, and EC2 instances are managed through Terraform files.
- Security groups should allow SSH only from trusted IPs, HTTP/HTTPS for web traffic, backend traffic internally, and PostgreSQL only from backend systems.
- Terraform outputs can be used by Ansible and deployment automation.
- Sensitive values should not be committed to Git.

Typical Terraform flow:

```bash
terraform init
terraform validate
terraform plan
terraform apply
```

### `ansible.md`

Explains how Ansible is used to configure provisioned servers.

Key points:

- Inventory files define target hosts.
- Playbooks install dependencies such as Docker, K3s, and required system packages.
- Ansible can configure servers after Terraform creates them.
- Secrets should be stored with Ansible Vault or a cloud secrets manager.
- Playbooks should be idempotent so they can be safely re-run.

Typical Ansible flow:

```bash
ansible -i ansible/inventory/hosts all -m ping
ansible-playbook -i ansible/inventory/hosts ansible/playbooks/setup.yml --become
```

### `scripts_summary.md`

Summarizes the shell scripts in the `scripts/` folder.

Key points:

- `backup.sh`: backs up persistent data.
- `cleanup.sh`: removes temporary files, old logs, and unused resources.
- `deploy.sh`: automates deployment steps.
- `healthcheck.sh`: checks app and service readiness.
- `monitor.sh`: helps monitor services and system resources.

Common setup:

```bash
chmod +x scripts/*.sh

```

## K3s Deployment Summary

The root `k3s/` folder contains Kubernetes manifests for deploying the real project:

```text
k3s/
├── postgres-deployment.yaml
├── backend-deployment.yaml
├── frontend-deployment.yaml
├── services.yaml
├── ingress.yaml
└── README.md
```

### How K3s Runs The App

1. Frontend pods run Nginx and serve the website.
2. Frontend Nginx proxies `/api` requests to the backend service.
3. Backend pods run the Node.js Express API on port `3000`.
4. Backend connects to PostgreSQL through the internal service name `db`.
5. PostgreSQL stores data using a persistent volume claim.
6. Traefik ingress exposes the app over HTTP.

### K3s Setup Flow

SSH into the master:

```bash
ssh -i ../Infra/barista-key.pem ubuntu@65.2.148.211
```

Install K3s on master:

```bash
curl -sfL https://get.k3s.io | sh -
sudo kubectl get nodes
```

Get the master token:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

SSH into the worker:

```bash
ssh -i ../Infra/barista-key.pem ubuntu@13.234.110.2
```

Join worker to master:

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://10.0.1.163:6443 K3S_TOKEN=<PASTE_TOKEN_HERE> sh -
```

Verify from master:

```bash
sudo kubectl get nodes
```

Expected result:

```text
master   Ready
worker   Ready
```

### Build And Push Images

Before applying the YAML files, build and push the app images:

```bash
docker build -t YOUR_DOCKERHUB_USERNAME/barista-frontend:latest ./frontend
docker build -t YOUR_DOCKERHUB_USERNAME/barista-backend:latest ./backend

docker push YOUR_DOCKERHUB_USERNAME/barista-frontend:latest
docker push YOUR_DOCKERHUB_USERNAME/barista-backend:latest
```

Then update image names in:

- `k3s/frontend-deployment.yaml`
- `k3s/backend-deployment.yaml`

### Apply K3s Manifests

From the `k3s/` folder on the master:

```bash
sudo kubectl apply -f postgres-deployment.yaml
sudo kubectl apply -f services.yaml
sudo kubectl apply -f backend-deployment.yaml
sudo kubectl apply -f frontend-deployment.yaml
sudo kubectl apply -f ingress.yaml
```

Or apply everything:


```bash
git clone https://github.com/avikashrana63-source/Three-Tier-Project.git
cd Three-Tier-Project
ls

sudo kubectl apply -f .
sudo kubectl apply --dry-run=client -f k3s/
sudo kubectl apply -f k3s/
```

### Verify Deployment

```bash
sudo kubectl get nodes
sudo kubectl get pods
sudo kubectl get svc
sudo kubectl get ingress
```

Test the app:

```bash
curl http://65.2.148.211/
curl http://65.2.148.211/api/health
```

Expected health response:

```json
{"status":"ok"}
```

## End-To-End Project Flow

1. Terraform provisions AWS infrastructure.
2. Ansible configures EC2 instances.
3. K3s is installed on the master and worker nodes.
4. Frontend and backend Docker images are built and pushed to DockerHub.
5. K3s manifests deploy PostgreSQL, backend, frontend, services, and ingress.
6. Users access the frontend through the public IP or domain.
7. Frontend calls backend APIs through `/api`.
8. Backend reads and writes data in PostgreSQL.

## Important Operational Notes

- Keep private keys out of Git.
- Do not commit real production secrets.
- Replace placeholder DockerHub image names before deployment.
- Keep database access internal to the cluster.
- Allow HTTP port `80` in the cloud security group if using Traefik ingress.
- Use stronger PostgreSQL credentials for production.
- Add backups for the PostgreSQL persistent volume before real production use.
