const express = require('express')
const router = express.Router()
const controller = require('../controllers/recordsController')

router.get('/search', controller.searchRecords)

module.exports = router