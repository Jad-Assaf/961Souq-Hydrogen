# Search typo tolerance manual checks

After applying the D1 migration and running the backfill, verify these queries
against the Worker `/search` endpoint:

- `iphnoe` should match iPhone products.
- `samsng` should match Samsung products.
- `airpds` should match AirPods products.
- `playstaton` should match PlayStation products.
- `macbok` should match MacBook products.
- `ps5` should remain strict and avoid unrelated short terms.
- `m4` should remain strict and avoid unrelated short terms.
- `s24` should remain strict and avoid unrelated short terms.
- `rtx 4090` should preserve numeric/model accuracy.
- `iphone 16 pro` should rank exact products above typo or partial matches.
- `iphnoe 16 pro` should still return iPhone 16 Pro products first.

Example:

```sh
curl "https://YOUR_WORKER_URL/search?q=iphnoe%2016%20pro&limit=5"
curl "https://YOUR_WORKER_URL/debug/search?q=iphnoe%2016%20pro"
```
