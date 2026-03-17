"""
Cymbal Sports — UCP Merchant Server  (RIGHT SIDE)
This is what EPAM builds for a real client.

Exposes:
  GET  /.well-known/ucp
  POST /checkouts
  GET  /checkouts/{id}
  POST /checkouts/{id}/complete
  GET  /products/search

Run on port 8000:
  uvicorn merchant_app:app --port 8000 --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from merchant_server import router as ucp_router

app = FastAPI(title="Cymbal Sports UCP Merchant Server", version="2026-01-11")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ucp_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)