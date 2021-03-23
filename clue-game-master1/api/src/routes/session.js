const mongoose = require('mongoose');
const session = mongoose.model('session');

module.exports = app => {
    app.get('/v1/game/instance/:sessionId', async (req, res) => {
        try {
            const instance = await session.findOne({_id: mongoose.Types.ObjectId(req.params.sessionId)}).cache({expire: 30});
            res.json(instance);
        } catch (err) {
            console.log(err.message);
            res.status(404).send({"error" : "Session Not Found"});
        }

    });

    app.post('/v1/game/instance/', async (req, res) => {
        const instance = new session();
        try {
            await instance.save();
            res.send(instance);
        } catch (err) {
            res.status(400).send(err.message);
        }
    });
};