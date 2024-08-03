import express, { Application } from 'express';
import http from 'http';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import routes from './routers/index';
import { AuthMiddleware } from './middlewares/middleware';
import { MessageType } from './types/types';
const cors = require('cors');

dotenv.config();

const app: Application = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(AuthMiddleware);

app.use('/api/v1', routes);

wss.on('connection', (ws) => {
    console.log('Client connected via WebSocket');

    ws.on('message', (message) => {
        console.log('Received:', message);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

export const broadcastMessage = (message: MessageType) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
    console.log('Broadcasting message:', message);
};

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
