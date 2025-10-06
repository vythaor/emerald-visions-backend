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
  
  // Get query parameters
  const url = new URL(req.url, `https://${req.headers.host}`);
  const searchParams = url.searchParams;
  const folder = searchParams.get('folder') || '';
  const max = parseInt(searchParams.get('max')) || 30;
  
  console.log('Images function called:', { method: req.method, folder, max, url: req.url });
  
  // For now, return a mock response
  // Later we'll integrate with Cloudinary
  const mockImages = [
    {
      id: '1',
      url: 'https://res.cloudinary.com/ddwq9besf/image/upload/f_auto,q_auto/sample1.jpg',
      alt: 'Sample image 1'
    },
    {
      id: '2', 
      url: 'https://res.cloudinary.com/ddwq9besf/image/upload/f_auto,q_auto/sample2.jpg',
      alt: 'Sample image 2'
    }
  ];
  
  res.status(200).json({
    success: true,
    message: 'Images API is working!',
    folder: folder,
    max: max,
    count: mockImages.length,
    images: mockImages.slice(0, max),
    timestamp: new Date().toISOString()
  });
};
