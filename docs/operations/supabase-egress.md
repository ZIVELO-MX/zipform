# Supabase egress runbook

## Budget and alert thresholds

Zipform targets less than **3 GB of uncached egress per billing cycle**, or about **95 MB/day**. Review usage when either threshold is exceeded:

- warning: 70 MB/day or 2.2 GB projected monthly;
- action: 95 MB/day or 3 GB projected monthly;
- Storage migration review: Storage egress alone exceeds **750 MB/month** after cache headers and signed-URL reuse are verified.

Database migration is not an egress remediation. Consider it only if scoped queries, pagination, request deduplication, and caching have been deployed and database reads remain structurally excessive.

## Identify the source

1. In Supabase **Reports → Usage**, separate Database/API, Storage, Auth, Realtime, and Functions egress. Record the exact UTC window of the increase.
2. In **Logs Explorer → API Gateway**, filter that window and group by request path, status, and user agent. Compare request count with response bytes. Inspect `/rest/v1/*`, `/storage/v1/object/*`, and Zipform API paths separately.
3. Search Vercel runtime logs for `"event":"api_read"` in the same UTC window. Group by `route`, `operation`, `actorId`, `client`, and `environment`; sum `responseBytes`. `X-TLOZ-Client: tloz-api/1` identifies the repository agent client.
4. Correlate deploy SHA and environment through the PostgreSQL `application_name` value (`zipform:<environment>:<sha>`). This distinguishes production, preview, and local/dev database clients.
5. Check Storage object logs for repeated downloads of the same path, missing cache hits, crawler user agents, and preview deployments. Private mission images should only generate signed URLs when the preview is opened.
6. Check scheduled jobs, CI, local development terminals, browser previews, monitoring, and agent transcripts for repeated collection or detail reads during the spike.

Supabase Free Plan log retention can be shorter than the billing window. Export evidence immediately after an alert; cumulative PostgreSQL statistics can show a pattern but cannot establish the exact date of historical traffic.

## Database evidence

Capture a snapshot before resetting statistics:

```sql
select
  calls,
  rows,
  round(total_exec_time::numeric, 2) as total_exec_ms,
  round(mean_exec_time::numeric, 2) as mean_exec_ms,
  left(query, 500) as query
from pg_stat_statements
where query ilike '%tloz_%'
order by rows desc
limit 50;
```

Look for unbounded reads, `select *`, high `rows / calls`, repeated mission details, checklist/resource fan-out, and queries without project or mission predicates. Save the snapshot with the UTC interval and deploy SHA before using `pg_stat_statements_reset()`.

## Verification after a change

1. Run `pnpm perf:api` only against the local loopback server; the script rejects remote origins.
2. Exercise mission list, mission detail, batch detail, container/content pagination, and one private image preview.
3. Confirm `api_read` records have bounded `responseBytes`, one panel-open request, and the expected `client` and `environment`.
4. For seven days after deployment, record daily Supabase uncached egress and Storage egress. Compare the same weekday and workload where possible.
5. If projected usage remains above 3 GB, repeat the source attribution before changing infrastructure. Move large static/public media to Cloudflare R2 only when Storage is independently above the 750 MB gate.

Do not include bearer tokens, cookies, signed URLs, response payloads, or database connection strings in logs or incident evidence.
