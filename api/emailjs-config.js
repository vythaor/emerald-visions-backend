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
  
  // Return EmailJS configuration (only the public key for security)
  res.status(200).json({
    publicKey: process.env.VITE_EMAILJS_PUBLIC_KEY || '',
    timestamp: new Date().toISOString()
  });
};
