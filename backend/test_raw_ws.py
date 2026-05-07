import asyncio
import websockets

async def test():
    try:
        async with websockets.connect("ws://127.0.0.1:8000/fall-detection/ws") as ws:
            print("Connected successfully to ws!")
            await ws.send("hello")
            print("Message sent")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test())
