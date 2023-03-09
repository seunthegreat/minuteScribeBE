require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const router = require("./router");

//--defining the Express app--//
const app = express();
//-- adding Helmet to enhance Rest API's security--//
app.use(helmet());
//--using bodyParser to parse JSON bodies into JS objects--//
app.use(bodyParser.json());
//--enabling CORS for all requests--//
app.use(cors());
app.use(router);
//--using bodyParser to parse JSON bodies into JS objects--//
app.use(bodyParser.json());
const PORT = process.env.PORT || 3030;

app.get('/', (req, res) => {
    res.send("Everything is working fine!");
}); 

//--starting the server--//
app.listen(PORT, () => {
 console.log(`listening on port ${PORT}`);
});