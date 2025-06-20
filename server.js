import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
let posts = [];

app.set("views", "./public/views");
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("partials/index", {posts : posts});
});

app.get("/add", (req,res) => {
    res.sendFile(__dirname+"/public/add-post.html");
});
app.get("/post/:postId", (req, res) => {
    const postId = parseInt(req.params.postId);
    const post = posts[postId];
  
    if (post) {
      res.render("partials/post", { post });
    } else {
      res.status(404).send("Post not found");
    }
  });
  
app.post("/submit", (req, res) => {
    const post = {
        title: req.body.title,
        content: req.body.content
    }
    posts.push(post);

    res.redirect("/");
});

app.post("/delete/:postId", (req, res) => {
    const postId = req.params.postId;
    if(postId >= 0 && postId < posts.length) {
        posts.splice(postId, 1);
    }
    res.redirect("/");
});




app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});