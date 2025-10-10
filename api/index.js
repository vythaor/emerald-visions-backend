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
  
  // Handle different endpoints
  if (pathname === '/health') {
    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      message: 'Health check passed from index.js'
    });
  }
  
  if (pathname === '/images') {
    const folder = searchParams.get('folder') || '';
    const max = parseInt(searchParams.get('max')) || 30;
    
    return res.status(200).json({
      message: 'Images API is working from index.js!',
      folder: folder,
      max: max,
      timestamp: new Date().toISOString()
    });
  }
  
  if (pathname === '/emailjs-config') {
    // Return EmailJS configuration (only the public key for security)
    return res.status(200).json({
      publicKey: process.env.VITE_EMAILJS_PUBLIC_KEY || '',
      timestamp: new Date().toISOString()
    });
  }
  
  // Default response for root path
  if (pathname === '/') {
    return res.status(200).json({
      message: 'Main API is working!',
      timestamp: new Date().toISOString(),
      availableEndpoints: ['/health', '/images', '/emailjs-config']
    });
  }
  
  // Default response
  res.status(404).json({
    error: 'Not found',
    pathname: pathname,
    method: req.method,
    availableEndpoints: ['/health', '/images', '/emailjs-config']
  });
};