"""
Cymbal Sports — Real UCP Merchant Server
Uses the official Universal-Commerce-Protocol Python SDK.
Implements: /.well-known/ucp, POST /checkouts, GET /checkouts/{id},
            PATCH /checkouts/{id}, POST /checkouts/{id}/complete,
            GET /products/search
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

# --- Real UCP SDK imports ---
from ucp_sdk.models._internal import Version
from ucp_sdk.models.schemas.shopping.checkout_create_req import CheckoutCreateRequest

# ---------------------------------------------------------------------------
# Product catalogue  (prices in pence/minor units, GBP)
# ---------------------------------------------------------------------------

PRODUCTS = {
    "nike-air-max-90": {
        "id": "nike-air-max-90",
        "title": "Nike Air Max 90",
        "price_pence": 10999,
        "promo_pct": 10,
        "image_url": "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/i1-665455a5-3160-4e7f-b7af-c4a1e7a32e4f/image.jpg",
    },
    "adidas-ultraboost-22": {
        "id": "adidas-ultraboost-22",
        "title": "Adidas Ultraboost 22",
        "price_pence": 15999,
        "promo_pct": 0,
        "image_url": "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_22_Shoes_Black_GZ0127_01_standard.jpg",
    },
    "nike-pegasus-39": {
        "id": "nike-pegasus-39",
        "title": "Nike Pegasus 39",
        "price_pence": 9499,
        "promo_pct": 15,
        "image_url": "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/9a8cfeef-f074-4f34-a73b-9edc8cca5b0a/air-zoom-pegasus-39-road-running-shoes-RnkZbp.png",
    },
    "asics-gel-nimbus-25": {
        "id": "asics-gel-nimbus-25",
        "title": "ASICS Gel-Nimbus 25",
        "price_pence": 13999,
        "promo_pct": 20,
        "image_url": "https://images.asics.com/is/image/asics/1011B547_001_SR_RT_GLB?$zoom$",
    },
    "new-balance-990v5": {
        "id": "new-balance-990v5",
        "title": "New Balance 990v5",
        "price_pence": 17499,
        "promo_pct": 0,
        "out_of_stock": True,
        "image_url": "https://nb.scene7.com/is/image/NB/m990gl5_nb_02_i?$pdpflexf2$&wid=440&hei=440",
    },
}

PERSONAS = {
    "alex@example.com": {"first_name": "Alex", "last_name": "Johnson", "loyalty_pct": 5, "tier": "Gold"},
    "sam@example.com":  {"first_name": "Sam",  "last_name": "Patel",   "loyalty_pct": 3, "tier": "Silver"},
}

DELIVERY_PENCE = 499
VAT_RATE = 0.20

# In-memory checkout store
_checkouts: dict[str, dict] = {}

router = APIRouter()


# ---------------------------------------------------------------------------
# /.well-known/ucp  — Spec-compliant merchant discovery profile
# ---------------------------------------------------------------------------

@router.get("/.well-known/ucp", tags=["UCP Discovery"])
async def get_merchant_profile(request: Request) -> dict:
    """Return the spec-compliant UCP merchant discovery profile."""
    base = str(request.base_url).rstrip("/")
    return {
        "ucp": {
            "version": "2026-01-11",
            "services": {
                "dev.ucp.shopping": {
                    "version": "2026-01-11",
                    "spec": "https://ucp.dev/specification/reference",
                    "rest": {
                        "schema": "https://ucp.dev/services/shopping/rest.openapi.json",
                        "endpoint": base,
                    },
                }
            },
            "capabilities": [
                {
                    "name": "dev.ucp.shopping.checkout",
                    "version": "2026-01-11",
                    "spec": "https://ucp.dev/specification/checkout",
                    "schema": "https://ucp.dev/schemas/shopping/checkout.json",
                },
                {
                    "name": "dev.ucp.shopping.discount",
                    "version": "2026-01-11",
                    "spec": "https://ucp.dev/specification/discount",
                    "schema": "https://ucp.dev/schemas/shopping/discount.json",
                    "extends": "dev.ucp.shopping.checkout",
                },
                {
                    "name": "dev.ucp.shopping.fulfillment",
                    "version": "2026-01-11",
                    "spec": "https://ucp.dev/specification/fulfillment",
                    "schema": "https://ucp.dev/schemas/shopping/fulfillment.json",
                    "extends": "dev.ucp.shopping.checkout",
                },
                {
                    "name": "dev.ucp.shopping.order",
                    "version": "2026-01-11",
                    "spec": "https://ucp.dev/specification/order",
                    "schema": "https://ucp.dev/schemas/shopping/order.json",
                },
            ],
        },
        "payment": {
            "handlers": [
                {
                    "id": "mock_pay",
                    "name": "dev.cymbal.mock_pay",
                    "version": "2026-01-11",
                    "spec": "https://ucp.dev/specification/checkout",
                    "config_schema": "https://ucp.dev/schemas/shopping/checkout.json",
                    "instrument_schemas": [
                        "https://ucp.dev/schemas/shopping/checkout.json"
                    ],
                    "config": {"merchant_name": "Cymbal Sports"},
                }
            ]
        },
    }


# ---------------------------------------------------------------------------
# Helper: build a spec-compliant checkout response dict
# ---------------------------------------------------------------------------

def _build_response(checkout: dict) -> dict:
    items_subtotal = checkout["items_subtotal"]
    discount_amt   = checkout["discount_amt"]
    vat_amt        = checkout["vat_amt"]
    delivery_amt   = checkout["delivery_pence"]
    total = items_subtotal - discount_amt + vat_amt + delivery_amt

    line_items = []
    for li in checkout["line_items"]:
        line_items.append({
            "id": li["id"],
            "item": {
                "id": li["product_id"],
                "title": li["title"],
                "price": li["unit_price"],
                "image_url": li.get("image_url"),
            },
            "quantity": li["quantity"],
            "totals": [
                {
                    "type": "subtotal",
                    "display_text": "Item price",
                    "amount": li["unit_price"] * li["quantity"],
                }
            ],
        })

    resp = {
        "ucp": {
            "version": "2026-01-11",
            "capabilities": [
                {"name": "dev.ucp.shopping.checkout",   "version": "2026-01-11"},
                {"name": "dev.ucp.shopping.discount",   "version": "2026-01-11"},
                {"name": "dev.ucp.shopping.fulfillment","version": "2026-01-11"},
            ],
        },
        "id":        checkout["id"],
        "status":    checkout["status"],
        "currency":  "GBP",
        "line_items": line_items,
        "totals": [
            {"type": "subtotal",    "display_text": "Subtotal",          "amount": items_subtotal},
            {"type": "discount",    "display_text": "Discount",          "amount": discount_amt},
            {"type": "tax",         "display_text": "VAT (20%)",         "amount": vat_amt},
            {"type": "fulfillment", "display_text": "Standard Delivery", "amount": delivery_amt},
            {"type": "total",       "display_text": "Total",             "amount": total},
        ],
        "links": [
            {"type": "privacy_policy",   "url": "https://cymbal.example.com/privacy",  "title": "Privacy Policy"},
            {"type": "terms_of_service", "url": "https://cymbal.example.com/terms",    "title": "Terms of Service"},
            {"type": "refund_policy",    "url": "https://cymbal.example.com/returns",  "title": "Returns & Refunds"},
        ],
        "payment": {
            "handlers": [
                {
                    "id": "mock_pay",
                    "name": "dev.cymbal.mock_pay",
                    "version": "2026-01-11",
                    "spec": "https://ucp.dev/specification/checkout",
                    "config_schema": "https://ucp.dev/schemas/shopping/checkout.json",
                    "instrument_schemas": ["https://ucp.dev/schemas/shopping/checkout.json"],
                    "config": {"merchant_name": "Cymbal Sports"},
                }
            ]
        },
    }

    if checkout.get("buyer"):
        resp["buyer"] = checkout["buyer"]

    if checkout.get("order_id"):
        resp["order_confirmation"] = {
            "id": checkout["order_id"],
            "description": "Order confirmed. Your trainers will arrive in 3–5 working days.",
            "permalink_url": f"https://cymbal.example.com/orders/{checkout['order_id']}",
        }

    return resp


# ---------------------------------------------------------------------------
# POST /checkouts — Create Checkout (validated by real SDK)
# ---------------------------------------------------------------------------

@router.post("/checkouts", tags=["UCP Checkout"], status_code=201)
async def create_checkout(request: Request) -> dict:
    body = await request.json()

    # Validate using the real UCP SDK Pydantic model
    try:
        req = CheckoutCreateRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Detect persona from buyer email for loyalty discounts
    buyer_email = (req.buyer.email if req.buyer else None) or ""
    persona = PERSONAS.get(buyer_email)
    loyalty_pct = persona["loyalty_pct"] if persona else 0

    line_items_out = []
    items_subtotal = 0
    discount_amt = 0

    for i, li in enumerate(req.line_items):
        product = PRODUCTS.get(li.item.id)
        if not product:
            raise HTTPException(status_code=422, detail=f"Unknown product: {li.item.id}")
        if product.get("out_of_stock"):
            raise HTTPException(status_code=409, detail=f"{product['title']} is currently out of stock")

        unit_price = product["price_pence"]
        line_subtotal = unit_price * li.quantity
        items_subtotal += line_subtotal
        discount_amt += int(line_subtotal * product.get("promo_pct", 0) / 100)

        line_items_out.append({
            "id": f"li_{i + 1}",
            "product_id": li.item.id,
            "title": product["title"],
            "unit_price": unit_price,
            "quantity": li.quantity,
            "image_url": product.get("image_url"),
        })

    # Apply loyalty on subtotal
    if loyalty_pct:
        discount_amt += int(items_subtotal * loyalty_pct / 100)

    taxable = items_subtotal - discount_amt
    vat_amt = int(taxable * VAT_RATE)

    checkout = {
        "id": f"chk_{uuid.uuid4().hex[:16]}",
        "status": "ready_for_complete",
        "currency": "GBP",
        "line_items": line_items_out,
        "items_subtotal": items_subtotal,
        "discount_amt": discount_amt,
        "vat_amt": vat_amt,
        "delivery_pence": DELIVERY_PENCE,
        "buyer": body.get("buyer"),
        "persona": persona,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _checkouts[checkout["id"]] = checkout

    return _build_response(checkout)


# ---------------------------------------------------------------------------
# GET /checkouts/{id}
# ---------------------------------------------------------------------------

@router.get("/checkouts/{checkout_id}", tags=["UCP Checkout"])
async def get_checkout(checkout_id: str) -> dict:
    checkout = _checkouts.get(checkout_id)
    if not checkout:
        raise HTTPException(status_code=404, detail="Checkout not found")
    return _build_response(checkout)


# ---------------------------------------------------------------------------
# PATCH /checkouts/{id} — Update Checkout
# ---------------------------------------------------------------------------

@router.patch("/checkouts/{checkout_id}", tags=["UCP Checkout"])
async def update_checkout(checkout_id: str, request: Request) -> dict:
    checkout = _checkouts.get(checkout_id)
    if not checkout:
        raise HTTPException(status_code=404, detail="Checkout not found")
    body = await request.json()
    if "buyer" in body:
        checkout["buyer"] = body["buyer"]
    return _build_response(checkout)


# ---------------------------------------------------------------------------
# POST /checkouts/{id}/complete — Complete Checkout
# ---------------------------------------------------------------------------

@router.post("/checkouts/{checkout_id}/complete", tags=["UCP Checkout"])
async def complete_checkout(checkout_id: str) -> dict:
    checkout = _checkouts.get(checkout_id)
    if not checkout:
        raise HTTPException(status_code=404, detail="Checkout not found")
    if checkout["status"] == "completed":
        raise HTTPException(status_code=409, detail="Checkout already completed")

    checkout["status"] = "completed"
    checkout["order_id"] = f"ORD-CS-{uuid.uuid4().hex[:8].upper()}"
    checkout["completed_at"] = datetime.now(timezone.utc).isoformat()

    return _build_response(checkout)


# ---------------------------------------------------------------------------
# GET /products/search — Product discovery for the Gemini agent
# ---------------------------------------------------------------------------

@router.get("/products/search", tags=["Product Discovery"])
async def search_products(q: str = "", max_price: int = 999999) -> dict:
    """Search the Cymbal Sports catalogue. max_price in pence."""
    results = []
    q_lower = q.lower()
    for pid, p in PRODUCTS.items():
        if p.get("out_of_stock"):
            continue
        if q_lower and q_lower not in p["title"].lower():
            continue
        effective = int(p["price_pence"] * (1 - p.get("promo_pct", 0) / 100))
        if effective > max_price:
            continue
        results.append({
            "id": pid,
            "title": p["title"],
            "price_pence": p["price_pence"],
            "promo_pct": p.get("promo_pct", 0),
            "effective_price_pence": effective,
            "image_url": p.get("image_url"),
        })
    return {"products": results, "count": len(results)}
