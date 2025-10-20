import { useStorage } from 'nitropack/runtime';
import { CacheLock } from './cache-lock';
import { AsyncQueue } from './async-queue';
import { ImageFetcher, type ImageData } from './image-fetcher';
import { ImageOptimizer, type ImageSettings } from './image-optimizer';

type Config = {
    maxCacheSize: number;
    autoRefreshInterval: number;
    mainQueueSize: number;
    mainQueueTimeout: number;
    backgroundQueueSize: number;
    backgroundQueueTimeout: number;
    cpuEffort: number;
    sizeCacheMaxCount: number;
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

    private config: Config;

    // task for fetching new images, high prior
    private mainTasksQueue: AsyncQueue;
    // task for updating existing images in background, low prior
    private backgroundTasksQueue: AsyncQueue;

    private cacheDataStorage = useStorage<Buffer>('cached-image-optimizer__cache');
    private cacheIndex = new Map<string, CacheIndexItem>();
    private cacheSize = 0;

    // cache for image sizes, key is url
    private sizeCache = new Map<string, [number, number]>();

    private imgFetcher = new ImageFetcher();
    private imgOptimizer = new ImageOptimizer();

    private maintenanceInterval = setInterval(() => this.maintenance(), 1000);

    constructor(config: Config) {
        this.config = config;

        this.mainTasksQueue = new AsyncQueue(config.mainQueueSize, config.mainQueueTimeout);
        this.backgroundTasksQueue = new AsyncQueue(config.backgroundQueueSize, config.backgroundQueueTimeout);
    }

    async init() {
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
            if (time - v.lastUpdated > this.config.autoRefreshInterval && !this.backgroundTasksQueue.hasTaskInQueue(k)) {
                this.backgroundTasksQueue.add(k, async () => {
                    const image = await this.imgFetcher.fetchImage(v.original.url);

                    this.setSizeCache(v.original.url, image);

                    if (v.original.hash !== image.hash) {
                        const optimized = await this.imgOptimizer.optimizeImage(image, v.settings, this.config.cpuEffort);
                        await this.lock.withKeyLocked(k, () => this.updateImageInCache(k, image, optimized.data));
                    }
                });
            }

            v.agingCounter *= 0.85;
        }

        if (this.mainTasksQueue.length()) {
            this.backgroundTasksQueue.stop();
        } else {
            this.backgroundTasksQueue.start();
        }
    }

    private getKey(url: string, settings: ImageSettings) {
        return `${url.replaceAll(/[:/?#%[\]]/g, '_')}-${settings.quality}-${settings.width}-${settings.height}.${settings.format}`;
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
            if (v.agingCounter < worstAging) {
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
        if (size > this.config.maxCacheSize) {
            console.warn(`Image is too large to fit in cache ${size} > ${this.config.maxCacheSize}, ${key}`);
            return;
        }

        while (this.cacheSize + size > this.config.maxCacheSize) {
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

        if (optimizedData.byteLength > this.config.maxCacheSize) {
            console.warn(`Image is too large to fit in cache ${optimizedData.byteLength} > ${this.config.maxCacheSize}, ${key}`);
            return;
        }

        while (this.cacheSize - index.dataSize + optimizedData.byteLength > this.config.maxCacheSize) {
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

    private setSizeCache(url: string, image: ImageData) {
        this.sizeCache.set(url, [image.width, image.height]);

        if (this.sizeCache.size >= this.config.sizeCacheMaxCount) {
            this.sizeCache.delete(this.sizeCache.keys().next().value!);
        }
    }

    async getImage(url: string, settings: ImageSettings) {
        const key = this.getKey(url, settings);

        // lock to prevent item deletion while reading
        const cachedData = await this.lock.withKeyLocked(key, () => this.getImageFromCache(key));
        if (cachedData) {
            return cachedData;
        }

        if (!this.mainTasksQueue.hasTaskInQueue(key)) {
            this.mainTasksQueue.add(key, async () => {
                const image = await this.imgFetcher.fetchImage(url);

                this.setSizeCache(url, image);

                const optimized = await this.imgOptimizer.optimizeImage(image, settings, this.config.cpuEffort);
                await this.lock.withKeyLocked(key, () => this.addImageToCache(key, settings, image, optimized.data));
            });
        }

        // return original image if its not converted yet
        const originalImage = await this.imgFetcher.fetchImage(url);
        this.setSizeCache(url, originalImage);
        return originalImage.data;
    }

    async getImageSize(url: string) {
        const size = this.sizeCache.get(url);
        if (size) {
            return {
                w: size[0],
                h: size[1],
            };
        }

        const image = await this.imgFetcher.fetchImage(url);
        this.setSizeCache(url, image);
        return {
            w: image.width,
            h: image.height,
        };
    }

    getDebugInfo() {
        return {
            config: this.config,
            cacheSize: this.cacheSize,
            sizeCacheCount: this.sizeCache.size,
            cachedItems: this.cacheIndex.size,
            computedCacheSize: Array.from(this.cacheIndex.values()).reduce((acc, item) => acc + item.dataSize, 0),
            mainTasksQueue: this.mainTasksQueue.getDebugInfo(),
            backgroundTasksQueue: this.backgroundTasksQueue.getDebugInfo(),
            imgFetcher: this.imgFetcher.getDebugInfo(),
        };
    }
}
