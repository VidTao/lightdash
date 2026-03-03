FROM python:3.11-slim

RUN pip install --no-cache-dir dbt-core dbt-bigquery

RUN mkdir -p /opt/scripts

COPY docker/dbt-cron/run_dbt.sh /opt/scripts/run_dbt.sh
RUN chmod +x /opt/scripts/run_dbt.sh

CMD ["sh", "-c", "echo '[dbt-cron] Started. Running every 2 hours.' && while true; do /opt/scripts/run_dbt.sh; echo '[dbt-cron] Sleeping 2 hours...'; sleep 7200; done"]
