const express = require("express");
const Message = require("../Models/Message");
const auth = require('../middleware/auth')
const mongoose = require('mongoose')
const router = express.Router()


//add new message

router.post("/new-message", auth, async (req, res) => {
    const { conversationId, text, reciever } = req.body;
    console.log(req.body)

    console.log(req.body)
    const newMessage = new Message({
        conversationId,
        // sender: req.user_id,
        reciever,
        text
    });


    try {
        const savedMessage = await newMessage.save();
        res.status(200).json(savedMessage);
    } catch (err) {
        res.status(500).json(err);
    }
});

//get

router.get("/get-message/:conversationId", auth, async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId,
        })
            .populate({

                path: 'reciever', select: { name: 1, profileImg: 1, _id: 1 }

            })

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;