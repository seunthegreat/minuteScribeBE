require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");

//--Setting up OpenAI--//
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const model = 'text-davinci-002';

const generateMinute = async (req, res) => {
    res.send({ message: 'My job is to generate minute' });
};

module.exports = { generateMinute }