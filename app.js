const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
var bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const jwtUrl = process.env.JWT_SECRET;
const dbUrl = process.env.DB_LINK;
const JWT_SECRET = {jwtUrl};

const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var database;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

// app.options('/*', (_, res) => {
//   res.sendStatus(200);
// });

app.get("/", (req, resp) => {
  resp.send("Welcome backend api");
});

app.get("/api/post", (req, resp) => {
  database
    .collection("post")
    .find({})
    .toArray((err, result) => {
      if (err) throw err;
      resp.send(result);
    });
});

app.get("/api/posts/:postId", async (req, resp) => {
  const postId = req.params.postId;
  let collection = await database.collection("post");
  let query = { _id: new ObjectId(postId) };
  let result = await collection.findOne(query);

  if (!result) resp.send("Not found").status(404);
  else resp.send(result).status(200);
  // const postId = req.params.postId;
  // database
  //   .collection("post")
  //   .findOne({ _id: new ObjectId(postId)})
  //   .then((result) => {
  //     resp.status(201).json(result);
  //   })
  //   .catch((err) => {
  //     resp.status(500).json({ err: "Could not create post" });
  //   });
});

app.post("/api/addPost", (req, resp) => {
  const postData = {
    title: req.body.title,
    content: req.body.content,
    category: req.body.category,
    tags: req.body.tags,
  };

  database
    .collection("post")
    .insertOne(postData)
    .then((result) => {
      resp.status(201).json(result);
    })
    .catch((err) => {
      resp.status(500).json({ err: "Could not create post" });
    });
});

app.patch("/api/updatePost/:postId", (req, resp) => {
  const postId = req.params.postId;
  console.log(postId)
  database
    .collection("post")
    .updateOne(
      { _id: new ObjectId(postId)},
      {
        $set: {
          title: req.body.title,
          content: req.body.content,
          category: req.body.category,
          tags: req.body.tags,
        },
      }
    )
    .then((result) => {
      resp.status(201).json(result);
    })
    .catch((err) => {
      resp.status(500).json({ err: "Could not update post" });
    });
});

app.delete("/api/delete/:postId", (req, resp) => {
  const postId = req.params.postId;
  console.log(postId);
  database
    .collection("post")
    .deleteOne({ _id: new ObjectId(postId) })
    .then((result) => {
      resp.status(200).json(result);
    })
    .catch((err) => {
      resp.status(204).json({ err: "Could not delete post" });
    });
});

app.get("/api/category", (req, resp) => {
  database
    .collection("category")
    .find({})
    .toArray((err, result) => {
      if (err) throw err;
      resp.send(result);
    });
});

app.get("/api/tags", (req, resp) => {
  database
    .collection("tags")
    .find({})
    .toArray((err, result) => {
      if (err) throw err;
      resp.send(result);
    });
});

app.post("/api/register", (req, resp) => {
  const userData = {
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
  };

  database
    .collection("users")
    .insertOne(userData)
    .then((result) => {
      resp.status(201).json(result);
    })
    .catch((err) => {
      resp.status(500).json({ err: "Could not create user" });
    });
});

app.post("/api/login", async (req, resp) => {
  const { email, password } = req.body;
  const user = database.collection("users").findOne({ email: email });
  if (!user) {
    return resp.json({ error: "User not found" });
  }
  if (password === user.password) {
    const token = jwt.sign({ email: user.email }, JWT_SECRET, {
      expiresIn: "15m",
    });
    if (resp.status(201)) {
      return resp.json({ status: "ok", data: token });
    } else {
      return resp.json({ error: "error" });
    }
  }
  resp.json({ status: "error", error: "Invalid password" });
});

MongoClient.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((client) => {
        const database = client.db("posts");
        console.log("Connection success");

        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    })
    .catch((err) => {
        console.error("Database connection failed:", err.message);
    });
