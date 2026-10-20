const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const crypto = require('crypto')
const http = require('http')
const { Server } = require('socket.io');

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server, {
   cors: { origin: "http://localhost:5173" }
});

const redisPublisher = createClient({ url: 'redis://redis:6379' });
const redisSubscriber = createClient({ url: 'redis://redis:6379' });

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
    console.log('[Express] WSS user connected');
});

async function startApplication() {
    await redisPublisher.connect();
    await redisSubscriber.connect();
    console.log('[Express] Connected to redis brocker');
    await redisSubscriber.subscribe('result', (message) => {
        const data = JSON.parse(message);
        console.log(`[Express] Received result for task id ${data.id}`);
        io.emit('result', data);
    });

    server.listen(port, () => {
        console.log(`Express started on port ${port}`);
    });
}


app.post('/test', async (req, res) => {
    const { text, algorithm } = req.body;

    console.log(`[Express] Received request with text ${text} and algorihtm ${algorithm}`);

    const payload = {
        id: crypto.randomUUID(),
        text
    };

    if (!['java', 'csharp'].includes(algorithm)) {
        res.status(400).send();
        return;
    }
    
    if (algorithm === 'java') {
        await redisPublisher.publish('java', JSON.stringify(payload));
    } else if (algorithm === 'csharp') {
        await redisPublisher.publish('csharp', JSON.stringify(payload));
    }

    res.status(202).json({ id: payload.id });
});

startApplication();