const mongoose = require('mongoose');

const Schema = mongoose.Schema;


//UserSchema
const userSchema = new Schema({
    profileImg: {
        type: String,
    },
    name: {
        type: String,
        required: [true, 'Please Enter Your Name!']
    },
    about: {
        type: String,
    },
    email: {
        type: String,
        required: [true, 'Please Enter Email!'],
        unique: [true, 'Alreday Registered!'],
        match: [/\S+@\S+\.\S+/, 'is invalid!']
    },
    password: {
        type: String,
        required: [true, 'Please Enter Your Password!'],
    },
    friends: [{
        type: mongoose.Types.ObjectId,
        ref: 'USER'
    }],
    address: {
        line1: {
            type: String,
            required: [true, 'Please Enter Your Address!']
        },
        line2: {
            type: String
        },
        city: {
            type: String,
            required: [true, 'Please Enter Your City!']
        },
        state: {
            type: String,
            required: [true, 'Please Enter Your State!']
        },

    }
}, { timestamps: true })

userSchema.pre("save", function (next) {
    this.name =
        this.name.trim()[0].toUpperCase() + this.name.slice(1).toLowerCase();
    next();
});

module.exports = mongoose.model("USER", userSchema);