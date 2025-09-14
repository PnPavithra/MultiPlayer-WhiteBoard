# Multiplayer Whiteboard  

A collaborative real-time whiteboard where multiple users can draw, erase, and interact in shared rooms. Built with **Node.js**, **Express**, **Socket.IO**, and **MongoDB**, deployed on **Railway**.  

---

## Features  
- Real-time drawing with multiple users  
- Create & join rooms for private boards  
- Undo/redo strokes (per-user, isolated from others)  
- Responsive design with smooth drawing experience  
- MongoDB for persistent room/session management  
- Option to save drawings before room close  
- Deployed on [Railway](https://railway.app) 
- Load-tested with **Artillery** to simulate thousands of users 

---

## Tech Stack  
- **Frontend:** HTML, CSS, JavaScript (Canvas API)  
- **Backend:** Node.js, Express  
- **Realtime:** Socket.IO  
- **Database:** MongoDB (Atlas)  
- **Deployment:** Railway  

---

## Installation  

### Prerequisites  
- Node.js (v16+)  
- npm or yarn  
- MongoDB Atlas connection string  

### Setup  
```bash
git clone https://github.com/your-username/multiplayer-whiteboard.git
cd multiplayer-whiteboard
npm install

echo "MONGO_URI=your-mongo-uri" >> .env
echo "PORT=3000" >> .env

npm start