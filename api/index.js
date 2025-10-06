const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary configuration');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// CORS headers
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

  if (pathname === '/api/images' && req.method === 'GET') {
    const folder = searchParams.get('folder') || '';
    const max = parseInt(searchParams.get('max')) || 30;
    
    if (!folder) {
      return sendJson(400, { error: 'Missing folder' });
    }

    // Search in the nested folder structure: 2am/{folder}
    const searchFolder = `2am/${folder}`;
    console.log(`[cloudinary-server] Searching for images in folder: ${searchFolder}`);
    
    try {
      const result = await cloudinary.search
        .expression(`folder:${searchFolder} AND resource_type:image`)
        .sort_by('public_id', 'desc')
        .max_results(Math.min(Math.max(max, 1), 100))
        .execute();

      console.log(`[cloudinary-server] Found ${result.resources?.length || 0} resources for folder: ${searchFolder}`);
      
      const sources = (result.resources || []).map((r) => {
        const url = r.secure_url || r.url;
        console.log(`[cloudinary-server] Resource: ${r.public_id} -> ${url}`);
        return url;
      }).filter(Boolean);
      
      console.log(`[cloudinary-server] Returning ${sources.length} valid URLs for folder: ${searchFolder}`);
      return sendJson(200, { folder: searchFolder, count: sources.length, sources });
    } catch (err) {
      console.error(`[cloudinary-server] Error searching folder ${searchFolder}:`, err);
      return sendJson(500, { error: 'Cloudinary search failed', detail: String(err) });
    }
  }

  if (pathname === '/api/health') {
    return sendJson(200, { 
      ok: true, 
      timestamp: new Date().toISOString(),
      cloudinary_configured: !!cloudName
    });
  }

  return sendJson(404, { error: 'Not found' });
};