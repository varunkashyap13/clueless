const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    token : {type: Number, default: function(){ return Math.random().toString().split('.')[1].substr(2,6) ;} },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

mongoose.model('session', schema);