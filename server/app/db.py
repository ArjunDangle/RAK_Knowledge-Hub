# server/db.py
from prisma import Prisma

db = Prisma(auto_register=True)