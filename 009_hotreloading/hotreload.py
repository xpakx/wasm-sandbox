import asyncio
import websockets
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

SOURCE = './web.c'
WASM = './web.wasm'

PORT = 8765


def rebuild(first_use=False):
    command = ['make', 'DEV=1']
    if first_use:
        command.append('-B')
    try:
        subprocess.run(command, check=True, text=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print('An error occurred while running make:', e)
        print('Error output:', e.stderr)


class FileChangeHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self.clients = set()

    def add_client(self, websocket):
        self.clients.add(websocket)

    def remove_client(self, websocket):
        self.clients.discard(websocket)

    def on_modified(self, event):
        if event.src_path == SOURCE:
            print("Source changed, recompiling.")
            rebuild()
        if event.src_path == WASM:
            print("WASM compiled, notify clients.")
            asyncio.run(self.notify_ws())

    async def notify_ws(self):
        for client in self.clients:
            await client.send("file changed")


file_change_handler = FileChangeHandler()


async def handler(websocket, path):
    file_change_handler.add_client(websocket)
    try:
        async for _ in websocket:
            pass
    finally:
        file_change_handler.remove_client(websocket)


async def main():
    async with websockets.serve(handler, "localhost", PORT):
        observer = Observer()
        observer.schedule(file_change_handler, path='.', recursive=False)
        observer.start()
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            observer.stop()
        observer.join()


rebuild(True)
asyncio.run(main())
