// backend/src/utils/queue.js
import EventEmitter from 'events';

export class RequestQueue extends EventEmitter {
    constructor(maxParallel = 5) {
        super();
        this.queue = [];
        this.processing = 0;
        this.maxParallel = maxParallel;
        this.completedTasks = 0;
        this.successfulTasks = 0;
        this.taskHistory = [];
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    emitUpdate(taskId, status, data = null) {
        if (!this.io) return;

        const historyItem = {
            taskId,
            status,
            timestamp: new Date(),
            data: {
                result: {
                    token: status === 'completed' ? {
                        success: true,
                        message: data?.result?.gRecaptchaResponse ? 'ready' : 'failed',
                        gRecaptchaResponse: data?.result?.gRecaptchaResponse
                    } : status === 'failed' ? {
                        success: false,
                        message: this.getMessageFromStatus(status),
                        error: data?.error
                    } : {
                        message: this.getMessageFromStatus(status)
                    },
                    queueLength: this.queue.length,
                    activeWorkers: this.processing,
                    startTime: data?.startTime,
                    endTime: ['completed', 'failed'].includes(status) ? new Date() : null,
                    duration: ['completed', 'failed'].includes(status) ? 
                        new Date().getTime() - new Date(data?.startTime).getTime() : null,
                }
            }
        };

        const taskIndex = this.taskHistory.findIndex(t => t.taskId === taskId);
        if (taskIndex === -1) {
            this.taskHistory.unshift(historyItem);
        } else {
            this.taskHistory[taskIndex] = historyItem;
        }

        this.io.emit('taskUpdate', { stats: this.getStats() });
    }

    getMessageFromStatus(status) {
        switch(status) {
            case 'completed': return 'ready';
            case 'failed': return 'failed';
            case 'processing': return 'processing';
            case 'queued': return 'queued';
            default: return status;
        }
    }

    async add(request, taskId) {
        return new Promise((resolve) => {
            const task = {
                id: taskId,
                request,
                resolve,
                startTime: new Date()
            };
            
            this.queue.push(task);
            this.emitUpdate(taskId, 'queued', { startTime: task.startTime });
            this.process();
        });
    }

    async process() {
        while (this.queue.length > 0 && this.processing < this.maxParallel) {
            this.processing++;
            const task = this.queue.shift();
            
            this.emitUpdate(task.id, 'processing', { startTime: task.startTime });
            
            try {
                const result = await task.request();
                this.completedTasks++;
                if (result.success) {
                    this.successfulTasks++;
                }
                
                this.emitUpdate(task.id, 'completed', { 
                    result,
                    startTime: task.startTime
                });
                
                task.resolve(result);
            } catch (error) {
                this.completedTasks++;
                
                this.emitUpdate(task.id, 'failed', { 
                    error: error.message,
                    startTime: task.startTime
                });
                
                task.resolve({ success: false, error: error.message });
            }
            
            this.processing--;
        }
    }

    getStats() {
        const successRate = this.completedTasks > 0 
            ? Math.round((this.successfulTasks / this.completedTasks) * 100)
            : 0;

        return {
            queueLength: this.queue.length,
            activeWorkers: this.processing,
            maxParallel: this.maxParallel,
            completedTasks: this.completedTasks,
            successRate,
            taskHistory: this.taskHistory
        };
    }

    clearHistory() {
        this.taskHistory = [];
        if (this.io) {
            this.io.emit('stats', this.getStats());
        }
    }
}
