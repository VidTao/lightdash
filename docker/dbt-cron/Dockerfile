FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir dbt-core dbt-bigquery

# Install supercronic (lightweight cron for Docker)
RUN curl -fsSL https://github.com/aptible/supercronic/releases/download/v0.2.33/supercronic-linux-amd64 -o /usr/local/bin/supercronic && chmod +x /usr/local/bin/supercronic

RUN mkdir -p /opt/scripts

COPY docker/dbt-cron/crontab /etc/crontab
COPY docker/dbt-cron/run_dbt.sh /opt/scripts/run_dbt.sh
RUN chmod +x /opt/scripts/run_dbt.sh

CMD ["supercronic", "/etc/crontab"]
