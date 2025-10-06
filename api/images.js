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
  
  // Get query parameters
  const url = new URL(req.url, `https://${req.headers.host}`);
  const searchParams = url.searchParams;
  const folder = searchParams.get('folder') || '';
  const max = parseInt(searchParams.get('max')) || 30;
  
  // Map folder names to actual Cloudinary folder paths
  const folderMapping = {
    'wedding': '2am/wedding',
    'outdoor': '2am/outdoor', 
    'sport': '2am/sport',
    'event': '2am/event',
    'indoor': '2am/indoor',
    'home': '2am/home'
  };
  
  const cloudinaryFolder = folderMapping[folder] || `2am/${folder}`;
  
  console.log('Images function called:', { method: req.method, folder, cloudinaryFolder, max, url: req.url });
  console.log('Environment variables:', {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
    apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
  });
  
  try {
    // Check if environment variables are available
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary environment variables not set');
    }
    
    // Fetch images from Cloudinary using the correct API format
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/image?type=upload&prefix=${cloudinaryFolder}&max_results=${max}`;
    
    console.log('Cloudinary URL:', cloudinaryUrl);
    console.log('Environment check:', {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
    });
    
    const response = await fetch(cloudinaryUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.CLOUDINARY_API_KEY + ':' + process.env.CLOUDINARY_API_SECRET).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary API error response:', errorText);
      throw new Error(`Cloudinary API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Cloudinary response:', JSON.stringify(data, null, 2));
    
    // Transform Cloudinary response to our format
    const images = data.resources.map((resource, index) => ({
      id: resource.public_id,
      url: `https://res.cloudinary.com/ddwq9besf/image/upload/f_auto,q_auto/${resource.public_id}.${resource.format}`,
      alt: `Image ${index + 1}`,
      width: resource.width,
      height: resource.height
    }));
    
    res.status(200).json({
      success: true,
      message: 'Images fetched from Cloudinary!',
      folder: folder,
      max: max,
      count: images.length,
      images: images,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching images:', error);
    
    // Fallback to mock data if Cloudinary fails
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
      message: 'Using fallback images due to Cloudinary error',
      folder: folder,
      max: max,
      count: mockImages.length,
      images: mockImages.slice(0, max),
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
