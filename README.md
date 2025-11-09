# Ollama Wrapper Proxy

A simple proxy server that removes the `/api` prefix from Ollama requests, allowing you to bypass Cloudflare's security rules that block `/api/*` paths.

## How It Works

Instead of calling:
- `maya.inquisitivemind.tech/api/generate` ❌ (blocked by Cloudflare)

You can call:
- `maya.inquisitivemind.tech/generate` ✅ (works fine)

The proxy automatically adds the `/api` prefix when forwarding requests to Ollama.

## Setup

1. Install dependencies:
```bash
cd ollama-wrapper
npm install
```

2. Start the proxy server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Configuration

- **Proxy Port**: `11435` (default)
- **Ollama URL**: `http://localhost:11434` (default)

To change these, edit `server.js`.

## Update Cloudflared Config

Update `/Users/admin/.cloudflared/config.yml`:

```yaml
ingress:
  - hostname: maya.inquisitivemind.tech
    service: http://localhost:11435  # Changed from 11434 to 11435
```

Then restart cloudflared.

## Usage Examples

### Generate Text
```bash
curl -X POST http://localhost:11435/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama2", "prompt": "hello", "stream": false}'
```

### Chat
```bash
curl -X POST http://localhost:11435/chat \
  -H "Content-Type: application/json" \
  -d '{"model": "llama2", "messages": [{"role": "user", "content": "hello"}]}'
```

### List Models
```bash
curl http://localhost:11435/tags
```

### Health Check
```bash
curl http://localhost:11435/health
```

## Endpoints

All Ollama API endpoints work without the `/api` prefix:

- `/generate` → `/api/generate`
- `/chat` → `/api/chat`
- `/tags` → `/api/tags`
- `/show` → `/api/show`
- `/embeddings` → `/api/embeddings`
- etc.

## Fixing 524 Timeout Errors

If you get **Error 524: A Timeout Occurred**, it means Cloudflare is timing out. Here are solutions:

### Solution 1: Use Streaming (Recommended) ✅

Streaming avoids timeouts by sending data as it's generated:

```bash
curl -X POST https://maya.inquisitivemind.tech/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama2", "prompt": "hello", "stream": true}'
```

### Solution 2: Increase Cloudflare Timeout

1. Go to Cloudflare Dashboard → **Speed** → **Optimization**
2. Set **HTTP/2 to Origin** to ON
3. Go to **Rules** → **Transform Rules** → **Modify Response Header**
4. Create rule for `maya.inquisitivemind.tech`:
   - Add header: `CF-Timeout: 600` (10 minutes)

### Solution 3: Use Cloudflare Workers (Advanced)

Create a Worker that proxies with longer timeouts (up to 30 seconds for Workers).

### Solution 4: Reduce Model Size or Prompt Length

Smaller models and shorter prompts respond faster:
- Use `llama2:7b` instead of larger models
- Keep prompts concise

## Benefits

✅ Bypasses Cloudflare `/api/*` blocking  
✅ No changes needed to Ollama  
✅ Simple, lightweight proxy  
✅ CORS enabled for web access  
✅ Logging for debugging  
✅ Extended timeouts (10 minutes)  
✅ Streaming support  

