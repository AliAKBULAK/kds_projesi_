const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Sayfa Yönlendirmesi
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});
