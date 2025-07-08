import { lightdashApi } from '../api';

// Debug flag - set to true to see queue logging
const DEBUG_QUEUE = true;

interface QueuedApiCall<T> {
    id: string;
    execute: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: any) => void;
}

/**
 * Simple sequential queue for API calls that cause 503 errors
 * Processes requests one by one to prevent overwhelming the backend
 */
class ApiQueue {
    private queue: QueuedApiCall<any>[] = [];
    private processing = false;

    async addToQueue<T>(id: string, execute: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            // Don't replace existing requests - queue them all
            const queueItem: QueuedApiCall<T> = { id, execute, resolve, reject };
            this.queue.push(queueItem);

            if (DEBUG_QUEUE) console.log(`[Queue] Added item ${id}, queue length: ${this.queue.length}`);

            // Use setTimeout to avoid immediate processing conflicts
            setTimeout(() => this.processQueue(), 0);
        });
    }

    private async processQueue() {
        if (this.processing) {
            if (DEBUG_QUEUE) console.log('[Queue] Already processing, skipping');
            return;
        }
        
        if (this.queue.length === 0) {
            if (DEBUG_QUEUE) console.log('[Queue] Queue is empty');
            return;
        }

        if (DEBUG_QUEUE) console.log(`[Queue] Starting to process ${this.queue.length} items`);
        this.processing = true;

        try {
            while (this.queue.length > 0) {
                const item = this.queue.shift()!;
                if (DEBUG_QUEUE) console.log(`[Queue] Processing item ${item.id}`);
                
                try {
                    const result = await item.execute();
                    if (DEBUG_QUEUE) console.log(`[Queue] Item ${item.id} completed successfully`);
                    item.resolve(result);
                } catch (error) {
                    if (DEBUG_QUEUE) console.error(`[Queue] Item ${item.id} failed:`, error);
                    item.reject(error);
                }

                // Increase delay to give more breathing room
                if (this.queue.length > 0) {
                    if (DEBUG_QUEUE) console.log(`[Queue] Waiting 100ms before next item...`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        } finally {
            this.processing = false;
            if (DEBUG_QUEUE) console.log('[Queue] Processing completed');
        }
    }
}

// Global queue instance
const apiQueue = new ApiQueue();

// Type definition matching lightdashApi's interface
type LightdashApiConfig = 
    | { url: string; version?: 'v1' | 'v2'; method: 'GET' | 'DELETE'; body?: undefined; signal?: AbortSignal }
    | { url: string; version?: 'v1' | 'v2'; method: 'POST' | 'PUT' | 'PATCH'; body: string; signal?: AbortSignal };

/**
 * Queued version of lightdashApi that processes certain endpoints sequentially
 * to prevent 503 Service Unavailable errors
 */
export const queuedLightdashApi = async <T = any>(config: LightdashApiConfig): Promise<T> => {
    const { url } = config;
    
    // Check if this is one of the problematic endpoints that need queuing
    const needsQueuing = 
        url.includes('/query/dashboard-chart') || 
        url.match(/\/query\/[^/]+(\?|$)/);

    if (needsQueuing) {
        // Generate a unique ID for this request (more unique)
        const requestId = `${config.method}-${url.replace(/\?.*$/, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        if (DEBUG_QUEUE) console.log(`[QueuedAPI] Queuing request: ${requestId}`);
        return apiQueue.addToQueue<T>(requestId, () => {
            if (DEBUG_QUEUE) console.log(`[QueuedAPI] Executing request: ${requestId}`);
            return lightdashApi(config) as Promise<T>;
        });
    } else {
        // For non-problematic endpoints, use direct API call
        if (DEBUG_QUEUE) console.log(`[QueuedAPI] Direct call (not queued): ${config.method} ${url}`);
        return lightdashApi(config) as Promise<T>;
    }
}; 