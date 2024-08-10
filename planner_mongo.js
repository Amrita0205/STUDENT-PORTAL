const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/LoginSignUpTutorial")//connect the node to the mongodb database
    .then(() => {
        console.log("mongo connected");
    })
    .catch(() => {  
        console.log("failed to connect");
    })
// Define Task Schema
const TaskSchema = new mongoose.Schema({
    task: {
        type: String,
        required: true
    },
    userEmail: {
        type: String, // Assuming email ID is stored as a string
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
},
{
    timestamps: true
});

// Create Task model based on TaskSchema
const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
