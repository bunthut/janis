/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A simple promise group that collects unnamed promises and resolves them
 * sequentially. The resolved values are returned in the same order the
 * promises were added.
 */
export class PromiseGroup {
    private readonly promises: Promise<any>[] = [];

    public add(promise: Promise<any>): void {
        this.promises.push(promise);
    }

    public async all(): Promise<any[]> {
        return Promise.all(this.promises);
    }
}

/**
 * A group of named promises. Each promise is associated with a unique key and
 * the resolved values are returned as an object mapping keys to results.
 */
export class NamedPromiseGroup {
    private readonly promises: { [key: string]: Promise<any> } = {};

    public add(key: string, promise: Promise<any>): void {
        if (key in this.promises) {
            throw new Error(`key: ${key} already in use`);
        }

        this.promises[key] = promise;
    }

    public async all(): Promise<{ [key: string]: any }> {
        const entries = await Promise.all(
            Object.entries(this.promises).map(async ([key, value]) => [key, await value])
        );

        const result: { [key: string]: any } = {};
        for (const [key, value] of entries) {
            result[key] = value;
        }
        return result;
    }
}

