import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const saltRounds = 10;
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));


app.use(
    session({
        secret: process.env.SECRET_WORD,
        resave: false,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());


const db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  ssl: true
});

db.connect()
  .then(() => console.log("Connected to Neon DB"))
  .catch(err => console.error("Connection error", err.stack));

export default db;

app.set("views", "./public/views");
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
    if(req.isAuthenticated()) {
        const userId = req.user.id;
        let result = await db.query(`
            SELECT posts.*, users.email
            FROM posts
            JOIN users ON posts.user_id = users.id
            WHERE posts.user_id = $1
            ORDER BY posts.id DESC
       ` , [userId]);

        const posts = result.rows;
    res.render("partials/index", {posts : posts});
    } else {
        res.sendFile(__dirname+"/public/login.html");
    }
});

app.get("/add", (req,res) => {
    res.sendFile(__dirname+"/public/add-post.html");
});
app.get("/post/:postId", async (req, res) => {
    const postId = parseInt(req.params.postId);
    const result = await db.query("SELECT * FROM posts WHERE id = $1",
        [postId]
    );
    const post = result.rows[0];
    console.log("post: ", post);
  
    if (post) {
      res.render("partials/post", { post });
    } else {
      res.status(404).send("Post not found");
    }
  });
  
app.post("/submit-add", async (req, res) => {
    const title = req.body.title;
    const content = req.body.content;
    const userId = req.user.id;
    try {
        const result = await db.query("INSERT INTO POSTS (title, content, user_id) VALUES ($1, $2, $3)",
            [title, content, userId]
         );
         console.log(result);
         res.redirect("/");
    }
    catch(err) {
        console.log(err);
    }
});

app.post("/delete/:postId", async (req, res) => {
    const postId = req.params.postId;
    try {
        await db.query("DELETE FROM posts WHERE id = $1",
            [postId]
        );
        res.redirect("/");
    }
    catch(err) {
        console.log(err);
    }
});

app.post("/edit/:postId", async (req, res) => {
const postId = req.params.postId;
const result = await db.query("SELECT * FROM posts WHERE id = $1",
    [postId]
);
const post = result.rows[0];
res.render("partials/edit-post", {
    index : postId,
    post: post
});
});

app.post("/submit-edit/:postId", async (req, res) => {
    const postId = req.params.postId;
    const result = await db.query("SELECT * FROM posts WHERE id = $1",
        [postId]
    );
    const post = result.rows[0];
    console.log(post);

    const newPostTitle = req.body.title;
    const newPostContent = req.body.content;

    if(post.title !== newPostTitle) {
        await db.query("UPDATE posts SET title = $1 WHERE id = $2",
            [newPostTitle, postId]
        );
    }
    if(post.content !== newPostContent) {
        await db.query("UPDATE posts SET content = $1 WHERE id = $2",
            [newPostContent, postId]
        );
    }
res.redirect("/");
});

app.get("/logout", (req, res, next) => {
    req.logout(function(err) {
      if (err) { return next(err); }
      req.session.destroy(() => {      
        res.clearCookie('connect.sid'); 
        res.sendFile(__dirname+"/public/login.html");
    });
    });
  });

app.get("/register", (req, res) => {
    res.sendFile(__dirname+"/public/register.html");
});
app.post("/submit-register", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const data = await db.query("SELECT * FROM users WHERE email = $1",
        [email]
    );
    if(data.rows.length > 0) {
        res.send("A user with this email address already exists. Try to login instead!");
    }
    else {
        try {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if(err) {
                    console.log("Error while hashing: ", err);
                }
                else {
                    const result =   await db.query(
                        "INSERT INTO users (email, password) VALUES ($1, $2)",
                        [email, hash]
                    );
                    console.log(result);
                    res.redirect("/login");
                }
            }); 
        }
        catch(err)  {
            console.log(err);
        }
    }
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname+"/public/login.html");
});

app.post("/submit-login", 
    passport.authenticate("local",{
        successRedirect: "/",
        failureRedirect: "/login",
    })
);

passport.use(
    new Strategy({
        usernameField: "email",
        passwordField: "password",
    },
        async function verify(username, password, cb) {
        try {
            console.log(username);
            const checkUser = await db.query("SELECT * FROM users WHERE email = $1",
                [username]
            );
            if(checkUser.rows.length === 0) {
                console.log("No user found.");
                return cb(null, false);
            }
            else if(checkUser.rows.length > 0) {
                const user = checkUser.rows[0];
                const storedHashedPassword = user.password;
                bcrypt.compare(password, storedHashedPassword, (err, valid) => {
                    if(err) {
                        console.error("Error comparing passwords/ bcrypt error: ", err);
                    } else {
                        if(valid) {
                            return cb(null, user);
                        } else {
                            return cb(null, false);
                        }
                    }
                });
            }
        }
        catch (err) {
            console.log(err);    
        }
    })
);

passport.serializeUser((user, cb) => {
    cb(null, user);
});
passport.deserializeUser((user, cb) => {
    cb(null, user);
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});