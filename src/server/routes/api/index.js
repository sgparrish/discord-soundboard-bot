const router = require('express').Router();

router.use('/sounds', require('./sounds'));

module.exports = router;