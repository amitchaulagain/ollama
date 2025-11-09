# Fix 524 Timeout Error

Error 524 means Cloudflare timed out waiting for a response from your origin server.

## Quick Fix: Use Streaming ✅ (Best Solution)

**Streaming sends data as it's generated, keeping the connection alive:**

```bash
curl -X POST https://maya.inquisitivemind.tech/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama2", "prompt": "hello", "stream": true}'
```

**Why this works:**
- Data flows continuously (keeps connection alive)
- No waiting for complete response
- Faster perceived response time
- Avoids Cloudflare's 100-second timeout

## Other Solutions

### 1. Increase Cloudflare Timeout (Paid Plans Only)

Cloudflare timeout limits:
- **Free Plan**: 100 seconds (cannot be changed)
- **Pro Plan**: Up to 600 seconds
- **Business/Enterprise**: Up to 600 seconds

To increase timeout on paid plans:
1. Go to Cloudflare Dashboard → **Rules** → **Transform Rules**
2. Create **Modify Response Header** rule:
   - **When**: Hostname equals `maya.inquisitivemind.tech`
   - **Then**: Add header `CF-Timeout: 600`

### 2. Use Shorter Prompts / Smaller Models

- Use `llama2:7b` instead of larger models
- Keep prompts concise
- Use `num_predict` to limit response length

### 3. Check Proxy Server Logs

```bash
tail -f /tmp/ollama-wrapper.log
```

Look for timeout errors or slow responses.

### 4. Verify Ollama is Running

```bash
curl http://localhost:11434/api/tags
```

If this times out, Ollama might be overloaded or not running.

## Testing

Test with streaming (should work immediately):
```bash
curl -N -X POST https://maya.inquisitivemind.tech/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama2", "prompt": "Say hello", "stream": true}'
```

The `-N` flag disables buffering so you see data as it arrives.

## Proxy Server Status

The proxy server has been configured with:
- ✅ 10-minute timeout (600 seconds)
- ✅ Streaming support enabled
- ✅ Keep-alive connections
- ✅ Proper error handling

**Restart cloudflared** after making changes to pick up the new proxy settings.

