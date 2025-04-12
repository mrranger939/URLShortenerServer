
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
  
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
   
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.initUser = async () => {
  try {
    const userExists = await User.findOne({ email: 'intern@dacoid.com' });
    if (!userExists) {
      await User.create({
        email: 'intern@dacoid.com',
        password: 'Test123'
      });
      console.log('Default user created');
    }
    const devUserExists = await User.findOne({ email: 'ranger@gmail.com' });
    if (!devUserExists) {
      await User.create({
        email: 'ranger@gmail.com',
        password: '1234'
      });
      console.log('dev user created');
    }
  } catch (err) {
    console.error('Error creating default user:', err);
  }
};