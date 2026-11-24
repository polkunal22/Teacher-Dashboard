const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_JSON_PATH = path.join(ROOT_DIR, 'database', 'learnly_db.json');
const SCHEMA_SQL_PATH = path.join(ROOT_DIR, 'database', 'schema.sql');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const readJsonDb = () => {
  try {
    if (fs.existsSync(DB_JSON_PATH)) {
      return JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    }
  } catch (_) {}
  return null;
};

const writeJsonDb = (data) => {
  fs.mkdirSync(path.dirname(DB_JSON_PATH), { recursive: true });
  fs.writeFileSync(DB_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // API: Health & SQL Schema
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': MIME_TYPES['.json'] });
    res.end(JSON.stringify({ status: 'ok', engine: 'Learnly SQL + Node Persistence', timestamp: new Date().toISOString() }));
    return;
  }

  if (pathname === '/api/schema.sql' && req.method === 'GET') {
    const sql = fs.existsSync(SCHEMA_SQL_PATH) ? fs.readFileSync(SCHEMA_SQL_PATH, 'utf8') : '-- Schema not found';
    res.writeHead(200, { 'Content-Type': MIME_TYPES['.sql'] });
    res.end(sql);
    return;
  }

  // API: Get or Sync Full Database State
  if (pathname === '/api/db' && req.method === 'GET') {
    const db = readJsonDb();
    res.writeHead(200, { 'Content-Type': MIME_TYPES['.json'] });
    res.end(JSON.stringify({ ok: true, data: db }));
    return;
  }

  if (pathname === '/api/db' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        writeJsonDb(payload);
        res.writeHead(200, { 'Content-Type': MIME_TYPES['.json'] });
        res.end(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': MIME_TYPES['.json'] });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Static File Hosting (Redirects "/" to "/html/index.html")
  const relativeTarget = pathname === '/' ? '/html/index.html' : pathname;
  const safePath = path.normalize(path.join(ROOT_DIR, relativeTarget));
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(safePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Learnly Dashboard Server & SQL API running at http://localhost:${PORT}`);
});
