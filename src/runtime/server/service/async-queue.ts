type Task<T> = () => T | Promise<T>;

export class AsyncQueue {
    // [key, task]
    private queue: [string, Task<unknown>][];

    // if task processing in progress
    private workingOn: string | null;
    // if task processing or waiting for timeout after it
    private waitingOn: string | null;
    // if queue stopped manually
    private running: boolean;

    private maxLength: number;
    private timeoutMs: number;

    constructor(maxLength: number, timeoutMs: number) {
        this.queue = [];

        this.workingOn = null;
        this.waitingOn = null;
        this.running = true;

        this.maxLength = maxLength;
        this.timeoutMs = timeoutMs;
    }

    hasTaskInQueue(key: string) {
        return this.queue.some((item) => item[0] === key) || this.workingOn === key;
    }
    processingTask(key: string) {
        return this.workingOn === key;
    }

    stop() {
        this.running = false;
    }
    start() {
        this.running = true;
        this.tryRunTask();
    }
    isStopped() {
        return !this.running;
    }

    async tryRunTask() {
        if (this.workingOn !== null || this.waitingOn !== null || !this.running || this.queue.length === 0) {
            return;
        }

        const [key, task] = this.queue.shift()!;

        this.workingOn = key;
        this.waitingOn = key;

        try {
            await task();
        } finally {
            this.workingOn = null;
            setTimeout(() => {
                this.waitingOn = null;
                this.tryRunTask();
            }, this.timeoutMs);
        }
    }

    add(key: string, task: Task<unknown>, priority: 'high' | 'low' = 'low') {
        if (this.queue.length >= this.maxLength) {
            console.warn(`Queue is full, task ${key} not added`);
            return;
        }
        if (this.hasTaskInQueue(key)) {
            console.warn(`Task ${key} is already in queue`);
        }

        if (priority === 'high') {
            this.queue.unshift([key, task]);
        } else {
            this.queue.push([key, task]);
        }
        this.tryRunTask();
    }

    async clear() {
        this.queue.length = 0;
        while (this.workingOn !== null) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    length() {
        return this.queue.length + (this.workingOn ? 1 : 0);
    }
}
