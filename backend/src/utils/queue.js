export class RequestQueue {
    constructor(maxParallel = 5) {
        this.queue = [];
        this.processing = 0;
        this.maxParallel = maxParallel;
        this.completedTasks = 0;
        this.successfulTasks = 0;
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    emitUpdate(taskId, status, data = null) {
        if (this.io) {
            this.io.emit('taskUpdate', {
                taskId,
                status,
                ...data && { data },
                stats: this.getStats()
            });
        }
    }

    async add(request, taskId) {
        return new Promise((resolve) => {
            this.queue.push({ request, resolve, taskId });
            this.emitUpdate(taskId, 'queued', { position: this.queue.length });
            this.process();
        });
    }

    async process() {
        while (this.queue.length > 0 && this.processing < this.maxParallel) {
            this.processing++;
            const { request, resolve, taskId } = this.queue.shift();
            
            this.emitUpdate(taskId, 'processing', {
                queueLength: this.queue.length,
                activeWorkers: this.processing
            });
            
            try {
                const result = await request();
                this.completedTasks++;
                if (result.success) {
                    this.successfulTasks++;
                }
                resolve(result);
                this.emitUpdate(taskId, 'completed', { result });
            } catch (error) {
                this.completedTasks++;
                resolve({ success: false, error: error.message });
                this.emitUpdate(taskId, 'failed', { error: error.message });
            }
            
            this.processing--;
            this.emitUpdate(null, 'stats', this.getStats());
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
            successRate
        };
    }
}