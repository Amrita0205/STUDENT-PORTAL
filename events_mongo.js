const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        // default: 'admin' // Assuming admin as default creator
        required: true

    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Event = mongoose.model('Events', eventSchema);

module.exports = Event;
