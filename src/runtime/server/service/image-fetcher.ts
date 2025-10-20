import sharp from 'sharp';
import crypto from 'node:crypto';
import { useStorage } from 'nitropack/runtime';
import { CacheLock } from './cache-lock';

export type ImageData = {
    url: string;
    width: number;
    height: number;
    hash: string;
    data: Buffer;
};

export class ImageFetcher {
    private cacheLock = new CacheLock();
    private fetchCache = new Map<string, ImageData>();
    private localStorage = useStorage('cached-image-optimizer__local');

    private addImageToCache(url: string, data: ImageData) {
        this.fetchCache.set(url, data);
        setTimeout(() => this.fetchCache.delete(url), 1000 * 5);
    }

    private fetchRawData(url: string) {
        if (url.startsWith('/')) {
            return this.localStorage.getItemRaw<Buffer>(url.slice(1).replaceAll('/', ':'));
        } else {
            return $fetch<ArrayBuffer>(url, { responseType: 'arrayBuffer' }).then((res) => Buffer.from(res));
        }
    }

    private async getOrCacheImage(url: string) {
        const cachedImage = this.fetchCache.get(url);
        if (cachedImage) {
            return cachedImage;
        }

        const buffer = await this.fetchRawData(url);
        if (!buffer) {
            throw new Error('Cannot find image at url: ' + url);
        }
        if (buffer.byteLength === 0) {
            throw new Error('Invalid image at url: ' + url);
        }

        const { width, height } = await sharp(buffer).metadata();
        if (!width || !height) {
            throw new Error('Invalid image at url: ' + url);
        }

        const image = {
            url,
            width,
            height,
            data: buffer,
            hash: crypto.createHash('sha1').update(buffer).digest('hex'),
        };

        this.addImageToCache(url, image);
        return image;
    }

    fetchImage(url: string) {
        return this.cacheLock.withKeyLocked(url, () => this.getOrCacheImage(url));
    }

    getDebugInfo() {
        return {
            fetchCacheItems: this.fetchCache.size,
            fetchCacheSize: Array.from(this.fetchCache.values()).reduce((acc, item) => acc + item.data.byteLength, 0),
        };
    }
}
