"""
Cymbal Sports — ADK Agent Tools
These tools call the REAL UCP merchant server endpoints (REST over HTTP).
The agent uses them to drive the full UCP shopping flow.
"""

import httpx

# The UCP merchant server runs on the same FastAPI app
UCP_BASE = "http://localhost:8000"

PERSONAS = {
    "james": {"first_name": "James", "last_name": "Mitchell", "email": "james.mitchell@example.com", "tier": "Gold",   "loyalty_pct": 5},
    "sarah": {"first_name": "Sarah", "last_name": "Chen",     "email": "sarah.chen@example.com",     "tier": "Silver", "loyalty_pct": 3},
    # Legacy aliases kept for compatibility
    "alex":  {"first_name": "James", "last_name": "Mitchell", "email": "james.mitchell@example.com", "tier": "Gold",   "loyalty_pct": 5},
    "sam":   {"first_name": "Sarah", "last_name": "Chen",     "email": "sarah.chen@example.com",     "tier": "Silver", "loyalty_pct": 3},
    "guest":{"first_name": "Guest", "last_name": "",        "email": "",                 "tier": "Guest",  "loyalty_pct": 0},
}

# Session state (in-memory per server run)
_state: dict = {"persona": None, "checkout_id": None}


# ---------------------------------------------------------------------------
# Tool 1: set_persona
# ---------------------------------------------------------------------------

def set_persona(persona_name: str) -> dict:
    """
    Set the shopper identity for this session.
    persona_name: 'james' (Gold), 'sarah' (Silver), or 'guest'
    Returns the persona details including loyalty tier.
    """
    key = persona_name.lower()
    persona = PERSONAS.get(key, PERSONAS["guest"])
    _state["persona"] = key
    # Do not reset checkout_id — a checkout may already be in progress
    if not _state.get("checkout_id"):
        _state["checkout_id"] = None
    return {
        "ucp_message": "Credential_Set",
        "persona": key,
        "first_name": persona["first_name"],
        "tier": persona["tier"],
        "loyalty_discount": f"{persona['loyalty_pct']}% loyalty discount applied" if persona["loyalty_pct"] else "No loyalty discount (guest)",
    }


# ---------------------------------------------------------------------------
# Tool 2: search_products
# ---------------------------------------------------------------------------

def search_products(query: str = "", max_price_gbp: float = 999.0) -> dict:
    """
    Search the Cymbal Sports product catalogue via the UCP /products/search endpoint.
    query: search keywords (e.g. 'nike', 'running')
    max_price_gbp: maximum price filter in GBP
    Returns a list of matching products with prices.
    """
    max_pence = int(max_price_gbp * 100)
    resp = httpx.get(
        f"{UCP_BASE}/products/search",
        params={"q": query, "max_price": max_pence},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()

    # Format prices for the agent
    products = []
    for p in data["products"]:
        products.append({
            "id": p["id"],
            "title": p["title"],
            "price": f"£{p['price_pence'] / 100:.2f}",
            "effective_price": f"£{p['effective_price_pence'] / 100:.2f}",
            "discount": f"{p['promo_pct']}% off" if p["promo_pct"] else "No promo",
            "image_url": p.get("image_url"),
        })

    return {
        "ucp_message": "Offer_Response",
        "products": products,
        "count": data["count"],
    }


# ---------------------------------------------------------------------------
# Tool 3: create_checkout  (calls POST /checkouts — real UCP endpoint)
# ---------------------------------------------------------------------------

def create_checkout(product_id: str, quantity: int = 1) -> dict:
    """
    Create a UCP checkout session for the selected product.
    Calls POST /checkouts with a spec-compliant CheckoutCreateRequest body.
    product_id: the product id from search results
    quantity: number of items (default 1)
    """
    # Guard: reuse existing session if already created
    if _state.get("checkout_id"):
        return get_checkout()

    persona_key = _state.get("persona") or "guest"
    persona = PERSONAS[persona_key]

    body: dict = {
        "currency": "GBP",
        "line_items": [
            {
                "item": {"id": product_id},
                "quantity": quantity,
            }
        ],
        "payment": {
            "selected_instrument_id": None,
            "instruments": [],
        },
    }

    if persona["email"]:
        body["buyer"] = {
            "first_name": persona["first_name"],
            "last_name": persona["last_name"],
            "email": persona["email"],
        }

    resp = httpx.post(f"{UCP_BASE}/checkouts", json=body, timeout=10)
    if resp.status_code == 409:
        return {"error": resp.json().get("detail", "Item out of stock")}
    resp.raise_for_status()
    data = resp.json()

    _state["checkout_id"] = data["id"]

    # Find totals
    totals = {t["type"]: t["amount"] for t in data["totals"]}
    discount = totals.get("discount", 0)
    loyalty_info = f"(includes £{discount/100:.2f} discount)" if discount else ""

    return {
        "ucp_message": "Checkout_Session",
        "checkout_id": data["id"],
        "status": data["status"],
        "line_items": [
            {"title": li["item"]["title"], "qty": li["quantity"],
             "unit_price": f"£{li['item']['price'] / 100:.2f}"}
            for li in data["line_items"]
        ],
        "subtotal": f"£{totals.get('subtotal', 0) / 100:.2f}",
        "discount": f"£{totals.get('discount', 0) / 100:.2f}",
        "vat": f"£{totals.get('tax', 0) / 100:.2f}",
        "delivery": f"£{totals.get('fulfillment', 0) / 100:.2f}",
        "total": f"£{totals.get('total', 0) / 100:.2f}",
        "loyalty_note": loyalty_info,
        "payment_handler": data["payment"]["handlers"][0]["name"] if data.get("payment") else None,
    }


# ---------------------------------------------------------------------------
# Tool 4: get_checkout  (calls GET /checkouts/{id})
# ---------------------------------------------------------------------------

def get_checkout(checkout_id: str = "") -> dict:
    """
    Retrieve the current checkout session details.
    checkout_id: leave blank to use the current session's checkout
    """
    cid = checkout_id or _state.get("checkout_id")
    if not cid:
        return {"error": "No active checkout. Please create a checkout first."}

    resp = httpx.get(f"{UCP_BASE}/checkouts/{cid}", timeout=10)
    resp.raise_for_status()
    data = resp.json()

    totals = {t["type"]: t["amount"] for t in data["totals"]}
    return {
        "ucp_message": "Checkout_State",
        "checkout_id": data["id"],
        "status": data["status"],
        "total": f"£{totals.get('total', 0) / 100:.2f}",
        "subtotal": f"£{totals.get('subtotal', 0) / 100:.2f}",
        "discount": f"£{totals.get('discount', 0) / 100:.2f}",
        "vat": f"£{totals.get('tax', 0) / 100:.2f}",
        "delivery": f"£{totals.get('fulfillment', 0) / 100:.2f}",
    }


# ---------------------------------------------------------------------------
# Tool 5: confirm_payment  (calls POST /checkouts/{id}/complete)
# ---------------------------------------------------------------------------

def confirm_payment(checkout_id: str = "") -> dict:
    """
    Complete the checkout and place the order.
    Calls POST /checkouts/{id}/complete — the final UCP protocol step.
    Returns the order confirmation with order ID and tracking info.
    """
    cid = checkout_id or _state.get("checkout_id")
    if not cid:
        return {"error": "No active checkout. Please create a checkout first."}

    resp = httpx.post(f"{UCP_BASE}/checkouts/{cid}/complete", timeout=10)
    if resp.status_code == 409:
        return {"error": "This checkout has already been completed."}
    resp.raise_for_status()
    data = resp.json()

    totals = {t["type"]: t["amount"] for t in data["totals"]}
    order_conf = data.get("order_confirmation", {})

    return {
        "ucp_message": "Transaction_Receipt",
        "checkout_id": data["id"],
        "status": data["status"],
        "order_id": order_conf.get("id", "N/A"),
        "total_charged": f"£{totals.get('total', 0) / 100:.2f}",
        "description": order_conf.get("description", "Order placed successfully"),
        "order_url": order_conf.get("permalink_url"),
        "payment_handler": "dev.cymbal.mock_pay (demo)",
        "estimated_delivery": "3–5 working days",
        "tracking_note": "Tracking details will be emailed to you",
    }


# ---------------------------------------------------------------------------
# Tool list for ADK agent registration
# ---------------------------------------------------------------------------

UCP_TOOLS = [set_persona, search_products, create_checkout, get_checkout, confirm_payment]