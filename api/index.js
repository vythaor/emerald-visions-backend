module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Get the path from the URL
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathname = url.pathname;
  const searchParams = url.searchParams;
  
  console.log('Request received:', { method: req.method, pathname, url: req.url });
  
  // Handle different endpoints
  if (pathname === '/health') {
    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      message: 'Health check passed'
    });
  }
  
  if (pathname === '/images') {
    const folder = searchParams.get('folder') || '';
    const max = parseInt(searchParams.get('max')) || 30;
    
    return res.status(200).json({
      message: 'Images API is working!',
      folder: folder,
      max: max,
      timestamp: new Date().toISOString()
    });
  }
  
  // Default response
  res.status(404).json({
    error: 'Not found',
    pathname: pathname,
    method: req.method
  });
};