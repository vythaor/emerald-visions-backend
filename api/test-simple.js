module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    message: 'Simple test working!',
    timestamp: new Date().toISOString()
  });
};
