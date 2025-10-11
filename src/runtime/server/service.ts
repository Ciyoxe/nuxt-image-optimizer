import { useStorage } from 'nitropack/runtime';
import { CacheLock } from './cache-lock';
import { AsyncQueue } from './async-queue';
import { ImageOptimizer, type ImageSettings } from './image-optimizer';
import { ImageFetcher } from './image-fetcher';
import type { ImageData } from './image-fetcher';

type Config = {
    maxSize: number;
    autoUpdateTimeout: number;
};

type CacheIndexItem = {
    key: string;
    settings: ImageSettings;
    original: {
        url: string;
        hash: string;
        width: number;
        height: number;
    };

    dataSize: number;
    lastUpdated: number;
    agingCounter: number;
};

export class Service {
    private lock = new CacheLock();

    // task for fetching new images, high prior
    private mainTasksQueue = new AsyncQueue(1000, 5000);
    // task for updating existing images in background, low prior
    private backgroundTasksQueue = new AsyncQueue(1000, 5000);

    private cacheDataStorage = useStorage<Buffer>('cached-image-optimizer:cache');
    private cacheIndex = new Map<string, CacheIndexItem>();
    private cacheSize = 0;

    private config: Config;

    private imgFetcher = new ImageFetcher();
    private imgOptimizer = new ImageOptimizer();

    private maintenanceInterval = setInterval(() => this.maintenance(), 1000);

    constructor(config: Config) {
        this.config = config;
    }

    async make() {
        await this.lock.withGlobalLock(async () => {
            await this.cacheDataStorage.clear();
            this.cacheIndex.clear();
        });
        return this;
    }

    async destroy() {
        await this.lock.withGlobalLock(async () => {
            await this.cacheDataStorage.clear();
            await this.mainTasksQueue.clear();
            await this.backgroundTasksQueue.clear();

            this.cacheIndex.clear();
            clearInterval(this.maintenanceInterval);
        });
    }

    private maintenance() {
        const time = Date.now();

        for (const [k, v] of this.cacheIndex.entries()) {
            if (time - v.lastUpdated > this.config.autoUpdateTimeout && !this.backgroundTasksQueue.hasTaskInQueue(k)) {
                this.backgroundTasksQueue.add(k, async () => {
                    const image = await this.imgFetcher.fetchImage(v.original.url);
                    const optimized = await this.imgOptimizer.optimizeImage(image, v.settings);
                    await this.lock.withKeyLocked(k, () => this.updateImageInCache(k, image, optimized.data));
                });
            }
        }

        if (this.mainTasksQueue.length()) {
            this.backgroundTasksQueue.stop();
        } else {
            this.backgroundTasksQueue.start();
        }

        for (const v of this.cacheIndex.values()) {
            v.agingCounter *= 0.85;
        }
    }

    private getKey(url: string, settings: ImageSettings) {
        return `${url}-${settings.format}-${settings.quality}-${settings.maxWidth}-${settings.maxHeight}`;
    }

    private async removeImageFromCache(key: string) {
        const index = this.cacheIndex.get(key);
        if (index) {
            this.cacheIndex.delete(key);
            this.cacheSize -= index.dataSize;
            await this.cacheDataStorage.removeItem(key);

            if (this.cacheSize < 0) {
                throw new Error(`Cache size is negative, deleted ${index.dataSize} bytes, ${key}`);
            }
        }
    }

    private async freeOneCachedItem() {
        let worstAging = Infinity;
        let worstKey = '';

        for (const [k, v] of this.cacheIndex.entries()) {
            if (v.agingCounter <= worstAging) {
                worstAging = v.agingCounter;
                worstKey = k;
            }
        }

        if (worstKey) {
            await this.removeImageFromCache(worstKey);
        }
    }

    private async addImageToCache(key: string, settings: ImageSettings, original: ImageData, optimizedData: Buffer) {
        const size = optimizedData.byteLength;
        if (size > this.config.maxSize) {
            console.warn(`Image is too large to fit in cache ${size} > ${this.config.maxSize}, ${key}`);
            return;
        }

        while (this.cacheSize + size > this.config.maxSize) {
            await this.freeOneCachedItem();
        }

        this.cacheSize += size;
        this.cacheIndex.set(key, {
            key,
            dataSize: size,
            agingCounter: 2000,
            original: {
                url: original.url,
                hash: original.hash,
                width: original.width,
                height: original.height,
            },
            settings,
            lastUpdated: Date.now(),
        });

        await this.cacheDataStorage.setItemRaw(key, optimizedData);
    }

    private async updateImageInCache(key: string, original: ImageData, optimizedData: Buffer) {
        const index = this.cacheIndex.get(key);
        if (!index) {
            throw new Error(`Cannot update image that is not in cache, ${key}`);
        }

        if (optimizedData.byteLength > this.config.maxSize) {
            console.warn(`Image is too large to fit in cache ${optimizedData.byteLength} > ${this.config.maxSize}, ${key}`);
            return;
        }

        while (this.cacheSize - index.dataSize + optimizedData.byteLength > this.config.maxSize) {
            await this.freeOneCachedItem();
        }

        this.cacheSize += optimizedData.byteLength - index.dataSize;

        index.lastUpdated = Date.now();
        index.dataSize = optimizedData.byteLength;
        index.original = {
            url: original.url,
            hash: original.hash,
            width: original.width,
            height: original.height,
        };
        await this.cacheDataStorage.setItemRaw(key, optimizedData);
    }

    private async getImageFromCache(key: string) {
        const index = this.cacheIndex.get(key);
        if (index) {
            index.agingCounter += 100;
            const buffer = await this.cacheDataStorage.getItemRaw<Buffer>(key);

            if (!buffer) throw new Error(`Image not found in cache, but found in index, ${key}`);
            return buffer;
        }
    }

    async getImage(url: string, settings: ImageSettings) {
        const key = this.getKey(url, settings);

        // lock to prevent item deletion while reading
        const cachedData = await this.lock.withKeyLocked(key, () => this.getImageFromCache(key));
        if (cachedData) {
            return cachedData;
        }

        const image = await this.imgFetcher.fetchImage(url);

        if (!this.mainTasksQueue.hasTaskInQueue(key)) {
            this.mainTasksQueue.add(key, async () => {
                const optimized = await this.imgOptimizer.optimizeImage(image, settings);
                await this.lock.withKeyLocked(key, () => this.addImageToCache(key, settings, image, optimized.data));
            });
        }

        // return original image if its not converted yet
        return image.data;
    }
}
