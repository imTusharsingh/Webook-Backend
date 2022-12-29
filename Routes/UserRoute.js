const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const upload = require("../helper/upload")



const Router = express.Router();



//auth middile-ware
const auth = require('../middleware/auth');



//userModel
const User = require('../Models/user');


//registeration of user


Router.post("/register", async (req, res) => {
    try {
        const { name, email, password, address } = req.body;
        console.log(req.body)

        const checkUser = await User.findOne({ email: email });
        if (checkUser) {
            return res.status(400).json({ message: "User already Exists" })

        }
        console.log(checkUser)

        //hasing the password
        const hash = await bcrypt.hash(password, 10);
        console.log(hash)

        const user = new User({
            name,
            email,
            password: hash,
            address
        })
        const newUser = await user.save()


        res.status(200).json({ message: "User added Succesfully", newUser })



    } catch (error) {
        return res.status(500).json({ error: error })
    }
})


//login route for user


Router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body)
        console.log(email)
        console.log(password)

        const user = await User.findOne({ email: email })
        if (!user) {
            return res.status(400).json({ message: "Wrong credentials" });
        }
        console.log(user)

        const result = await bcrypt.compare(password, user.password);
        console.log(result)
        if (!result) {
            return res.status(400).json({ message: "Wrong credentials" });
        }
        console.log(process.env.JWT_SECRET_KEY)

        // setting JWT Token

        jwt.sign(
            { _id: user._id, name: user.name, profileImg: user.profileImg },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "15d"
            },
            ((error, token) => {
                if (error) {
                    return res.status(500).json({ message: "Server error" })
                }
                res.status(200).json({ message: "Login Successfully", token })
            })
        )


    } catch (error) {
        return res.status(500).json({ error: error })
    }
})


//edit profile 

Router.patch("/edit-profile", auth, upload.single("profileImg"), async (req, res) => {
    try {
        const _id = req.user_id;
        const { name, city, state, line1, line2, about } = req.body
        console.log(req.body, req.file)
        if (req.file) {
            var profileImg = req.file.path
        }
        // console.log(req.body)

        console.log(_id)
        const user = await User.findByIdAndUpdate(_id, { $set: { name, profileImg, about, "address.city": city, "address.state": state, "address.line1": line1, "address.line2": line2 } })

        if (!user) {
            return res.status(500).json({ message: "Server error" })
        }

        res.status(200).json({ message: "profile updated Successfully" })

    } catch (error) {
        res.status(500).json({ error: error })
    }
})

//search user by city,state

Router.post("/search-user", auth, async (req, res) => {
    try {
        const { city, state } = req.query;
        if (req.body.search) {
            var userPattern = new RegExp("^" + req.body.search, 'i')
        }
        else {
            var userPattern = req.body.search
        }

        const limit = req.body.more
        console.log(req.query, req.body)

        if (city && state) {
            filter =
                [
                    {
                        $match: { "name": userPattern, "address.city": city, "address.state": state }
                    },
                    {
                        $sort: { "name": 1 }
                    },
                    {
                        $limit: limit
                    },
                    {
                        $project: { "password": 0, "__v": 0 }
                    }
                ]
        }
        else if (city) {
            filter =
                [
                    {
                        $match: { "name": userPattern, "address.city": city }
                    },
                    {
                        $sort: { "name": 1 }
                    },
                    {
                        $limit: limit
                    },
                    {
                        $project: { "password": 0, "__v": 0 }
                    }
                ]
        }
        else if (state) {
            filter =
                [
                    {
                        $match: { "name": userPattern, "address.state": state }
                    },
                    {
                        $sort: { "name": 1 }
                    },
                    {
                        $limit: limit
                    },
                    {
                        $project: { "password": 0, "__v": 0 }
                    }
                ]
        }
        else {
            filter =
                [
                    {
                        $match: { "name": userPattern }
                    },
                    {
                        $sort: { "name": 1 }
                    },
                    {
                        $limit: limit
                    },
                    {
                        $project: { "password": 0, "__v": 0 }
                    }
                ]
        }

        const user = await User.aggregate([filter]);
        // const user = await User.find({ "name": userPattern })




        res.status(200).json(user);

    } catch (error) {
        return res.status(500).json({ error: error })
    }
})

//get user by id

Router.get("/user", auth, async (req, res) => {
    try {
        const { id } = req.query;
        console.log(req.query, req.user_id)
        if (!id || id === 'undefined') {
            console.log("hello")
            var user = await User.findById(req.user_id, { "password": 0, })
        }
        else {
            console.log("hello id")
            var user = await User.findById(id, { "password": 0 })
        }
        if (!user) {
            return res.status(400).json({ message: "No Result" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error })
    }
})





module.exports = Router;