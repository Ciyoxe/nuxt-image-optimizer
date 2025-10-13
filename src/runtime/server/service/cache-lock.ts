type MaybePromise<T> = T | Promise<T>;

export class CacheLock {
    private globalLock = false;
    private lockedKeys = new Set<string>();

    isKeyAvailable(key: string) {
        return !this.lockedKeys.has(key) && !this.globalLock;
    }

    async waitForKeyLock(key: string) {
        while (this.lockedKeys.has(key) || this.globalLock) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    async waitForGlobalLock() {
        while (this.globalLock || this.lockedKeys.size > 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    async withKeyLocked<T extends MaybePromise<unknown>>(key: string, callback: () => T): Promise<Awaited<T>> {
        await this.waitForKeyLock(key);
        try {
            this.lockedKeys.add(key);
            return await callback();
        } finally {
            this.lockedKeys.delete(key);
        }
    }

    async withGlobalLock<T extends MaybePromise<unknown>>(callback: () => T): Promise<Awaited<T>> {
        await this.waitForGlobalLock();
        try {
            this.globalLock = true;
            return await callback();
        } finally {
            this.globalLock = false;
        }
    }
}
