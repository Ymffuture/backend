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

app.use(cors({ origin: "https://blogiq.netlify.app", credentials: true }));
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

// Route to upload file directly
app.post("/api/upload", upload.single("image"), (req, res) => {
    try {
        console.log(req.file);
        res.status(200).json("Image has been uploaded successfully!");
    } catch (err) {
        res.status(500).json({ error: "Image upload failed", details: err.message });
    }
});

// Route to upload image via URL
app.post("/api/upload-url", async (req, res) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ error: "No image URL provided" });
    }

    try {
        // Download the image from the URL
        const response = await axios({
            url: imageUrl,
            responseType: 'stream',
        });

        // Generate a unique file name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(imageUrl);
        const fileName = `${uniqueSuffix}${fileExtension}`;
        const filePath = path.join(__dirname, "images", fileName);

        // Save the image to the images directory
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on("finish", () => {
            res.status(200).json({ message: "Image has been uploaded successfully!", fileName: fileName });
        });

        writer.on("error", (err) => {
            res.status(500).json({ error: "Image upload failed", details: err.message });
        });

    } catch (err) {
        res.status(500).json({ error: "Image download failed", details: err.message });
    }
});


// Start the server
app.listen(process.env.PORT, () => {
    connectDB();
    console.log("Server is running on port " + process.env.PORT);
});
