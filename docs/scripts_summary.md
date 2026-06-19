Scripts Summary for cafe_barista

- Backup: scripts/backup.sh
  - Purpose: Creates backups of persistent data (DB dumps, uploaded files, config).
  - Use cases: Scheduled nightly backups before upgrades or for disaster recovery.
  - Typical tools: pg_dump / mysqldump, tar, aws/rsync to remote storage.

- Cleanup: scripts/cleanup.sh
  - Purpose: Removes temp files, prunes old logs, and may prune unused Docker resources.
  - Use cases: Free disk space on build/CI hosts or before backups.
  - Typical tools: find, rm, docker system prune, logrotate.

- Deploy: scripts/deploy.sh
  - Purpose: Automates deployment (pulls code, builds images, runs docker-compose or triggers Ansible/terraform).
  - Use cases: Push releases to staging/production with a single command.
  - Typical tools: git, docker, docker-compose, ansible-playbook, terraform.

- Healthcheck: scripts/healthcheck.sh
  - Purpose: Probes services (HTTP endpoints, DB connection, ports) and returns status/exit code.
  - Use cases: Run from monitoring system or CI to verify service readiness.
  - Typical checks: curl, nc, pgrep, service endpoints returning 200.

- Monitor: scripts/monitor.sh
  - Purpose: Starts or runs a lightweight monitoring loop (logs, resource usage, alerts).
  - Use cases: Local troubleshooting or as a simple service watcher.
  - Typical tools: top, ps, docker stats, tail -F, simple alerting via mail or webhook.

How they generally work

- Shell scripts use standard Unix tools (`curl`, `pg_dump`/`mysqldump`, `docker`/`docker-compose`, `ansible-playbook`).
- They accept arguments or environment variables for environment (e.g., `staging`, `production`, `BACKUP_DIR`, `ANSIBLE_HOST`).
- Exit codes: `0` = success; non-zero = failure (suitable for cron/CI checks).

Run examples

- Make scripts executable once:

```bash
chmod +x scripts/*.sh
```

- Run a single script:

```bash
./scripts/backup.sh
./scripts/deploy.sh production
./scripts/healthcheck.sh
```

- Dry-run or verbose (if supported):

```bash
./scripts/cleanup.sh --dry-run
./scripts/deploy.sh --verbose
```

Permissions & scheduling

- Ensure the runner has permissions to access DB credentials, Docker socket, and destination backup storage.
- For regular runs, add cron entries or systemd timers, e.g. cron for nightly backup:

```bash
0 2 * * * /home/avikash/cafe_barista/scripts/backup.sh >> /var/log/backup.log 2>&1
```

Notes

- I generated this summary from the workspace structure and typical patterns. If you want detailed, line-by-line annotations, I can inspect each script and annotate them in-place.
