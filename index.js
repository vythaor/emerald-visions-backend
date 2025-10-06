import http from 'http';
import { parse } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables from .env file (for local development)
dotenv.config();

// Configure Cloudinary with environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary configuration. Please set:');
  console.error('- CLOUDINARY_CLOUD_NAME');
  console.error('- CLOUDINARY_API_KEY');
  console.error('- CLOUDINARY_API_SECRET');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

console.log(`[cloudinary-server] Configured with cloud_name: ${cloudName}`);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  });
  res.end(json);
}

const server = http.createServer(async (req, res) => {
  const { pathname, query } = parse(req.url || '', true);

  // Enhanced CORS headers for production
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  if (pathname === '/api/images' && req.method === 'GET') {
    const folder = typeof query.folder === 'string' ? query.folder : '';
    const max = query.max ? Number(query.max) : 30;
    if (!folder) return sendJson(res, 400, { error: 'Missing folder' });

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
      return sendJson(res, 200, { folder: searchFolder, count: sources.length, sources });
    } catch (err) {
      console.error(`[cloudinary-server] Error searching folder ${searchFolder}:`, err);
      return sendJson(res, 500, { error: 'Cloudinary search failed', detail: String(err) });
    }
  }

  if (pathname === '/health') {
    return sendJson(res, 200, { 
      ok: true, 
      timestamp: new Date().toISOString(),
      cloudinary_configured: !!cloudName
    });
  }

  if (pathname === '/api/test' && req.method === 'GET') {
    const folder = query.folder || 'wedding';
    const searchFolder = `2am/${folder}`;
    try {
      const result = await cloudinary.search
        .expression(`folder:${searchFolder} AND resource_type:image`)
        .max_results(10)
        .execute();
      
      return sendJson(res, 200, { 
        folder: searchFolder, 
        total: result.total_count,
        resources: result.resources?.map(r => ({
          public_id: r.public_id,
          url: r.secure_url || r.url,
          folder: r.folder
        })) || []
      });
    } catch (err) {
      return sendJson(res, 500, { error: String(err) });
    }
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[cloudinary-server] listening on http://localhost:${PORT}`);
});


