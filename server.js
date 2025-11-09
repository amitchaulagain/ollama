import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 11435;
const OLLAMA_URL = 'http://localhost:11434';

// Don't parse body - let proxy middleware handle it as stream
// This is important for streaming responses and proper body forwarding

// CORS headers to allow all origins (adjust if needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint (must be before proxy)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ollama-wrapper', ollama: OLLAMA_URL });
});

// Proxy all requests to Ollama API (adding /api prefix)
const ollamaProxy = createProxyMiddleware({
  target: OLLAMA_URL,
  changeOrigin: true,
  // Increase timeouts for long-running Ollama requests
  proxyTimeout: 600000, // 10 minutes (600 seconds)
  timeout: 600000, // 10 minutes
  // Keep connection alive
  xfwd: true,
  // Don't buffer responses - stream them
  buffer: false,
  // Parse body for logging but don't interfere with proxy
  selfHandleResponse: false,
  pathRewrite: {
    '^/(.*)': '/api/$1', // Rewrite /path to /api/path
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${OLLAMA_URL}${proxyReq.path}`);
    // Set longer timeout on the proxy request
    proxyReq.setTimeout(600000); // 10 minutes
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} <- ${proxyRes.statusCode}`);
    // Disable timeout on response
    res.setTimeout(0);
  },
  onError: (err, req, res) => {
    console.error(`[${new Date().toISOString()}] Proxy error:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Ollama service unavailable', message: err.message });
    }
  },
});

// Apply proxy to all routes
app.use('/', ollamaProxy);

// Increase server timeout for long-running requests
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ollama Wrapper Proxy running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Proxying requests to ${OLLAMA_URL}/api/`);
  console.log(`⏱️  Timeout: 10 minutes (600 seconds)`);
  console.log(`\nExample usage:`);
  console.log(`  curl http://localhost:${PORT}/generate -X POST -H "Content-Type: application/json" -d '{"model":"llama2","prompt":"hello","stream":false}'`);
  console.log(`  curl http://localhost:${PORT}/chat -X POST -H "Content-Type: application/json" -d '{"model":"llama2","messages":[{"role":"user","content":"hello"}]}'`);
  console.log(`  curl http://localhost:${PORT}/tags`);
  console.log(`\n💡 Tip: Use "stream": true for faster responses and to avoid timeouts!`);
});

// Set server timeout to 10 minutes
server.timeout = 600000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

