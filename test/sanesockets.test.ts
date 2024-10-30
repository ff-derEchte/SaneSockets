import { SaneSocket } from "../src/sanesockets"
import { z } from "zod"

describe("sanesockets", () => {
    it("can open a basic socket and send text", async () => {
        const socket = await SaneSocket.start("wss://echo.websocket.org/");
        socket.writeText("Hello World");
        await socket.readText(); //echo.websocket.org first sends some weird served by message which we skip
        expect(await socket.readText()).toBe("Hello World")
        socket.close()
    })

    it("parses json", async () => {
        const socket = await SaneSocket.start("wss://echo.websocket.org/");
        await socket.readText(); //echo.websocket.org first sends some weird served by message which we skip
        const tom = {
            name: "Tom",
            age: 18
        }
        socket.writeJson(tom);
        expect(await socket.readJson()).toStrictEqual(tom)
        socket.close()
    })

    it("properly validates types using zod", async () => {
        const schema = z.object({
            name: z.string(),
            age: z.number()
        })
        const socket = await SaneSocket.start("wss://echo.websocket.org/");
        await socket.readText(); //echo.websocket.org first sends some weird served by message which we skip
        const tom = {
            name: "Tom",
            age: 18
        }
        socket.writeJson(tom);
        expect(await socket.readChecked(schema)).toStrictEqual(tom)
        socket.close()
    })
})