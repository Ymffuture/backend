const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json("User already exists!");
        }

        const salt = await bcrypt.genSalt(15);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, email, password: hashedPassword });
        const savedUser = await newUser.save();

        res.status(200).json(savedUser);
    } catch (err) {
        res.status(500).json({ message: "Error during registration", error: err });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json("User not found!");
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json("Wrong credentials!");
        }

        const token = jwt.sign(
            { _id: user._id, username: user.username, email: user.email },
            process.env.SECRET,
            { expiresIn: "3d" }
        );

        const { password: userPassword, ...info } = user._doc;
        res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true }).status(200).json(info);
    } catch (err) {
        res.status(500).json({ message: "Error during login", error: err });
    }
});

// LOGOUT
router.get("/logout", (req, res) => {
    try {
        res.clearCookie("token", { sameSite: "none", secure: true }).status(200).send("User logged out successfully!");
    } catch (err) {
        res.status(500).json({ message: "Error during logout", error: err });
    }
});

// REFETCH USER
router.get("/refetch", (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json("No token provided!");
    }

    jwt.verify(token, process.env.SECRET, (err, data) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token", error: err });
        }
        res.status(200).json(data);
    });
});

module.exports = router;
