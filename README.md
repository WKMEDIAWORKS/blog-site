Blog Web App

A simple full-stack Blog Application build using Node.js, Express, Passport.js authentication and PostgreSQL database.
Users can register, login, create posts, view posts, edit posts, and delete posts.
The app is deployed on Render with database hosted on Neon.tech.


Features

- User Registeration & Login (with password hashing using Bcrypt)
- Authentication using Passport.js
- Session management with express-session
- Create, Read, Update, and Delete blog posts
- PostgreSQL database with 'users' and posts' tables
- Fully deployed and publicly accessible


Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, EJS |
| Backend | Node.js, Express.js |
| Auth | Passport.js (Local Strategy), bcrypt |
| Database | PostgreSQL (Neon.tech) |
| Deploment | Render |



Environment Variables

Create a '.env' file in the project root and add:
DATABASE_URL=your_neon_postgres_connection_string_here
SESSION_SECRET=your_secret_key


Run Locally

Make sure you have Node.js & PostgreSQL installed

Clone the repo
git clone https://github.com/WKMEDIAWORKS/blog-site.git

Go into the project folder
cd blog-site

Install dependencies
npm install

Start the server
node server.js


Visit in browser

http://localhost:3000


Live Demo

https://blog-site-oh2j.onrender.com/


SQL code required

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255)
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  user_id INTEGER REFERENCES users(id)
);


Future Improvements

- Flash messages for login/register feedback
- User profile page
- Like and comment system
