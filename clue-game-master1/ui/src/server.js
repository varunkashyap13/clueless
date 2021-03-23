const express = require('express');
const app = express();
const PORT = 14000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('test!');
});


app.listen(PORT, () => console.log(`Server up on port: ${PORT}`));
