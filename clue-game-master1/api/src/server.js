const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/db');
const bodyParser = require('body-parser');
var cors = require('cors')

require('./models/session');
require('./utils/cache');

const server = express();
const port = 12000;

server.use(bodyParser.json());
server.use(cors())

mongoose.connect(config.MONGO_CONN_STRING, {
   useUnifiedTopology: true,
   useNewUrlParser: true
});

require('./routes/session')(server);

server.listen(port, () => console.log(`Server is up on : ${port}!`));