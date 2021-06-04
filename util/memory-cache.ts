export class MemoryCache<T>{
    private cacheData: {
        [key: string]: {
            timestamp: number,
            data: T
        }
    } = {}

    constructor(private options: {
        duration: number,
        generator?: (key: string) => Promise<T>
        multipleGenerator?: (key: Array<string>) => Promise<Array<T>>
    }) {

    }


    cleanup() {
        for (let key in this.cacheData) {
            if (this.cacheData[key].timestamp < (Date.now() - this.options.duration)) {
                delete this.cacheData[key]
            }
        }
    }

    async get(key: string) {
        this.cleanup();

        if (!this.cacheData[key]) {
            this.cacheData[key] = {
                timestamp: Date.now(),
                data: await this.options.generator(key)
            }
        }
        return this.cacheData[key].data

    }

    async getAll(keys: Array<string>) {
        this.cleanup()

        const missing = keys.filter(key => !this.cacheData[key]);

        if (missing.length) {
            let values: Array<T>;
            if (this.options.multipleGenerator) {
                values = await this.options.multipleGenerator(missing);
            } else {
                values = await Promise.all(missing.map(missingKey => this.options.generator(missingKey)))
            }

            for (let i = 0; i < missing.length; i++) {
                this.cacheData[missing[i]] = {
                    timestamp: Date.now(),
                    data: values[i]
                }
            }
        }
        let keyObj: { [key: string]: T } = {}
        keys.forEach(key => keyObj[key] = this.cacheData[key].data)
        return keyObj
    }
}