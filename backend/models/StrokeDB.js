const mongoose = require('mongoose');

const strokeSchema = new mongoose.Schema({
    userId: String,
    tool: String,
    color: String,
    size: Number,

    points:[
        { x: Number, y: Number }
    ],

    createdAt: { type: Date, default: Date.now}
});

module.exports = mongoose.model('StrokeDB', strokeSchema);