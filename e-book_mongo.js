const mongoose = require('mongoose');

// Define the schema for e-books
const eBookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    course: {
        type: String,
        required: true
    },
    teacher: {
        type: String,
        required: true
    },
    file: {
        type: String,
        required: true
    }
});

// Create a model from the schema
const EBook = mongoose.model('EBook', eBookSchema);

module.exports = EBook;
