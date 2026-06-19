# Ansible Documentation

This document describes the `ansible/` folder and how it is used to configure servers for the BARISTA_CAFE project.

Repository layout

- `ansible/inventory/hosts` — inventory file listing target hosts (groups: bastion, app, db, k3s-nodes).
- `ansible/playbooks/setup.yml` — main playbook to bootstrap and configure hosts (install Docker, k3s, users, pull images, apply system config).

What each file does

- `inventory/hosts`
  - Groups hosts by purpose and contains connection attributes (ansible_user, ansible_ssh_private_key_file, ansible_host).
  - Example groups: `[bastion]`, `[app_servers]`, `[db]`, `[k3s_nodes]`.

- `playbooks/setup.yml`
  - Idempotent tasks to:
    - Update packages and install dependencies (curl, git, docker)
    - Configure Docker and add user to `docker` group
    - Install k3s (or join k3s cluster) and configure kubeconfig
    - Create application directories and set permissions
    - Pull container images or run `docker-compose` if used
    - Configure systemd services, firewall, and basic monitoring agents
  - Uses roles or task includes where appropriate for separation of concerns.

Common variables and secrets

- Group/host vars can be placed under `inventory/group_vars/` or `inventory/host_vars/`.
- Sensitive data (passwords, API keys) should be stored in Ansible Vault or retrieved from a secrets manager (AWS SSM Parameter Store / Secrets Manager).

Running the playbook

- Basic command (from repo root):

```bash
ansible -i inventory/hosts all -m ping
ansible-playbook -i inventory/hosts playbooks/setup.yml


ansible-playbook -i ansible/inventory/hosts ansible/playbooks/setup.yml --ask-become-pass
```

- Use an SSH key and non-interactive runs in CI:

```bash
ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i ansible/inventory/hosts ansible/playbooks/setup.yml --private-key ~/.ssh/id_rsa -u ubuntu --become
```

- Limit to groups or tags:

```bash
ansible-playbook -i ansible/inventory/hosts ansible/playbooks/setup.yml --limit "app_servers" --tags docker,k3s
```

Integration with Terraform

- Terraform provisions EC2 instances and outputs host IPs and inventory-related values into `infra/terraform/outputs.json`.
- You can generate the dynamic inventory from Terraform outputs, for example:

```bash
terraform output -json > infra/terraform/outputs.json
python scripts/convert_tf_outputs_to_inventory.py --input infra/terraform/outputs.json --output ansible/inventory/hosts
```

- Alternatively use an inventory script or `terraform-inventory` plugin to feed hosts to Ansible dynamically.

Best practices

- Keep playbooks idempotent and use handlers for service restarts.
- Use `--check` for dry-runs in staging before production changes.
- Use roles for reusable components (docker, k3s, postgres, app deployment).
- Secure secrets with Ansible Vault and do not store plaintext secrets in repository.
- Pin versions for critical actions (k3s version, docker packages) to avoid drift.

SSH access and permissions

- Ensure the Ansible control machine has SSH access to target hosts with a key or user credentials.
- Use `become` where root privileges are needed (package installs, service control).
- Restrict SSH on targets to specific admin CIDRs in security groups.

Troubleshooting

- Connection issues: enable verbose output `-vvv` to inspect SSH errors.
- Failed tasks: inspect the failing task output, run the same task with `--tags` locally on the host for debugging.
- Idempotency errors: check conditionals and handlers; re-run with `--diff` to see changes.

Example CI usage (GitHub Actions)

- Steps:
  1. Run `terraform apply` (infrastructure)
  2. Generate inventory from Terraform outputs
  3. Run `ansible-playbook` to configure servers
  4. Deploy k3s manifests or trigger deployment jobs

Example GitHub Actions snippet:

```yaml
- name: Run Ansible Setup
  run: |
    terraform output -json > infra/terraform/outputs.json
    python scripts/convert_tf_outputs_to_inventory.py --input infra/terraform/outputs.json --output ansible/inventory/hosts
    ansible-playbook -i ansible/inventory/hosts ansible/playbooks/setup.yml --private-key ~/.ssh/id_rsa -u ubuntu --become
```

Next steps

- If you want, I can:
  - Inspect `ansible/playbooks/setup.yml` and annotate it line-by-line.
  - Generate a dynamic inventory script from your Terraform outputs.
  - Convert this doc into `docs/ansible.pdf`.

---

Generated documentation for the repository `ansible/` folder.
