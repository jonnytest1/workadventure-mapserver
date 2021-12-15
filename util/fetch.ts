import * as fetch from "node-fetch";


declare global {
    namespace NodeJS {
        interface Global {
            fetch: ((input: RequestInfo, init?: RequestInit) => Promise<Response>)
        }
    }
}
global.fetch = fetch as unknown as typeof global.fetch;