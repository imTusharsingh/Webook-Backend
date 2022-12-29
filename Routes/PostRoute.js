const express = require('express');
const mongoose = require('mongoose')

const auth = require("../middleware/auth")

const uploadImage = require("../helper/upload")

const Post = require("../Models/post")
const User = require("../Models/user");


const Router = express.Router();


//upload-post

Router.post("/upload-post", auth, uploadImage.single("post"), async (req, res) => {
    try {
        const { caption } = req.body;
        const userId = req.user_id;
        console.log(req.body, req.file)
        if (!req.file) {
            return res.status(400).json({ message: "please upload image!" })
        }

        const post = new Post({
            userId,
            postImage: req.file.path,
            caption
        });

        const upload = await post.save();
        console.log(upload)

        if (!upload) {
            return res.status(500).json({ message: "Server error" })
        }

        res.status(200).json({ message: "Post uploaded" })

    } catch (error) {
        res.status(500).json({ error: error })
    }
})


//get-self-posts

Router.get("/get-posts", auth, async (req, res) => {
    try {

        const { id } = req.query;
        console.log(req.query, req.user_id)
        if (!id || id === 'undefined') {
            console.log("hello")
            var posts = await Post.find({ userId: req.user_id }).populate({ path: "userId comments.userId", select: { _id: 1, name: 1 } })
        }
        else {
            console.log("hello id")
            var posts = await Post.find({ userId: id }).populate({ path: "userId comments.userId", select: { _id: 1, name: 1 } })
        }
        if (!posts) {
            return res.status(400).json({ message: "No Result" });
        }
        // console.log(posts)
        res.status(200).json(posts);


    } catch (error) {
        return res.status(500).json({ error: error })
    }
})

//delete-posts
Router.delete("/delete-post/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "please provide post Id" })
        }
        const remove = await Post.findOneAndDelete(
            {
                _id: id, userId: req.user_id
            }
        )
        if (!remove) {
            return res.status(404).json({ message: "Not found" })
        }
        res.status(200).json({ message: "removed", remove })
    } catch (error) {
        return res.status(500).json({ error: error })
    }
})

//update-post (caption update only)

Router.patch("/update-post", auth, async (req, res) => {
    try {
        const { id, caption } = req.body;
        console.log(id, caption)
        const update = await Post.findOneAndUpdate({ _id: id, userId: req.user_id }, { $set: { caption } })
        console.log(update)
        if (!update) {
            return res.status(400).json({ message: "Not found" })
        }
        res.status(200).json({ message: "updated", update });
    } catch (error) {
        return res.status(500).json({ error: error })
    }
})


//get-friends-posts 


Router.get("/get-friends-posts1", auth, async (req, res) => {
    try {


        const posts = await User.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(req.user_id)
                }
            },
            {
                $lookup: {
                    from: "posts",
                    localField: "friends",
                    foreignField: "userId",
                    as: "friendposts"
                }
            },

            {
                $lookup: {
                    from: "posts",
                    localField: "_id",
                    foreignField: "userId",
                    as: "userposts"
                }
            },
            {
                $project: {
                    "Posts": {
                        $concatArrays: ["$friendposts", "$userposts"]
                    },
                    _id: 0
                }
            }


        ])

        await Post.populate(posts[0].Posts, { path: "userId", select: { _id: 1, name: 1, profileImg: 1 } })
        await Post.populate(posts[0].Posts, { path: "comments.userId", select: { _id: 1, name: 1, profileImg: 1 } })
        // console.log(posts)
        res.status(200).json(posts[0].Posts)

    } catch (error) {
        res.status(500).json({ error: error })
    }
})

//get-post-by-id

Router.get("/post/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "please provide id of the post" })
        }
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "NO Post Found" })
        }
        res.status(200).json(post)

    } catch (error) {
        return res.status(500).json({ error: error })
    }
})




Router.get("/get-friends-posts", auth, async (req, res) => {
    try {
        const limit = parseInt(req.query?.limit);
        const page = req.query?.page;
        const posts = await User.aggregate([
            {
                '$match': {
                    '_id': mongoose.Types.ObjectId(req.user_id)
                }
            }, {
                '$addFields': {
                    'users': {
                        '$concatArrays': [
                            '$friends', [
                                mongoose.Types.ObjectId(req.user_id)
                            ]
                        ]
                    }
                }
            },
            {
                '$lookup': {
                    'from': 'posts',
                    'localField': 'users',
                    'foreignField': 'userId',
                    'as': 'posts'
                }
            },
            {
                '$unwind': {
                    'path': '$posts'
                }
            },
            {
                '$sort': {
                    'posts.createdAt': -1
                }
            },
            {
                "$limit": limit
            },
            {
                '$group': {
                    '_id': '$_id',
                    'posts': {
                        '$push': '$posts'
                    }
                }
            }
        ])
        if (posts.length === 0) { return res.status(200).json([]) }
        await Post.populate(posts[0].posts, { path: "userId", select: { _id: 1, name: 1, profileImg: 1 } })
        await Post.populate(posts[0].posts, { path: "comments.userId", select: { _id: 1, name: 1, profileImg: 1 } })

        res.status(200).json(posts[0].posts)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error })
    }
})



module.exports = Router;