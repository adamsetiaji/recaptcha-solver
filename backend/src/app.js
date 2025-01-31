import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { RequestQueue } from './utils/queue.js';
import { RecaptchaSolver } from './services/recaptchaSolver.js';

const app = express();
const httpServer = createServer(app);

// Task storage
const taskStore = new Map();

const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

const queue = new RequestQueue(5);
queue.setSocketIO(io);

// Store task status
const updateTaskStatus = (taskId, status, data = null) => {
    if (!taskStore.has(taskId)) {
        taskStore.set(taskId, {
            status,
            created: new Date(),
            updated: new Date(),
            data
        });
    } else {
        const task = taskStore.get(taskId);
        taskStore.set(taskId, {
            ...task,
            status,
            updated: new Date(),
            ...(data && { data })
        });
    }
};

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Send initial stats
    socket.emit('stats', queue.getStats());
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    // Listen for new task requests
    socket.on('createTask', async () => {
        try {
            const taskId = uuidv4();
            const solver = new RecaptchaSolver();
            
            updateTaskStatus(taskId, 'processing');
            
            queue.add(async () => {
                const result = await solver.solve();
                updateTaskStatus(taskId, result.success ? 'ready' : 'failed', result);
                return result;
            }, taskId);
            
            socket.emit('taskCreated', { success: true, taskId });
        } catch (error) {
            socket.emit('taskError', { success: false, error: error.message });
        }
    });
});

// Validate API Key middleware
const validateApiKey = (req, res, next) => {
    const { clientKey } = req.body;
    
    const validApiKeys = ['123456789']; // Replace with your actual API keys
    
    if (!clientKey || !validApiKeys.includes(clientKey)) {
        return res.status(401).json({
            success: 0,
            message: "Invalid API key"
        });
    }
    
    next();
};

// REST API endpoints
app.post('/api/createTask', validateApiKey, async (req, res) => {
    try {
        const taskId = uuidv4();
        const solver = new RecaptchaSolver();
        
        updateTaskStatus(taskId, 'processing');
        
        queue.add(async () => {
            const result = await solver.solve();
            updateTaskStatus(taskId, result.success ? 'ready' : 'failed', result);
            return result;
        }, taskId);
        
        res.json({
            success: 1,
            taskId
        });
    } catch (error) {
        res.status(500).json({
            success: 0,
            message: error.message
        });
    }
});

app.post('/api/getTaskResult', validateApiKey, async (req, res) => {
    try {
        const { taskId } = req.body;
        
        if (!taskId) {
            return res.status(400).json({
                success: 0,
                message: "taskId is required"
            });
        }

        const task = taskStore.get(taskId);
        
        if (!task) {
            return res.status(404).json({
                success: 0,
                message: "Task not found"
            });
        }

        // Clean up old tasks
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (task.created < oneHourAgo) {
            taskStore.delete(taskId);
            return res.status(404).json({
                success: 0,
                message: "Task expired"
            });
        }

        // Return result based on status
        switch (task.status) {
            case "processing":
                return res.json({
                    success: 1,
                    message: "processing"
                });
            
            case "ready":
                return res.json({
                    success: 1,
                    message: "ready",
                    solution: {
                        gRecaptchaResponse: task.data.gRecaptchaResponse
                    }
                });
            
            case "failed":
                return res.json({
                    success: 0,
                    message: "failed",
                    error: task.data.error
                });
            
            default:
                return res.status(500).json({
                    success: 0,
                    message: "Unknown task status"
                });
        }

    } catch (error) {
        res.status(500).json({
            success: 0,
            message: error.message
        });
    }
});

app.get('/api/stats', (req, res) => {
    res.json(queue.getStats());
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        stats: queue.getStats(),
        taskCount: taskStore.size
    });
});

// Task cleanup scheduler
setInterval(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleanedCount = 0;
    
    for (const [taskId, task] of taskStore.entries()) {
        if (task.created < oneHourAgo) {
            taskStore.delete(taskId);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired tasks`);
    }
}, 15 * 60 * 1000); // Run every 15 minutes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: 0,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Graceful shutdown handling
const shutdown = async () => {
    console.log('Shutting down gracefully...');
    
    httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at: http://0.0.0.0:${PORT}/health`);
});