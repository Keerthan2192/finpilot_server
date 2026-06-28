const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.post('/advice', auth, aiController.getAiAdvice);
router.get('/reports', auth, aiController.getAiReports);
router.delete('/reports/:id', auth, aiController.deleteAiReport);

module.exports = router;
