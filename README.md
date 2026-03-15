# Cymbal Sports — UCP Demo

A working demo of Google's Universal Commerce Protocol (UCP) built as a Google AI Mode skin.

**Stack:** Official UCP Python SDK · Google Gemini (ADK) · FastAPI · React  
**Demo persona:** James Mitchell · Gold tier · 5% loyalty discount  
**UCP version:** `2026-01-11`

---

## What is UCP?

The Universal Commerce Protocol is an open standard announced by Google at NRF on 11 January 2026, co-developed with Shopify, Etsy, Wayfair, Target and Walmart, and endorsed by 20+ partners including Adyen, Mastercard, Stripe, Visa, Zalando and The Home Depot.

UCP solves the **N×N integration problem**: every AI platform previously needed custom integrations with every retailer. UCP provides a single standard so any AI agent can transact with any UCP-compliant merchant using a common protocol.

### What UCP is — and is not

| What UCP is | What UCP is not |
|---|---|
| A standard for **agentic checkout** — AI completes the transaction | A product discovery protocol — Google Shopping / Merchant Center already does this |
| An API layer enabling `POST /checkouts`, identity handoff, payment confirmation | A replacement for Google Shopping feeds |
| A checkout standard that works across AI Mode, Gemini, Copilot, ChatGPT | A Google-proprietary lock-in (Apache 2.0 open source) |
| The "buy" half of the commerce journey | The "find" half — that's Merchant Center |

### How it fits into Google AI Mode

```
User query in AI Mode
        │
        ▼
Google Shopping index       ← Merchant Center feeds (already exists)
(discovery — which stores carry this item, at what price)
        │
User clicks "Buy with Google Wallet" on a UCP-enabled listing
        │
        ▼
UCP kicks in                ← This is what EPAM builds for clients
  01  Credential_Set        ← Google Wallet identity → merchant
  02  Offer_Response        ← Merchant catalogue queried
  03  Checkout_Session      ← POST /checkouts (SDK-validated)
  04  Checkout_State        ← GET /checkouts/{id}
  05  Transaction_Receipt   ← POST /checkouts/{id}/complete
        │
        ▼
Order confirmed — buyer never left AI Mode
```

The key insight: **discovery already worked**. UCP adds the transactional completion layer that didn't exist — letting an AI agent close the sale without redirecting the user to the retailer's site.

### UCP architecture

A UCP-compliant merchant publishes a discovery profile at `/.well-known/ucp`:

```json
{
  "ucp": {
    "version": "2026-01-11",
    "services": {
      "dev.ucp.shopping": {
        "endpoint": "https://merchant.com/ucp/",
        "capabilities": [
          "dev.ucp.shopping.checkout",
          "dev.ucp.shopping.discount",
          "dev.ucp.shopping.fulfillment"
        ]
      }
    },
    "payment": {
      "handlers": ["com.google.pay", "com.shopify.shop_pay"]
    }
  }
}
```

When an AI agent wants to transact, it reads this profile, negotiates capabilities, then drives the checkout state machine:

```
incomplete → requires_escalation → ready_for_complete → confirmed
```

UCP supports REST, MCP (Model Context Protocol), and A2A (Agent2Agent) as transport options, and is compatible with AP2 (Agent Payments Protocol) for secure payment tokenisation.

---

## What's real vs simulated in this demo

| Component | Status | Notes |
|---|---|---|
| UCP Python SDK | ✅ Real | Official `github.com/Universal-Commerce-Protocol/python-sdk` |
| `/.well-known/ucp` profile | ✅ Real | Spec-compliant, version `2026-01-11` |
| `POST /checkouts` | ✅ Real | Validated by `CheckoutCreateRequest` SDK model |
| `GET /checkouts/{id}` | ✅ Real | `CheckoutResponse` structure |
| `POST /checkouts/{id}/complete` | ✅ Real | UCP order confirmation |
| UCP capabilities declared | ✅ Real | checkout · discount · fulfillment |
| Google Wallet modal | 🎭 Simulated | Illustrates credential handoff concept |
| Google Shopping shelf | 🎭 Simulated | Hardcoded mock representing Merchant Center index |
| Multi-store results | 🎭 Simulated | JD Sports, Foot Locker, Sports Direct are fake |
| Product catalogue | 📋 Hardcoded | Replace with real PIM / OMS API |
| Payment | 🧪 Mock | `dev.cymbal.mock_pay` — replace with Google Pay handler |
| AI surface | 🤖 Gemini agent | In production this is Google AI Mode itself |

**The EPAM pitch in one sentence:** We build the merchant side — the UCP endpoints, the credential handoff, the checkout integration with your existing OMS/PSP. The buyer side (Google AI Mode, Google Wallet) is Google's.

---

## Quick start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google API key with Gemini access (`GOOGLE_API_KEY`)

---

### Step 1 — Clone the UCP Python SDK

The UCP SDK is **not on PyPI**. You must clone it from GitHub before the backend will start. This is the most common cause of the `ModuleNotFoundError: No module named 'ucp_sdk'` error.

```bash
cd backend
git clone https://github.com/Universal-Commerce-Protocol/python-sdk.git sdk/python
```

---

### Step 2 — Backend

```bash
cd backend

# Create and activate virtualenv
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install the UCP SDK from the local clone (Step 1 must be done first)
pip install -e sdk/python

# Install remaining dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env — set GOOGLE_API_KEY=AIza...

# Start the server
uvicorn main:app --reload --port 8000
```

The backend serves two things on port 8000:
- **Gemini agent** at `POST /chat` — drives the UCP flow via ADK tools
- **UCP merchant server** at `/.well-known/ucp`, `/checkouts`, `/products/search`

---

### Step 3 — Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

### Step 4 — Run the demo

1. Google Wallet modal fires on load — click **Continue as James Mitchell**
2. Type a query, e.g. `Find me white Adidas trainers for men, size 8`
3. Google Shopping shelf appears — 4 stores, only Cymbal Sports has **Buy with Google Wallet**
4. Click **Buy with Google Wallet** — watch the 5 UCP step badges execute:

```
01 Credential_Set       Google Wallet identity passed to merchant
02 Offer_Response       Cymbal Sports catalogue queried via UCP
03 Checkout_Session     POST /checkouts — SDK-validated session created
04 Checkout_State       GET /checkouts/{id} — order assembled, loyalty applied
05 Transaction_Receipt  POST /checkouts/{id}/complete — order confirmed
```

---

## UCP endpoints (what EPAM builds for clients)

| Endpoint | Method | Description |
|---|---|---|
| `/.well-known/ucp` | GET | Merchant discovery profile — capabilities, payment handlers |
| `/checkouts` | POST | Create checkout session (SDK-validated `CheckoutCreateRequest`) |
| `/checkouts/{id}` | GET | Get current checkout state |
| `/checkouts/{id}` | PATCH | Update buyer info (address, delivery option) |
| `/checkouts/{id}/complete` | POST | Confirm payment — returns order ID |
| `/products/search` | GET | Catalogue search (internal, not part of UCP spec) |

---

## Environment variables

```env
GOOGLE_API_KEY=AIza...           # Required — Gemini API key
GEMINI_MODEL=gemini-2.5-flash    # Optional — defaults to gemini-2.5-flash
```

---

## Project structure

```
cymbal-ucp-demo/
├── .env.example
├── README.md
├── backend/
│   ├── main.py                  # FastAPI app + /chat SSE endpoint
│   ├── merchant_server.py       # UCP merchant endpoints (real spec)
│   ├── tools.py                 # Gemini ADK tools calling UCP endpoints
│   ├── agent.py                 # Gemini agent definition
│   ├── requirements.txt
│   └── sdk/python/              # UCP SDK clone (git clone in Step 1)
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── App.jsx              # Google AI Mode UI skin
        ├── index.css
        └── components/
            ├── UCPBadge.jsx     # Step badges (01–05)
            ├── ProductCards.jsx # Cymbal catalogue cards
            └── OrderCards.jsx   # Checkout + receipt cards
```

---

## UK readiness — what to do when UCP goes live

UCP launched in the US in January 2026 with Etsy and Wayfair as the first live merchants. Shopify, Target and Walmart are next. Google has confirmed global expansion is coming in 2026 but has not given a UK date.

### What UK retailers need to do now

**1. Merchant Center — get your feed right**

UCP checkout eligibility is gated on Merchant Center data quality. Google is adding new product attributes specifically for conversational commerce (answers to common questions, compatible accessories, substitutes). Audit your feed now:

- All products must have GTIN, accurate pricing, real-time inventory signals
- Enable `native_commerce` product attribute when it becomes available in the UK
- Configure shipping and returns correctly — these are surfaced in UCP checkout
- Set up Google Pay merchant account and note your Merchant ID

**2. Join the UCP waitlist**

Google requires pre-approval before a merchant can go live on AI Mode and Gemini. Join at:
`https://support.google.com/merchants/contact/ucp_integration_interest`

Early UK merchants will have a significant advantage — Google's intent is to surface UCP-enabled listings more prominently in AI Mode than standard Shopping results.

**3. Assess your checkout architecture**

UCP requires your checkout backend to expose three endpoints (`POST /checkouts`, `GET /checkouts/{id}`, `POST /checkouts/{id}/complete`). Assess:

- **Shopify merchants** — Shopify is building native UCP support via Agentic Storefronts. Minimal custom work needed.
- **Magento / BigCommerce / custom** — custom UCP integration required. This is the EPAM engagement.
- **PSP** — Adyen, Stripe and Mastercard are UCP payment handler partners. Confirm your PSP is on the list.

**4. Loyalty programs**

UCP includes a `dev.ucp.shopping.discount` capability that enables loyalty credentials to be passed from Google Wallet to the merchant at checkout. If you run a loyalty programme, this is the highest-value UCP feature for conversion — a customer's tier and points are known before they even start the checkout session.

**5. What EPAM delivers**

| Deliverable | Description |
|---|---|
| UCP merchant profile | `/.well-known/ucp` spec-compliant, published on client domain |
| Checkout endpoints | `POST /checkouts`, `GET`, `PATCH`, `POST /complete` wired to existing OMS |
| PSP integration | Google Pay handler connected to Adyen / Stripe / existing PSP |
| Loyalty integration | `dev.ucp.shopping.discount` extension connected to CRM/loyalty platform |
| Merchant Center prep | Feed audit, `native_commerce` attribute, shipping/returns config |
| Testing & compliance | UCP conformance test suite (`github.com/Universal-Commerce-Protocol/conformance`) |

**Rough timeline:** 8–12 weeks from engagement start to UCP-ready backend, assuming an existing OMS and PSP are in place.

---

## Upgrading from demo to production

When your client joins the UCP programme:

1. Replace `dev.cymbal.mock_pay` payment handler with `com.google.pay`
2. Replace the hardcoded product catalogue with the real PIM/OMS API
3. Replace the in-memory session state with a persistent checkout store (Redis / DB)
4. Add idempotency keys to all `POST /checkouts` requests
5. Add `UCP-Agent` header validation on incoming requests
6. Register the live `/.well-known/ucp` endpoint with Google via Merchant Center
7. Run the official UCP conformance tests: `github.com/Universal-Commerce-Protocol/conformance`

The protocol structure, checkout state machine, and SDK models in this demo are already production-spec.

---

## Further reading

| Resource | URL |
|---|---|
| UCP spec + docs | `https://developers.google.com/merchant/ucp` |
| UCP GitHub org | `https://github.com/Universal-Commerce-Protocol` |
| Python SDK | `https://github.com/Universal-Commerce-Protocol/python-sdk` |
| Conformance tests | `https://github.com/Universal-Commerce-Protocol/conformance` |
| Google blog (launch) | `https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/` |
| Shopify engineering deep-dive | `https://shopify.engineering/UCP` |
| UCP merchant waitlist | `https://support.google.com/merchants/contact/ucp_integration_interest` |