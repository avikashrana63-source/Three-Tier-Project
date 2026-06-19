# BARISTA CAFE - Project Architecture

## Project Structure

BARISTA_CAFE/

- frontend/
  - Dockerfile
  - nginx.conf
  - index.html
  - reservation.html
  - css/
  - js/
  - images/
  - fonts/
  - videos/

- backend/
  - Dockerfile
  - package.json
  - server.js

- scripts/
  - backup.sh
  - cleanup.sh
  - monitor.sh
  - deploy.sh
  - healthcheck.sh

- infra/terraform/
  - provider.tf
  - variable.tf
  - terraform.tfvars
  - vpc.tf
  - security-group.tf
  - ec2.tf
  - output.tf

- ansible/
  - inventory/hosts
  - playbooks/setup.yml

- k3s/ (Kubernetes manifests)
  - frontend-deployment.yaml
  - backend-deployment.yaml
  - postgres-deployment.yaml
  - services.yaml
  - ingress.yaml

- monitoring/
  - prometheus/
  - grafana/

- .github/workflows/
  - ci-cd.yml

- docker-compose.yml
- README.md
- .gitignore


## Architecture Overview

The BARISTA_CAFE project follows a modular architecture that separates concerns across infrastructure, orchestration, application code, and operational tooling.

Key layers and components:

- Developer → GitHub Repository → GitHub Actions CI/CD Pipeline → Terraform Infrastructure → AWS EC2/VPC → Ansible Configuration → K3s Kubernetes Cluster → Frontend + Backend + PostgreSQL → Prometheus & Grafana Monitoring

High-level components:

- Frontend Layer: static HTML/CSS/JS served behind Nginx in a container.
- Backend Layer: Node.js + Express.js providing REST APIs.
- Database Layer: PostgreSQL storing menu items, orders, users, and business data.
- DevOps: Docker images, docker-compose for local orchestration, Terraform for infra provisioning, Ansible for host configuration, k3s for Kubernetes orchestration, GitHub Actions for CI/CD, Prometheus & Grafana for monitoring and dashboards.


## Frontend Layer

- Technologies: HTML, CSS, JavaScript, Nginx container
- Responsibilities: render pages (`index.html`, `reservation.html`), static assets (images, fonts, videos), and serve client-side JS app.
- Deployment: built into a Docker image and deployed as a k3s deployment with an Nginx container and Service + Ingress.


## Backend Layer

- Technologies: Node.js, Express.js
- Responsibilities: REST API endpoints for menus, orders, reservations, user management, and business logic.
- Deployment: packaged as a Docker image, deployed as a k3s Deployment with a Service and exposed via Ingress.


## Database Layer

- Technologies: PostgreSQL
- Responsibilities: persistent storage for application data (schema includes menu, orders, customers, reservations).
- Deployment: run as a managed DB or as a k3s StatefulSet/Deployment (see `postgres-deployment.yaml` for manifest).


## DevOps Components

- Docker: containerize frontend and backend.
- Docker Compose: local development and integration testing using `docker-compose.yml`.
- Terraform: infrastructure-as-code for AWS resources (VPC, subnets, security groups, EC2 instances).
- Ansible: configuration management and post-provisioning tasks (install Docker, k3s agent, configure users, pull images).
- k3s Kubernetes: lightweight Kubernetes cluster to orchestrate containers in staging/production.
- GitHub Actions: CI/CD pipelines (`.github/workflows/ci-cd.yml`) to build images, run tests, and deploy.
- Prometheus & Grafana: metrics collection and dashboarding for observability.


## Deployment Flow

1. Developer pushes code to GitHub.
2. GitHub Actions triggers CI/CD pipeline.
3. Terraform provisions AWS infrastructure (VPC, subnets, EC2 instances).
4. Ansible configures servers and installs required packages (Docker, k3s, etc.).
5. k3s deploys frontend, backend, and PostgreSQL using Kubernetes manifests.
6. Ingress exposes applications to the internet.
7. Prometheus collects metrics from pods and nodes.
8. Grafana visualizes metrics and provides dashboards and alerts.


## Three-Tier Architecture

- Frontend (Nginx + HTML/CSS/JS)
- Backend (Node.js + Express API)
- PostgreSQL Database


## Operational Notes & Use Cases

- Local development: use `docker-compose.yml` to run frontend, backend, and DB locally for quick testing.
- CI/CD: GitHub Actions builds container images and can push to a registry; deployment jobs can apply Terraform and trigger Ansible or kubectl to update k3s.
- Backups: `scripts/backup.sh` should be scheduled (cron/systemd timer) to backup DB and persistent volumes.
- Health checks: `scripts/healthcheck.sh` used by monitoring or deployment pipelines to verify service readiness.
- Log rotation & cleanup: `scripts/cleanup.sh` to reclaim disk space and rotate logs.
- Monitoring: ensure Prometheus scrape configs include app endpoints; add Grafana dashboards for key metrics (requests per second, error rate, DB connections, CPU/memory).


## Next Steps & Recommendations

- Add README sections for local dev, deploy process, and troubleshooting.
- Add specific Terraform module documentation and variable explanations in `infra/terraform`.
- Annotate Kubernetes manifests with resource requests/limits and readiness/liveness probes.
- Add Grafana dashboards and Prometheus alerting rules into `monitoring/`.


---

Generated by automation; edit as needed for project-specific details.
