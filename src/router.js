const router = require("express").Router();
//--methods--//
const { generateMinute } = require("./services/minute-generator");

//--OpenAI endpoints--//
router.get("/generate-minute", generateMinute);

module.exports = router;