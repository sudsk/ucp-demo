# Cymbal Sports — Real UCP Demo

**A working demo of Google's Universal Commerce Protocol (UCP) using the official SDK.**

Powered by: Official UCP Python SDK · Google Gemini · FastAPI · React

---

## What's real

| Component | Status |
|---|---|
| UCP Python SDK | ✅ Official `github.com/Universal-Commerce-Protocol/python-sdk` |
| `/.well-known/ucp` profile | ✅ Spec-compliant (version `2026-01-11`) |
| `POST /checkouts` | ✅ Validated by `CheckoutCreateRequest` SDK model |
| `GET /checkouts/{id}` | ✅ Real `CheckoutResponse` structure |
| `POST /checkouts/{id}/complete` | ✅ Real UCP order confirmation |
| UCP capabilities declared | ✅ checkout · discount · fulfillment · order |
| Product catalogue | 📋 Hardcoded (swap for PIM API) |
| Payment | 🧪 `dev.cymbal.mock_pay` (swap for Google Pay handler) |
| AI surface | 🤖 Gemini agent (swap for Google AI Mode) |

---

## Quick start (10 minutes)

### 1. Clone the UCP SDK

```bash
mkdir sdk
git clone https://github.com/Universal-Commerce-Protocol/python-sdk.git sdk/python
cd sdk/python && pip install -e . && cd ../..
```

### 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env       # add your GOOGLE_API_KEY
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## UCP endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/.well-known/ucp` | GET | UCP merchant discovery profile |
| `/checkouts` | POST | Create checkout (SDK-validated) |
| `/checkouts/{id}` | GET | Get checkout state |
| `/checkouts/{id}` | PATCH | Update buyer info |
| `/checkouts/{id}/complete` | POST | Complete checkout → order |
| `/products/search` | GET | Product discovery |

---

## Demo personas

| Persona | Email | Tier | Loyalty |
|---|---|---|---|
| Alex Johnson | alex@example.com | Gold | 5% off |
| Sam Patel | sam@example.com | Silver | 3% off |
| Guest | — | — | No discount |

---

## Environment variables

```env
GOOGLE_API_KEY=AIza...          # Required
GEMINI_MODEL=gemini-2.0-flash   # Optional
```

---

## Upgrading to production UCP

When you join the Google UCP waitlist and get approved:

1. Replace `dev.cymbal.mock_pay` with the real Google Pay handler config
2. Point `/.well-known/ucp` `endpoint` to your production server
3. Register your Merchant Center account feed
4. Replace the hardcoded catalogue with your real PIM API

The protocol structure, checkout flow, and SDK models are already production-ready.
