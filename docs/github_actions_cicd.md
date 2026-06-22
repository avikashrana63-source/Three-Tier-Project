# GitHub Actions CI/CD

This project runs the website with Docker Compose, not K3s, in the GitHub Actions pipeline.

## Workflow

The workflow file is:

```text
.github/workflows/docker-compose-ci-cd.yml
```

It runs on:

- Pushes to `main` or `master`
- Pull requests
- Manual runs from the GitHub Actions tab

## CI: Build And Smoke Test

The `compose-test` job:

1. Checks out the repository.
2. Builds the Docker Compose stack.
3. Starts the frontend, backend, and PostgreSQL containers.
4. Waits for `http://localhost:8085/api/health`.
5. Checks the frontend at `http://localhost:8085/`.
6. Checks the menu API at `http://localhost:8085/api/menu`.
7. Stops the stack and removes test volumes.

## CD: Manual Docker Compose Deploy

Deployment is manual. In GitHub, open the workflow, select **Run workflow**, and set `deploy` to `true`.

Add these repository secrets before deploying:

```text
SSH_HOST          Server public IP or DNS name
SSH_USER          SSH user, for example ubuntu
SSH_PRIVATE_KEY   Private key that can SSH into the server
APP_DIR           Project path on the server, for example /home/ubuntu/cafe_barista
```

The deploy job SSHes into the server and runs:

```bash
cd "$APP_DIR"
git pull
docker compose down --remove-orphans
docker compose up -d --build
docker compose ps
```

## Server Requirements

The server must already have:

- Git
- Docker
- Docker Compose plugin
- Access to pull this GitHub repository

The Ansible playbook in `ansible/playbooks/setup.yml` installs Git, Docker, and curl on Ubuntu hosts.
