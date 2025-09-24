
const express = require('express');
const path = require('path');

const app = express();

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`✅ Interface server running on port ${port}`);
});
