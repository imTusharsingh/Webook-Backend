const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ConversationSchema = new Schema({

    members: [{
        type: mongoose.Types.ObjectId,
        ref: 'USER'
    }]


}, { timestamps: true })

module.exports = mongoose.model("Conversation", ConversationSchema);


