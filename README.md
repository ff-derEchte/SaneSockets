# SaneSocket ![npm version](https://img.shields.io/npm/v/sanesockets) ![license](https://img.shields.io/badge/license-MIT-brightgreen)

# SaneSockets
SaneSockets is a simple and efficient WebSocket wrapper for JavaScript and TypeScript that provides a more intuitive, pull-based API. It simplifies the handling of WebSocket communication by allowing developers to focus on message processing without getting bogged down in callback hell.

## Why SaneSockets?

In a world where real-time communication is crucial, managing WebSocket connections can often lead to complex code. SaneSocket aims to streamline this process by offering an easy-to-use interface that reduces boilerplate code while enhancing readability and maintainability.


## Features

- **Pull-based Message Handling**: Easily read messages using async iterators or promise-based methods.
- **Built-in JSON Support**: Send and receive JSON data effortlessly.
- **Runtime Type Checking**: Validate incoming data with libraries like Zod for robust applications.
- **Cross-Platform Support**: Works seamlessly in both browser and Node.js environments.
- **Easy to Use**: A clean API that reduces boilerplate code and improves developer experience.

## Installation

To install SaneSocket, you can use npm or yarn:

```bash
npm install sanesockets
```

# Usage
## Basic Example
Here's how to create a simple WebSocket connection and send/receive messages:

```js
import { SaneSocket } from "sanesockets";

async function example() {
    const socket = await SaneSocket.start("wss://echo.websocket.org/");
    
    // Send a text message
    socket.writeText("Hello, World!");

    // Read the echoed message
    const response = await socket.readText();
    console.log(response); // Outputs: Hello, World!

    socket.close();
}

example();
```

## Working with Json
Sending and receiving JSON data is straightforward:
```js
import { SaneSocket } from "sanesockets";

async function jsonExample() {
    const socket = await SaneSocket.start("wss://echo.websocket.org/");
    
    const data = { name: "Tom", age: 18 };
    
    // Send JSON data
    socket.writeJson(data);

    // Read the JSON response
    const response = await socket.readJson();
    console.log(response); // Outputs: { name: "Tom", age: 18 }

    socket.close();
}

jsonExample();
```

## Type validation with Zod
You can integrate runtime type checking with libraries like Zod:
```js
import { SaneSocket } from "sanesockets";
import { z } from "zod";

const schema = z.object({
    name: z.string(),
    age: z.number()
});

async function typeValidationExample() {
    const socket = await SaneSocket.start("wss://echo.websocket.org/");
    
    const data = { name: "Tom", age: 18 };
    socket.writeJson(data);

    // Validate the incoming data
    const validatedData = await socket.readChecked(schema);
    console.log(validatedData); // Outputs: { name: "Tom", age: 18 }

    socket.close();
}

typeValidationExample();
```
## Async Iterators
You can use async iterators to handle incoming messages in a loop:

```js
import { SaneSocket } from "sanesockets";
import { z } from "zod";

const PacketSchema = z.object({
    name: z.string(),
    age: z.number()
});

async function loopExample() {
    const socket = await SaneSocket.start("wss://your.websocket.server");

    // Iterate over incoming validated packets
    for await (const packet of socket.iterChecked(PacketSchema)) {
        console.log(packet);
    }

    socket.close();
}

loopExample();
```

## API

### SaneSocket

- **`static start(url: string | URL, protocols?: string | string[]): Promise<SaneSocket>`**: Initiates a WebSocket connection.
- **`writeText(value: string): void`**: Sends a text message.
- **`writeJson(value: any): void`**: Sends a JSON object.
- **`readText(): Promise<string>`**: Reads a text message.
- **`readJson(): Promise<any>`**: Reads and parses a JSON message.
- **`readChecked<E>(parser: Parser<E>): Promise<E>`**: Reads and validates a JSON message against a parser.
- **`close(code?: number, reason?: string): void`**: Closes the WebSocket connection.

### Async Iterators

- **`iterMessage(): AsyncGenerator<Message>`**: Asynchronously iterates over incoming messages.
- **`iterJson(): AsyncGenerator<any>`**: Asynchronously iterates over incoming JSON messages.
- **`iterChecked<E>(parser: Parser<E>): AsyncGenerator<E>`**: Asynchronously iterates over incoming validated JSON messages.
