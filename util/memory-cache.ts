export class MemoryCache<T>{
    private cacheData: {
        [key: string]: {
            timestamp: number,
            data: T
        }
    } = {}

    private keyLoader: {
        [key: string]: Promise<void | {
            [key: string]: T;
        }>
    } = {}

    constructor(private options: {
        duration: number,
        generator?: (key: string) => Promise<T>
        multipleGenerator?: (key: Array<string>) => Promise<{ [key: string]: T }>
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

        const missing = []

        const alreadyLoading = []

        for (const key of keys) {
            if (!this.cacheData[key]) {
                if (this.keyLoader[key]) {
                    alreadyLoading.push(key)
                } else {
                    missing.push(key)
                }
            }
        }

        await Promise.all([
            this.getAlreadyLoading(alreadyLoading),
            this.getMissing(missing)
        ])

        let keyObj: { [key: string]: T } = {}
        keys.forEach(key => keyObj[key] = this.cacheData[key].data)
        return keyObj
    }

    private async getMissing(missing) {
        if (missing.length) {
            let values: { [key: string]: T };

            if (this.options.multipleGenerator) {
                const multiple = this.options.multipleGenerator(missing)
                for (let missingStr of missing) {
                    this.keyLoader[missingStr] = multiple;
                }
                values = await multiple;
                for (let i = 0; i < missing.length; i++) {
                    this.cacheData[missing[i]] = {
                        timestamp: Date.now(),
                        data: values[missing[i]]
                    }
                    delete this.keyLoader[missing[i]];
                }
            } else {
                await Promise.all(missing.map(missing => {
                    const promise = (async () => {
                        this.cacheData[missing] = {
                            timestamp: Date.now(),
                            data: await this.options.generator(missing)
                        }
                        delete this.keyLoader[missing];
                    })()
                    this.keyLoader[missing] = promise
                    return promise;
                }))
            }

        }
    }

    private async getAlreadyLoading(alreadyLoading: Array<string>): Promise<void[]> {
        return Promise.all(alreadyLoading.map(async loadingKey => {
            await this.keyLoader[loadingKey];
        }))
    }
}