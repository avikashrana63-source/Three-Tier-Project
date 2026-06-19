# K3s Deployment Guide

This folder contains the Kubernetes manifests for deploying the Barista Cafe project on a K3s cluster.

## Folder Structure

```text
k3s/
├── postgres-deployment.yaml
├── backend-deployment.yaml
├── frontend-deployment.yaml
├── services.yaml
├── ingress.yaml
└── README.md
```

## How The Project Works On K3s

The application runs as a three-tier deployment:

1. The frontend pod runs Nginx and serves the static Barista Cafe website.
2. The frontend Nginx config proxies `/api` requests to the backend service.
3. The backend pod runs the Node.js Express API on port `3000`.
4. The backend connects to PostgreSQL using the internal Kubernetes service name `db`.
5. PostgreSQL stores menu and order data on a persistent volume claim.
6. The ingress routes public HTTP traffic to the frontend and backend services.

## 1. SSH Into The Master Node

From your local machine:

```bash
ssh -i ../Infra/barista-key.pem ubuntu@65.2.148.211
```

## 2. Install K3s On Master

Run this on the master node:

```bash
curl -sfL https://get.k3s.io | sh -
```

Check the node:

```bash
sudo kubectl get nodes
```

Expected result:

```text
NAME     STATUS   ROLES                  AGE   VERSION
master   Ready    control-plane,master   ...   ...
```

## 3. Get The Master Token

Run this on the master node:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

Copy the token. You need it when joining the worker node.

## 4. SSH Into The Worker Node

From your local machine:

```bash
ssh -i ../Infra/barista-key.pem ubuntu@13.234.110.2
```

## 5. Join Worker To Master

Run this on the worker node. Use the master private IP address:

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://10.0.1.163:6443 K3S_TOKEN=<PASTE_TOKEN_HERE> sh -
```

## 6. Verify The Cluster From Master

Go back to the master node:

```bash
sudo kubectl get nodes
```

Expected result:

```text
NAME     STATUS   ROLES                  AGE   VERSION
master   Ready    control-plane,master   ...   ...
worker   Ready    <none>                 ...   ...
```

## 7. Build And Push Docker Images

Before applying the K3s YAML files, build and push the frontend and backend images to DockerHub.

From the project root on your local machine:

```bash
docker build -t YOUR_DOCKERHUB_USERNAME/barista-frontend:latest ./frontend
docker build -t YOUR_DOCKERHUB_USERNAME/barista-backend:latest ./backend

docker push YOUR_DOCKERHUB_USERNAME/barista-frontend:latest
docker push YOUR_DOCKERHUB_USERNAME/barista-backend:latest
```

Then update these image names in the YAML files:

```text
k3s/frontend-deployment.yaml
k3s/backend-deployment.yaml
```

Replace:

```text
your-dockerhub-username/barista-frontend:latest
your-dockerhub-username/barista-backend:latest
```

With your real DockerHub images, for example:

```text
avikash/barista-frontend:latest
avikash/barista-backend:latest
```

## 8. Copy The Project Or K3s Folder To Master

If the manifests are not already on the master node, copy them:

```bash
scp -i ../Infra/barista-key.pem -r k3s ubuntu@65.2.148.211:~/barista-cafe-k3s
```

Then SSH into the master:

```bash
ssh -i ../Infra/barista-key.pem ubuntu@65.2.148.211
cd ~/barista-cafe-k3s
```

## 9. Apply The Manifests

Apply PostgreSQL first, then services, then backend, frontend, and ingress:

```bash
sudo kubectl apply -f postgres-deployment.yaml
sudo kubectl apply -f services.yaml
sudo kubectl apply -f backend-deployment.yaml
sudo kubectl apply -f frontend-deployment.yaml
sudo kubectl apply -f ingress.yaml
```

You can also apply the whole folder:

```bash
sudo kubectl apply -f .
```

## 10. Verify The Deployment

Check pods:

```bash
sudo kubectl get pods
```

Expected pods:

```text
backend-...    Running
frontend-...   Running
postgres-...   Running
```

Check services:

```bash
sudo kubectl get svc
```

Expected services:

```text
backend    ClusterIP   ...   3000/TCP
db         ClusterIP   ...   5432/TCP
frontend   ClusterIP   ...   80/TCP
```

Check ingress:

```bash
sudo kubectl get ingress
```

## 11. Test The Application

Use the master public IP or the load balancer address configured for your cluster:

```bash
curl http://65.2.148.211/
curl http://65.2.148.211/api/health
```

Expected API health response:

```json
{"status":"ok"}
```

Open the frontend in a browser:

```text
http://65.2.148.211/
```

## 12. Useful Troubleshooting Commands

Check pod status:

```bash
sudo kubectl get pods -o wide
```

View backend logs:

```bash
sudo kubectl logs deploy/backend
```

View frontend logs:

```bash
sudo kubectl logs deploy/frontend
```

View PostgreSQL logs:

```bash
sudo kubectl logs deploy/postgres
```

Describe a failing pod:

```bash
sudo kubectl describe pod <POD_NAME>
```

Restart a deployment:

```bash
sudo kubectl rollout restart deployment/backend
sudo kubectl rollout restart deployment/frontend
```

Check rollout status:

```bash
sudo kubectl rollout status deployment/backend
sudo kubectl rollout status deployment/frontend
```

## 13. Important Notes

- Keep the private SSH key outside Git.
- Do not commit real production database passwords.
- The current PostgreSQL password matches the local Docker Compose setup.
- For production, replace `postgres-secret` values with stronger credentials.
- K3s includes Traefik by default, so `ingress.yaml` uses `ingressClassName: traefik`.
- If your cloud security group does not allow HTTP port `80`, the website will not be reachable from the internet.
