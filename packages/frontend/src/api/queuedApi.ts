import { lightdashApi } from '../api';

// Debug flag - set to true to see queue logging
const DEBUG_QUEUE = true;

interface QueuedApiCall<T> {
    id: string;
    execute: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: any) => void;
    timestamp: number;
}

/**
 * Enhanced sequential queue for API calls that cause 503 errors
 * Processes requests one by one to prevent overwhelming the backend
 * Improved to handle page reload scenarios with better synchronization
 */
class ApiQueue {
    private queue: QueuedApiCall<any>[] = [];
    private processing = false;
    private processingPromise: Promise<void> | null = null;
    private totalProcessed = 0;
    private totalErrors = 0;

    async addToQueue<T>(id: string, execute: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const queueItem: QueuedApiCall<T> = { 
                id, 
                execute, 
                resolve, 
                reject,
                timestamp: Date.now()
            };
            this.queue.push(queueItem);

            if (DEBUG_QUEUE) console.log(`[Queue] Added item ${id}, queue length: ${this.queue.length}`);

            // Start processing with proper synchronization
            this.scheduleProcessing();
        });
    }

    private scheduleProcessing() {
        // If we're already processing, don't start another process
        if (this.processingPromise) {
            if (DEBUG_QUEUE) console.log('[Queue] Processing already scheduled');
            return;
        }

        // Use a longer delay during initialization to prevent overwhelming
        const delay = this.queue.length > 3 ? 200 : 150; // Longer delay for larger queues
        
        this.processingPromise = new Promise(resolve => {
            setTimeout(() => {
                this.processQueue().finally(() => {
                    this.processingPromise = null;
                    resolve();
                    
                    // If more items were added while processing, schedule another round
                    if (this.queue.length > 0 && !this.processing) {
                        if (DEBUG_QUEUE) console.log('[Queue] More items added, scheduling next round');
                        this.scheduleProcessing();
                    }
                });
            }, delay);
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
                const queueTime = Date.now() - item.timestamp;
                
                if (DEBUG_QUEUE) console.log(`[Queue] Processing item ${item.id} (queued for ${queueTime}ms)`);
                
                try {
                    const result = await item.execute();
                    if (DEBUG_QUEUE) console.log(`[Queue] Item ${item.id} completed successfully`);
                    item.resolve(result);
                    this.totalProcessed++;
                } catch (error) {
                    if (DEBUG_QUEUE) console.error(`[Queue] Item ${item.id} failed:`, error);
                    item.reject(error);
                    this.totalErrors++;
                }

                // Longer delay between requests, especially for dashboard chart queries
                if (this.queue.length > 0) {
                    const nextDelay = item.id.includes('dashboard-chart') ? 250 : 150;
                    if (DEBUG_QUEUE) console.log(`[Queue] Waiting ${nextDelay}ms before next item...`);
                    await new Promise(resolve => setTimeout(resolve, nextDelay));
                }
            }
        } finally {
            this.processing = false;
            if (DEBUG_QUEUE) console.log('[Queue] Processing completed');
        }
    }

    // Method to check queue status for debugging
    getQueueStatus() {
        return {
            queueLength: this.queue.length,
            processing: this.processing,
            hasProcessingPromise: !!this.processingPromise,
            totalProcessed: this.totalProcessed,
            totalErrors: this.totalErrors
        };
    }

    // Reset counters for testing
    resetStats() {
        this.totalProcessed = 0;
        this.totalErrors = 0;
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
        // Match /projects/{uuid}/query/{uuid} pattern (query results endpoints)
        /\/projects\/[^/]+\/query\/[0-9a-f-]{36}(\?|$)/.test(url) ||
        // Fallback: any /query/ endpoint followed by a UUID-like string
        /\/query\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\?|$)/.test(url) ||
        // Include /saved/ endpoints that get chart data
        /\/saved\/[0-9a-f-]{36}(\?|$|\/views$|\/calculate-total$)/.test(url);

    if (needsQueuing) {
        // Generate a more unique ID for this request
        const requestId = `${config.method}-${url.replace(/\?.*$/, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        if (DEBUG_QUEUE) {
            console.log(`[QueuedAPI] Queuing request: ${requestId}`);
            console.log(`[QueuedAPI] URL matched for queuing: ${url}`);
            console.log(`[QueuedAPI] Queue status:`, apiQueue.getQueueStatus());
        }
        
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

// Export queue instance for debugging if needed
export const debugQueue = DEBUG_QUEUE ? apiQueue : null;

// Make queue status available globally for debugging
if (typeof window !== 'undefined' && DEBUG_QUEUE) {
    (window as any).lightdashApiQueue = {
        getStatus: () => apiQueue.getQueueStatus(),
        resetStats: () => apiQueue.resetStats()
    };
} 