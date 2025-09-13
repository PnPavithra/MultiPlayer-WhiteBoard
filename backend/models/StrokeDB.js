const mongoose = require('mongoose');

const strokeSchema = new mongoose.Schema({
    userId: String,
    tool: String,
    color: String,
    size: Number,

    points:[{ x: Number, y: Number }],

    id: String,
    createdAt: { type: Date, default: Date.now},
    undone: { type: Boolean, default: false}
});

module.exports = mongoose.model('StrokeDB', strokeSchema);