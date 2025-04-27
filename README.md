# TweetTube 📺🐦

TweetTube is a social media platform that combines the best features of **YouTube** and **Twitter**.  
Users can **register**, **subscribe** to other users, **post videos**, **comment** on videos, **like** videos and comments, **post tweets**, and **like** tweets — all in one place!

---

## ✨ Features

- 📝 User Registration & Authentication
- 🎥 Upload and Post Videos
- 💬 Comment on Videos
- ❤️ Like Videos and Comments
- 🐦 Post Tweets
- 👍 Like Tweets
- 👥 Subscribe to Other Users
- 🔥 Real-time Content Updates (if using sockets)
- 🔐 Secure Password Handling (bcrypt / JWT)

---

## 📂 Project Structure

```bash
TweetTube/
├── src/
│   ├── controllers/    # Business logic (videos, tweets, auth, etc.)
│   ├── models/         # Mongoose models (User, Video, Tweet, Comment)
│   ├── routes/         # API endpoints
│   ├── middlewares/    # Authentication, error handling
│   ├── db/             # Database connection
│   ├── utils/          # Helper functions
│   └── index.js        # Server entry point
├── .env.example        # Environment variables sample
├── package.json        # Node dependencies and scripts
└── README.md           # Project documentation
```

---

##🛠 Tech Stack

- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose ODM)
- Authentication: JWT, bcrypt
- Other Libraries: dotenv, nodemon, multer (for video uploads), etc.

---


## 📜 Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/tweettube-backend.git
cd tweettube-backend
```
2.Install dependencies
  npm install

3.Setup Environment Variables
Create a .env file in the root directory. Here's a sample:
  PORT=8000
  MONGODB_URI=
  CORS_ORIGIN=*
  ACCESS_TOKEN_SECRET=
  ACCESS_TOKEN_EXPIRY=
  REFRESH_TOKEN_SECRET=
  REFRESH_TOKEN_EXPIRY=
  
  CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=

4.Run the server
  npm run dev
Server will start at http://localhost:8000/ (or your configured port).

##📬 API Endpoints Overview

# 🐦🎥 TweetTube Backend

## 📬 API Routes Overview

| **Module**       | **Method** | **Endpoint**                                | **Description**                  |
|:-----------------|:-----------|:--------------------------------------------|:----------------------------------|
| **Auth**          | POST       | `/api/auth/login`                           | Login user                        |
|                  | POST       | `/api/auth/logout`                          | Logout user                       |
|                  | POST       | `/api/auth/refresh-token`                   | Refresh access token              |
|                  | POST       | `/api/auth/change-password`                 | Change current password           |
|                  | GET        | `/api/auth/current-user`                    | Get current logged-in user        |
|                  | PATCH      | `/api/auth/update-account`                  | Update account details            |
|                  | PATCH      | `/api/auth/avatar`                          | Upload/Update user avatar         |
|                  | PATCH      | `/api/auth/cover-image`                     | Upload/Update user cover image    |
|                  | GET        | `/api/auth/c/:username`                     | Get user channel profile          |
|                  | GET        | `/api/auth/history`                         | Get watch history                 |
| **Video**         | GET        | `/api/videos/:videoId`                      | Get video details                 |
|                  | PATCH      | `/api/videos/:videoId`                      | Update video (and thumbnail)      |
|                  | DELETE     | `/api/videos/:videoId`                      | Delete video                      |
|                  | PATCH      | `/api/videos/toggle/publish/:videoId`        | Toggle video publish status       |
| **Tweet**         | GET        | `/api/tweets/user/:userId`                  | Get tweets by user                |
|                  | PATCH      | `/api/tweets/:tweetId`                      | Update a tweet                    |
|                  | DELETE     | `/api/tweets/:tweetId`                      | Delete a tweet                    |
| **Subscription**  | GET        | `/api/subscriptions/c/:channelId`           | Get channels subscribed           |
|                  | POST       | `/api/subscriptions/c/:channelId`           | Subscribe/Unsubscribe a channel   |
|                  | GET        | `/api/subscriptions/u/:subscriberId`        | Get subscribers of a channel      |
| **Playlist**     | GET       | `/api/playlists/:playlistId`                  | Get playlist details              |
|                  | PATCH      | `/api/playlists/:playlistId`                | Update playlist                   |
|                  | DELETE     | `/api/playlists/:playlistId`                | Delete playlist                   |
|                  | PATCH      | `/api/playlists/add/:videoId/:playlistId`    | Add video to playlist             |
|                  | PATCH      | `/api/playlists/remove/:videoId/:playlistId` | Remove video from playlist        |
|                  | GET        | `/api/playlists/user/:userId`               | Get all playlists of a user       |
| **Like**          | POST       | `/api/likes/toggle/v/:videoId`              | Like/Unlike a video              |
|                  | POST       | `/api/likes/toggle/c/:commentId`            | Like/Unlike a comment             |
|                  | POST       | `/api/likes/toggle/t/:tweetId`              | Like/Unlike a tweet               |
|                  | GET        | `/api/likes/videos`                         | Get all liked videos              |
| **Dashboard**     | GET        | `/api/dashboard/stats`                     | Get channel stats                 |
|                  | GET        | `/api/dashboard/videos`                     | Get all channel videos            |
| **Comment**       | GET        | `/api/comments/:videoId`                   | Get comments for a video          |
|                  | POST       | `/api/comments/:videoId`                    | Add a comment                     |
|                  | PATCH      | `/api/comments/c/:commentId`                | Update a comment                  |
|                  | DELETE     | `/api/comments/c/:commentId`                | Delete a comment                  |


##🛠️ License
This project is licensed under the MIT License.

##🌟 Thank You for Visiting TweetTube Backend!

---

✅ Clean, professional, backend-only focused, and everything properly organized for GitHub.  
✅ You can just copy-paste it into your `README.md` file directly.

---

Would you also want me to give you a **cool logo/banner image** for TweetTube you can add at the top of the README? 🚀 (makes it even more attractive!)  
I can generate one for you quickly if you want! 🎨
