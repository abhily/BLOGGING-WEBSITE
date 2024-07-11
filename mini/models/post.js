const mong =require('mongoose')

mong.connect("mongodb://localhost:27017/MiniProject")

const postSchema=mong.Schema({
    userid:{
        type:mong.Schema.Types.ObjectId,
        ref:'user'
    },
    postname:String,
    content:String,
    Date:{
        type: Date,
        default:Date.now()
    },
    likes:{
        type: Number,
        default:0
    },
    likedBy: [{
        type: mong.Schema.Types.ObjectId,
        ref: 'user'
    }]
})

module.exports=mong.model("post",postSchema)