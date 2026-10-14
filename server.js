// ============================
// SPIDYY - Node.js Web Server
// ============================
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Ensure the Python chatbot backend is running on port 8000
function ensureChatbotBackend() {
  const backendDir = path.join(__dirname, 'Cross-Platform-AI-Chatbot', 'backend');
  const venvPythonWin = path.join(backendDir, 'venv', 'Scripts', 'python.exe');
  const venvPythonUnix = path.join(backendDir, 'venv', 'bin', 'python');

  let pythonCmd = 'python';
  if (fs.existsSync(venvPythonWin)) {
    pythonCmd = venvPythonWin;
  } else if (fs.existsSync(venvPythonUnix)) {
    pythonCmd = venvPythonUnix;
  }

  const checkReq = http.get('http://127.0.0.1:8000/docs', () => {
    console.log('  🤖  Chatbot backend is connected and ready on port 8000.');
  });

  checkReq.on('error', () => {
    console.log('  🤖  Launching Chatbot backend on port 8000...');
    const backendProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000'], {
      cwd: backendDir,
      stdio: 'ignore',
      detached: false
    });

    backendProcess.on('error', (err) => {
      console.warn('  ⚠️  Could not launch chatbot backend automatically:', err.message);
    });

    const cleanProcess = () => {
      try {
        backendProcess.kill();
      } catch (e) {}
    };

    process.on('exit', cleanProcess);
    process.on('SIGINT', () => { cleanProcess(); process.exit(); });
    process.on('SIGTERM', () => { cleanProcess(); process.exit(); });
  });
}
ensureChatbotBackend();

// MIME type map
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url;

  // Strip query strings
  urlPath = urlPath.split('?')[0];

  // Reverse proxy /api/v1 requests to FastAPI backend on port 8000
  if (req.url.startsWith('/api/v1')) {
    const proxyHeaders = { ...req.headers, host: '127.0.0.1:8000' };
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: req.url,
      method: req.method,
      headers: proxyHeaders
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Chatbot backend is connecting...' }));
    });
    req.pipe(proxyReq);
    return;
  }

  const filePath = path.join(__dirname, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try index.html as fallback
        fs.readFile(path.join(__dirname, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data2);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Server Error: ${err.message}`);
      }
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log('\n');
  console.log('  🕷  ╔══════════════════════════════════════╗');
  console.log('  🕸  ║           SPIDYY SERVER              ║');
  console.log('  🕷  ╠══════════════════════════════════════╣');
  console.log(`  🕸  ║  Running at: http://localhost:${PORT}   ║`);
  console.log('  🕷  ║  Press Ctrl+C to stop                ║');
  console.log('  🕸  ╚══════════════════════════════════════╝');
  console.log('\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port.`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
