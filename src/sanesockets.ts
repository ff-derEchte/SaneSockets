let WebSocket: typeof globalThis.WebSocket;

if (typeof window !== 'undefined' && window.WebSocket) {
  // In the browser, use the global WebSocket
  WebSocket = window.WebSocket;
} else {
  // In Node.js, use the ws library
  const WS = require('ws'); // Import the ws library for Node.js
  WebSocket = WS; // Assign ws to WebSocket
}

export class SaneSocket {
    private socket: WebSocket;
    private requestQueue: Deque<ReadCallBack>;
    private itemQueue: Deque<MessageEvent<any>>;
    private startListener: () => void = () => {};
    private isStated: boolean = false;

    public static async start(url: string | URL, protocols?: string | string[]) {
        const socket = new SaneSocket(url, protocols);
        await socket.start();
        return socket;
    }

    constructor(url: string | URL, protocols?: string | string[]) {
        this.socket = new WebSocket(url, protocols);
        this.socket.binaryType = "blob";
        this.requestQueue = new Deque();
        this.itemQueue = new Deque();
        this.socket.onmessage = (ev) => {
            const handler = this.requestQueue.removeFront();
            if (handler !== undefined) {
                handler.res(ev);
            } else {
                this.itemQueue.addBack(ev);
            }
        };

        this.socket.onerror = (ev) => {
            let item = this.requestQueue.removeFront();
            while (item != undefined) {
                item.err(new Error(ev.type));
                item = this.requestQueue.removeFront();
            }
        };

        this.socket.onclose = (ev) => {
            let item = this.requestQueue.removeFront();
            while (item != undefined) {
                item.err(new Error(ev.reason));
                item = this.requestQueue.removeFront();
            }
        };
        this.socket.onopen = (ev) => {
            this.startListener()
            this.isStated = true;
        }
    }

    private read(callback: ReadCallBack) {
        const item = this.itemQueue.removeFront();
        if (item !== undefined) {
            callback.res(item);
            return;
        }

        this.requestQueue.addBack(callback);
    }

    public start(): Promise<void> {
        const [promise, res, rej] = createDeferred<void>();
        if (this.isStated) res();
        this.startListener = res;
        return promise
    }

    public readText(): Promise<string> {
        const [promise, res, rej] = createDeferred<string>();
        this.read({
            res: ev => res(String(ev.data)),
            err: err => rej(err)
        });
        return promise;
    }

    public readJson(): Promise<any> {
        const [promise, res, rej] = createDeferred<any>();
        this.read({
            res: ev => {
                const data = String(ev.data);
                try {
                    res(JSON.parse(data));
                } catch(e) {
                    rej(e)
                }
            },
            err: err => rej(err)
        });
        return promise;
    }

    public async readChecked<E>(schema: Parser<E>): Promise<E> {
       const result = await this.readJson();
       return schema.parse(result)
    }

    public writeJson(value: any) {
        const data = JSON.stringify(value);
        this.socket.send(data);
    }

    public writeText(value: string) {
        this.socket.send(value);
    }

    public write(value: string | ArrayBufferLike | Blob | ArrayBufferView) {
        this.socket.send(value);
    }

    public close(code?: number, reason?: string) {
        this.socket.close(code, reason)
    }

    public readMessage(): Promise<Message> {
        const [promise, res, rej] = createDeferred<Message>();
        this.read({
            res: ev => {
                if (typeof ev.data == "string") {
                    res({
                        type: "TextMessage",
                        contents: ev.data
                    })
                } else if (ev.data instanceof Blob) {
                    res({
                        type: "BinaryMessage",
                        contents: ev.data
                    })
                } else {
                    rej("Invalid message type found")
                }
            },
            err: err => rej(err)
        });

        return promise
    }

    public async *iterMessage(): AsyncGenerator<Message, void, unknown> {
        while(true) {
            yield await this.readMessage()
        }
    }

    public async *iterJson(): AsyncGenerator<any, void, unknown> {
        while(true) {
            yield await this.readJson()
        }
    }

    public async *iterChecked<E>(parser: Parser<E>): AsyncGenerator<E, void, unknown> {
        while(true) {
            yield await this.readChecked(parser)
        }
    }
}   


export type Message = {
    type: "TextMessage"
    contents: string
} | {
    type: "BinaryMessage"
    contents: Blob
}


//more general interface to allow stuff like zod to be used
export interface Parser<T> {
    parse(data: unknown): T;
}

type ReadCallBack = {
    res: (ev: MessageEvent<any>) => void
    err: (e: Error) => void
}

interface DequeNode<T> {
    next: DequeNode<T> | undefined
    prev:  DequeNode<T> | undefined
    value: T
}

class Deque<T> {

    front: DequeNode<T> | undefined
    back: DequeNode<T> | undefined
    constructor() {
        this.front = this.back = undefined;
    }
    addFront(value: T) {
        if (!this.front) this.front = this.back = { value, prev: undefined, next: undefined };
        else this.front = this.front.next = { value, prev: this.front, next: undefined };
    }
    removeFront() {
        let value = this.peekFront();
        if (this.front === this.back) this.front = this.back = undefined;
        else (this.front = this.front!.prev)!.next = undefined;
        return value;
    }
    peekFront() { 
        return this.front && this.front.value;
    }
    addBack(value: T) {
        if (!this.front) this.front = this.back = { value, next: undefined, prev: undefined };
        else this.back = this.back!.prev = { value, next: this.back, prev: undefined };
    }
    peekBack() { 
        return this.back && this.back.value;
    }
}

function createDeferred<T>(): [Promise<T>, (value: T | PromiseLike<T>) => void, (reason?: any) => void] {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
  
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
  
    return [promise, resolve!, reject! ];
}
  

async function example() {
    const socket = new SaneSocket("wss://someurl");
    const message = await socket.readMessage();

    if (message.type == "TextMessage") {
        console.log("text message: ", message.contents);
    } else { //ts is smart here so i dont need to do == "Binary message because it knows it can only be either one of the 2"
        message.contents //is now a blob and u cna idk  use it as an image
    }


    for await (const message of socket.iterJson()) {
    }

}