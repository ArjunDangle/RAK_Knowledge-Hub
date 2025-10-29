# server/app/broadcaster.py
import asyncio
from typing import Dict, List

class Broadcast:
    def __init__(self):
        self.connections: Dict[int, List[asyncio.Queue]] = {}

    async def subscribe(self, user_id: int) -> asyncio.Queue:
        """Subscribes a user and returns a queue for them to receive messages."""
        q = asyncio.Queue()
        if user_id not in self.connections:
            self.connections[user_id] = []
        self.connections[user_id].append(q)
        return q

    def unsubscribe(self, user_id: int, q: asyncio.Queue):
        """Unsubscribes a user's queue."""
        if user_id in self.connections:
            self.connections[user_id].remove(q)
            if not self.connections[user_id]:
                del self.connections[user_id]

    async def push(self, user_id: int, message: str):
        """Pushes a message to a specific user's active connections."""
        if user_id in self.connections:
            for q in self.connections[user_id]:
                await q.put(message)

# Global instance
broadcast = Broadcast()