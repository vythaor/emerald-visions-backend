const http = require('http');
const { parse } = require('url');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...corsHeaders,
  });
  res.end(json);
}

const server = http.createServer(async (req, res) => {
  const { pathname, query } = parse(req.url || '', true);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    return res.end();
  }

  // Add CORS headers to all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (pathname === '/api/images' && req.method === 'GET') {
    const folder = query.folder || '';
    const max = parseInt(query.max) || 30;
    
    if (!folder) {
      return sendJson(res, 400, { error: 'Missing folder' });
    }

    // For now, return a simple response to test
    return sendJson(res, 200, { 
      message: 'API is working!', 
      folder: folder,
      max: max,
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/api/health') {
    return sendJson(res, 200, { 
      ok: true, 
      timestamp: new Date().toISOString(),
      message: 'Health check passed'
    });
  }

  return sendJson(res, 404, { error: 'Not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`[server] listening on port ${PORT}`);
});