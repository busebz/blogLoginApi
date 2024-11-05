const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
var bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const jwtUrl = process.env.JWT_SECRET;
const dbUrl = process.env.DB_LINK;
const JWT_SECRET = jwtUrl;

const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let database;

MongoClient.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((client) => {
        database = client.db("posts");
        console.log("Connection success");

        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    })
    .catch((err) => {
        console.error("Database connection failed:", err.message);
    });

app.get("/", (req, resp) => {
    resp.send("Welcome backend api");
});

// Tüm postları getirme
app.get("/api/post", async (req, resp) => {
    try {
        const posts = await database.collection("post").find({}).toArray();
        resp.status(200).json(posts);
    } catch (err) {
        console.error("Error fetching posts:", err);
        resp.status(500).send("Error fetching posts");
    }
});

// Belirli bir postu getirme
app.get("/api/posts/:postId", async (req, resp) => {
    const postId = req.params.postId;
    try {
        const result = await database.collection("post").findOne({ _id: new ObjectId(postId) });
        if (!result) {
            return resp.status(404).send("Not found");
        }
        resp.status(200).json(result);
    } catch (err) {
        console.error("Error fetching post:", err);
        resp.status(500).send("Error fetching post");
    }
});

// Yeni post ekleme
app.post("/api/addPost", async (req, resp) => {
    const postData = {
        title: req.body.title,
        content: req.body.content,
        category: req.body.category,
        tags: req.body.tags,
    };

    try {
        const result = await database.collection("post").insertOne(postData);
        resp.status(201).json(result);
    } catch (err) {
        console.error("Could not create post:", err);
        resp.status(500).json({ err: "Could not create post" });
    }
});

// Post güncelleme
app.patch("/api/updatePost/:postId", async (req, resp) => {
    const postId = req.params.postId;
    try {
        const result = await database.collection("post").updateOne(
            { _id: new ObjectId(postId) },
            {
                $set: {
                    title: req.body.title,
                    content: req.body.content,
                    category: req.body.category,
                    tags: req.body.tags,
                },
            }
        );
        resp.status(200).json(result);
    } catch (err) {
        console.error("Could not update post:", err);
        resp.status(500).json({ err: "Could not update post" });
    }
});

// Post silme
app.delete("/api/delete/:postId", async (req, resp) => {
    const postId = req.params.postId;
    try {
        const result = await database.collection("post").deleteOne({ _id: new ObjectId(postId) });
        resp.status(200).json(result);
    } catch (err) {
        console.error("Could not delete post:", err);
        resp.status(500).json({ err: "Could not delete post" });
    }
});

// Tüm kategorileri getirme
app.get("/api/category", async (req, resp) => {
    try {
        const categories = await database.collection("category").find({}).toArray();
        resp.status(200).json(categories);
    } catch (err) {
        console.error("Error fetching categories:", err);
        resp.status(500).send("Error fetching categories");
    }
});

// Tüm etiketleri getirme
app.get("/api/tags", async (req, resp) => {
    try {
        const tags = await database.collection("tags").find({}).toArray();
        resp.status(200).json(tags);
    } catch (err) {
        console.error("Error fetching tags:", err);
        resp.status(500).send("Error fetching tags");
    }
});

// Kullanıcı kaydı
app.post("/api/register", async (req, resp) => {
    const userData = {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
    };

    try {
        const result = await database.collection("users").insertOne(userData);
        resp.status(201).json(result);
    } catch (err) {
        console.error("Could not create user:", err);
        resp.status(500).json({ err: "Could not create user" });
    }
});

// Kullanıcı girişi
app.post("/api/login", async (req, resp) => {
    const { email, password } = req.body;
    try {
        const user = await database.collection("users").findOne({ email: email });
        if (!user) {
            return resp.status(404).json({ error: "User not found" });
        }
        if (password === user.password) {
            const token = jwt.sign({ email: user.email }, JWT_SECRET, {
                expiresIn: "15m",
            });
            return resp.status(200).json({ status: "ok", data: token });
        }
        resp.status(401).json({ status: "error", error: "Invalid password" });
    } catch (err) {
        console.error("Login error:", err);
        resp.status(500).json({ error: "Login error" });
    }
});
