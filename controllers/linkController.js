const Link = require('../models/Link');
const crypto = require('crypto');

// Generate random short code
const generateShortCode = () => {
  return crypto.randomBytes(10).toString('base64')
    .replace(/\+/g, '').replace(/\//g, '').substring(0, 6);
};

// Create short link
exports.createShortLink = async (req, res) => {
  try {
    const { originalUrl, customAlias, expirationDays } = req.body;
    
    // Generate short code or use custom alias
    const shortCode = customAlias || generateShortCode();
    
    // Calculate expiration date if provided
    const expiresAt = expirationDays 
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000) 
      : null;
    
    // Create new link
    const link = new Link({
      userId: req.userId,
      originalUrl,
      shortCode,
      expiresAt
    });
    
    await link.save();
    
    res.status(201).json({
      shortUrl: `${process.env.BASE_URL}/${shortCode}`,
      ...link.toObject()
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating short link' });
  }
};

// Get all links for a user

exports.getUserLinks = async (req, res) => {
  try {
    const links = await Link.find({ userId: req.userId });
    
    const linksWithStats = links.map(link => ({
      id: link._id,
      originalUrl: link.originalUrl,
      shortUrl: `${process.env.BASE_URL}/${link.shortCode}`,
      shortCode: link.shortCode,
      totalClicks: link.clicks.length,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      isExpired: link.expiresAt && link.expiresAt < new Date()
    }));
    
    res.json(linksWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Redirect and log click

exports.redirectToOriginal = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const link = await Link.findOne({ shortCode });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }
    
    if (link.expiresAt && link.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Link has expired' });
    }

    const clickData = {
      timestamp: new Date(),
      ipAddress: req.ip,
      device: req.get('User-Agent').includes('Mobile') ? 'Mobile' : 'Desktop',
      browser: req.get('User-Agent')
    };
    
    Link.updateOne(
      { _id: link._id },
      { $push: { clicks: clickData } }
    ).exec();
    

    res.redirect(link.originalUrl);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics for a specific link
exports.getLinkAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    
    const link = await Link.findOne({ 
      _id: id,
      userId: req.userId
    });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }
    
    // Process analytics data
    const clicksByDate = {};
    const devices = { Desktop: 0, Mobile: 0 };
    const browsers = {};
    
    link.clicks.forEach(click => {
      // Count by date
      const date = click.timestamp.toISOString().split('T')[0];
      clicksByDate[date] = (clicksByDate[date] || 0) + 1;
      
      // Count by device
      if (click.device) {
        devices[click.device] = (devices[click.device] || 0) + 1;
      }
      
      // Extract browser
      let browser = 'Unknown';
      if (click.browser) {
        if (click.browser.includes('Chrome')) browser = 'Chrome';
        else if (click.browser.includes('Firefox')) browser = 'Firefox';
        else if (click.browser.includes('Safari')) browser = 'Safari';
        else if (click.browser.includes('Edge')) browser = 'Edge';
        
        browsers[browser] = (browsers[browser] || 0) + 1;
      }
    });
    
    res.json({
      link: {
        id: link._id,
        originalUrl: link.originalUrl,
        shortUrl: `${process.env.BASE_URL}/${link.shortCode}`,
        totalClicks: link.clicks.length,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt
      },
      analytics: {
        clicksByDate: Object.entries(clicksByDate).map(([date, count]) => ({ date, count })),
        devices: Object.entries(devices).map(([device, count]) => ({ device, count })),
        browsers: Object.entries(browsers).map(([browser, count]) => ({ browser, count }))
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};