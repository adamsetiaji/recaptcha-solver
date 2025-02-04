// backend/src/app.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { RequestQueue } from './utils/queue.js';
import { RecaptchaSolver } from './services/recaptchaSolver.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const BACKEND_PORT = process.env.BACKEND_PORT || 3000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 5173;
const NODE_ENV = process.env.NODE_ENV || 'development';

const allowedOrigins = NODE_ENV === 'production' 
    ? [`http://recaptcha-solver-frontend:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`]
    : [`http://localhost:${FRONTEND_PORT}`, `http://127.0.0.1:${FRONTEND_PORT}`];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

const queue = new RequestQueue(5);
queue.setSocketIO(io);

const validateApiKey = (req, res, next) => {
    const { clientKey } = req.body;
    if (!clientKey || clientKey !== '123456789') {
        return res.status(401).json({ success: false, message: "Invalid API key" });
    }
    next();
};

io.on('connection', (socket) => {
    console.log('Client connected');
    socket.emit('stats', queue.getStats());
    
    socket.on('createTask', async () => {
        try {
            const taskId = uuidv4();
            queue.add(async () => {
                const solver = new RecaptchaSolver();
                return await solver.solve();
            }, taskId);
            
            socket.emit('taskCreated', { 
                success: true, 
                taskId,
                timestamp: new Date()
            });
        } catch (error) {
            socket.emit('taskError', { 
                success: false, 
                error: error.message,
                timestamp: new Date()
            });
        }
    });
});

app.post('/api/createTask', validateApiKey, async (req, res) => {
    try {
        const taskId = uuidv4();
        queue.add(async () => {
            const solver = new RecaptchaSolver();
            return await solver.solve();
        }, taskId);
        
        res.json({
            success: true,
            taskId,
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            timestamp: new Date()
        });
    }
});

app.post('/api/getTaskResult', validateApiKey, async (req, res) => {
    try {
        const { taskId } = req.body;
        if (!taskId) {
            return res.status(400).json({ success: false, message: "taskId required" });
        }

        const stats = queue.getStats();
        const task = stats.taskHistory.find(t => t.taskId === taskId);
        
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        const { status, data } = task;
        
        res.json({
            success: data.result.token.success,
            message: data.result.token.message,
            status,
            ...(data.result.token.gRecaptchaResponse && {
                solution: { gRecaptchaResponse: data.result.token.gRecaptchaResponse }
            }),
            ...(data.result.token.error && { error: data.result.token.error }),
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        stats: queue.getStats(),
        timestamp: new Date()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        stats: queue.getStats(),
        timestamp: new Date()
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: NODE_ENV === 'development' ? err.message : undefined,
        timestamp: new Date()
    });
});

const shutdown = () => {
    console.log('Shutting down gracefully...');
    httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

httpServer.listen(BACKEND_PORT, '0.0.0.0', () => {
    console.log(`Server running in ${NODE_ENV} mode on port ${BACKEND_PORT}`);
});