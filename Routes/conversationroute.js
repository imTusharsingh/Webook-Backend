const express = require("express")
const Conversation = require("../Models/Conversation");
const auth = require("../middleware/auth")

const router = express.Router()

//new conv

router.post("/create-conversation", auth, async (req, res) => {
    if (!req.body.receiverId) {
        return res.status(400).json({ message: "No ReciverId found" })
    }
    const check = await Conversation.findOne({
        $and: [
            {
                members: { $in: [req.body.receiverId] }
            },
            {
                members: { $in: [req.user_id,] }
            }]
    })
    if (check) {
        return res.status(401).json({ message: "already Present" })
    }
    console.log(check)
    const newConversation = new Conversation({
        members: [req.user_id, req.body.receiverId],
    });

    try {
        const savedConversation = await newConversation.save();

        res.status(200).json({ savedConversation, message: "Conversation created succesfully" });
    } catch (err) {
        res.status(500).json(err);
    }
});

//get conv of a user

router.get("/get-all-conversation", auth, async (req, res) => {
    try {
        const conversation = await Conversation.find({
            members: { $in: [req.user_id] }
        }).populate('members', ["name", "_id", "profileImg"])
        // console.log(conversation)
        res.status(200).json(conversation);
    } catch (err) {
        res.status(500).json(err);
    }
});



module.exports = router;