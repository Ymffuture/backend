const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require("path");
const cookieParser = require('cookie-parser');
const authRoute = require('./routes/auth');
const userRoute = require('./routes/users');
const postRoute = require('./routes/posts');
const commentRoute = require('./routes/comments');

// Load environment variables
dotenv.config();

// Connect to the database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database connected successfully!");
    } catch (err) {
        console.error("Database connection error: ", err);
    }
};

// Middlewares
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "/images")));
app.use(cors({ origin: "https://66b5a21bc4712df1cfc90400--splendid-sherbet-21ae5e.netlify.app/", credentials: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/comments", commentRoute);

// Image upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
        console.log(req.file);
        res.status(200).json("Image has been uploaded successfully!");
    } catch (err) {
        res.status(500).json({ error: "Image upload failed", details: err.message });
    }
});

// Start the server
app.listen(process.env.PORT, () => {
    connectDB();
    console.log("Server is running on port " + process.env.PORT);
});
