import express from 'express';
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from 'mongoose';
import cors from 'cors';
import { connectToSocket } from './controllers/socketManger.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 3000));
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));
app.use("/api/v1/user", userRoutes);

app.get('/home', (req, res) => {
    return res.json({ "hello": "world" })
});

const start = async () => {
    try {
        const connection = await mongoose.connect("");
        console.log("MONGO Connected to Cloud");
    } catch (e) {
        console.log("Could not connect to Cloud DB, trying local...");
        try {
            await mongoose.connect("mongodb://127.0.0.1:27017/video-conferencing");
            console.log("MONGO Connected to Localhost");
        } catch (e) {
            console.error("Could not connect to any DB", e);
        }
    }
    server.listen(app.get("port"), () => {
        console.log("Server is running on port 3000");
    })
}

start();
