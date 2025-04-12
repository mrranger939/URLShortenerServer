const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/', authMiddleware, linkController.createShortLink);
router.get('/', authMiddleware, linkController.getUserLinks);
router.get('/:id/analytics', authMiddleware, linkController.getLinkAnalytics);


router.get('/:shortCode', linkController.redirectToOriginal);

module.exports = router;