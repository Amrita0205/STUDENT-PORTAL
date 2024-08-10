// models/announcement.js

const mongoose = require('mongoose');

// Define the schema for announcements
const announcementSchema = new mongoose.Schema({
    batch: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        // ref: 'User', // Reference to the User model for admin user
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a model from the schema
const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
