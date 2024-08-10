const mongoose=require('mongoose');

const leaderboardSchema= new mongoose.Schema({
    name:{
        type:'String',
        required:true
    },
    email:{
        type:'String',
        required:true
    },
    batch:{
        type:'String',
        required:true
    },
    cgpa:{
        type:'String',
        required:true
    },
    extra_activity: { type: [String], default: ['none of them'] }
});
const leaderboard=mongoose.model('Leaderboard',leaderboardSchema);
module.exports=leaderboard;