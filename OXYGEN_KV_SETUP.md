# KV Setup for Shopify Oxygen

Since you're using Shopify Oxygen (managed hosting), you can't access the Cloudflare Workers dashboard directly. Here's how to set it up:

## Method: Use Wrangler CLI + wrangler.toml

Even though Oxygen is managed, you can still configure KV through `wrangler.toml` and Shopify's deployment process should pick it up.

### Step 1: Create KV Namespace via CLI

```bash
# Make sure you're logged into Cloudflare
npx wrangler login

# Create the KV namespace
npx wrangler kv namespace create "AI_TOKEN_TRACKING"
```

This will output something like:
```
✨  Success!
Add the following to your configuration file:
{ binding = "AI_TOKEN_TRACKING", id = "abc123def456..." }
```

### Step 2: Create wrangler.toml

Create `wrangler.toml` in your project root (same level as `package.json`):

```toml
name = "961-souq"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "AI_TOKEN_TRACKING"
id = "abc123def456..."  # Paste the ID from step 1
```

### Step 3: Deploy via Shopify

Deploy your app normally:
```bash
npm run build
# or
shopify hydrogen deploy
```

Shopify's deployment process should read `wrangler.toml` and configure the KV binding automatically.

### Step 4: Verify

After deployment, check your server logs. You should see:
- `[Token Tracking] ... (KV)` = ✅ Working!
- `[Token Tracking] ... (Memory)` = ⚠️ KV not configured yet

## Alternative: If wrangler.toml doesn't work

If Shopify's deployment doesn't pick up `wrangler.toml`, you may need to:

1. **Contact Shopify Support** - Ask them to configure KV namespace binding for your Oxygen deployment
2. **Use the in-memory fallback** - The code already works without KV, it just resets on server restart

## Current Code Status

The code is already set up to:
- ✅ Try to use KV if available (`context.env.AI_TOKEN_TRACKING`)
- ✅ Fall back to in-memory storage if KV is not available
- ✅ Log which storage method is being used

No code changes needed - just configure KV and deploy!
