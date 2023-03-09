const router = require("express").Router();
const { generateMinute } = require("./services/minute-generator");

//--OpenAI endpoints--//
router.post("/generate-minute", generateMinute);

module.exports = router;