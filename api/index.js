const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function sendJson(status, body) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify(body),
  };
}

module.exports = async function handler(req, res) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Parse URL from Vercel request
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  if (pathname === '/images' && req.method === 'GET') {
    const folder = searchParams.get('folder') || '';
    const max = parseInt(searchParams.get('max')) || 30;
    
    if (!folder) {
      return sendJson(400, { error: 'Missing folder' });
    }

    // For now, return a simple response to test
    return sendJson(200, { 
      message: 'API is working!', 
      folder: folder,
      max: max,
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/health') {
    return sendJson(200, { 
      ok: true, 
      timestamp: new Date().toISOString(),
      message: 'Health check passed'
    });
  }

  return sendJson(404, { error: 'Not found' });
};