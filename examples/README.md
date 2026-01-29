# Example Logs

Use these to validate parsing and anomaly rules:

- `test-happy.log` -> burst + large transfer anomalies
- `test-invalid-lines.log` -> parse warnings + invalid samples
- `test-high-error.log` -> high_error_rate anomaly
- `test-rare-destination.log` -> rare_destination anomaly
- `test-large-transfer.log` -> large_transfer anomaly

Multi-format samples (raw formats supported by parser):
- `apache_access.log` (Apache access log format)
- `nginx_access.log` (Nginx access log format)
- `squid_access.log` (Squid proxy access log format)
- `zscaler_webproxy.csv` (Zscaler-like CSV format)
- `app_json.log` (JSON lines app logs)
- `syslog.log` (Syslog with key=value payload)
- `app_kv.log` (Key=Value app logs)

Large samples (~3–4MB each, under 5MB limit):
- `big_custom.log`
- `big_apache.log`
- `big_json.log`
