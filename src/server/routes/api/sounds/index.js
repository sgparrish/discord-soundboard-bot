const router = require('express').Router();

router.use('/clips', require('./clips'));
router.use('/recordings', require('./recordings'));

module.exports = router;