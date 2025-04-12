const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const linkRoutes = require('./routes/linkRoutes');
const authController = require('./controllers/authController');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/link-analytics')
  .then(() => {
    console.log('Connected to MongoDB');
    authController.initUser();
  })
  .catch(err => console.error('MongoDB connection error:', err));


app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.get('/:shortCode', linkRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});