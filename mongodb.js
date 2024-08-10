const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect("mongodb://localhost:27017/LoginSignUpTutorial")//connect the node to the mongodb database
    .then(() => {  // ()=>{ } this is a callback function on a promise if successful here else down
       
        console.log("mongo connected");
    })
    .catch(() => {
        console.log("failed to connect");
    })

// registration schema schema is only required for registration as in login you only do the checking part
const LogInSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures unique email addresses
        lowercase: true, // Converts email to lowercase
        trim: true // Removes whitespace around email
    },
    password: {
        type: String,
        required: true
  
    },
    batch: {
        type: String,
        required: true
    },
    place: {
        type: String,
        default: '-' // Default value for place
    },
    role: {
        type: String,
        default: 'user' // Default role (e.g., 'user', 'admin')
    },
    bio: {
        type: String,
        default: '-'
    },
    speciality: {
        type: String,
        default: '-'
    },
    description: {
        type: String,
        default: '-'
    },
    profilePicture: {
        type: String,
        default: '-'
    },
    isBlock:{
        type:Boolean,
        default: false
    }
},
{
    timestamps: true
});


const User = new mongoose.model('LogIncollection', LogInSchema); //creates one collection if not present else connects if it is present
//the collection for login detais is this however we can change it

module.exports = User; //User is just a variable you can use collections also

