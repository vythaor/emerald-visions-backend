const https = require('https');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get query parameters
    const url = new URL(req.url, `https://${req.headers.host}`);
    const folder = url.searchParams.get('folder') || '';
    const max = parseInt(url.searchParams.get('max')) || 30;
    const cursor = url.searchParams.get('cursor') || null;

    // Check environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('[images.js] Missing Cloudinary environment variables');
      return res.status(500).json({
        error: 'Cloudinary configuration missing',
        cloudName: cloudName ? 'Set' : 'Missing',
        apiKey: apiKey ? 'Set' : 'Missing',
        apiSecret: apiSecret ? 'Set' : 'Missing'
      });
    }

    // Build Cloudinary API URL with pagination support
    const cloudinaryFolder = `2am/${folder}`;
    let cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/search?expression=folder:${cloudinaryFolder}&max_results=${max}`;
    
    // Add cursor for pagination if provided
    if (cursor) {
      cloudinaryUrl += `&next_cursor=${encodeURIComponent(cursor)}`;
    }

    // Make request to Cloudinary
    const options = {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':' + apiSecret).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    };

    const cloudinaryReq = https.get(cloudinaryUrl, options, (cloudinaryRes) => {
      let data = '';

      cloudinaryRes.on('data', (chunk) => {
        data += chunk;
      });

      cloudinaryRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (cloudinaryRes.statusCode !== 200) {
            console.error('[images.js] Cloudinary API error:', result);
            return res.status(cloudinaryRes.statusCode).json({
              error: 'Cloudinary API error',
              details: result
            });
          }

          // Extract image URLs
          const images = result.resources ? result.resources.map(resource => ({
            url: resource.secure_url,
            public_id: resource.public_id,
            format: resource.format
          })) : [];

          // Check if there are more results based on Cloudinary's response
          const hasMore = result.next_cursor ? true : false;
          const nextCursor = result.next_cursor || null;

          res.status(200).json({
            images: images,
            count: images.length,
            folder: folder,
            hasMore: hasMore,
            nextCursor: nextCursor
          });

        } catch (parseError) {
          console.error('[images.js] JSON parse error:', parseError);
          res.status(500).json({
            error: 'Failed to parse Cloudinary response',
            details: parseError.message
          });
        }
      });
    });

    cloudinaryReq.on('error', (error) => {
      console.error('[images.js] Cloudinary request error:', error);
      res.status(500).json({
        error: 'Failed to fetch from Cloudinary',
        details: error.message
      });
    });

    cloudinaryReq.setTimeout(10000, () => {
      console.error('[images.js] Request timeout');
      cloudinaryReq.destroy();
      res.status(500).json({
        error: 'Request timeout'
      });
    });

  } catch (error) {
    console.error('[images.js] Unexpected error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
