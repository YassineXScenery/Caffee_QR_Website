const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportReceiverController');

router.get('/report-receivers', controller.getReportReceivers);
router.post('/report-receivers', controller.addReportReceiver);
router.put('/report-receivers/:id', controller.modifyReportReceiver);
router.delete('/report-receivers/:id', controller.deleteReportReceiver);

module.exports = router;