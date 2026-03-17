"""
Google AI Mode Simulation  (LEFT SIDE — demo scaffolding only)
This simulates what Google AI Mode does when a user buys from a UCP merchant.
In production this is entirely Google's infrastructure — not EPAM's.

Calls the Cymbal Sports UCP merchant server on port 8000.

Run on port 8001:
  uvicorn main:app --port 8001 --reload
"""

import os, json, asyncio, inspect, time
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Google AI Mode Simulation", version="2026-01-11")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Tool schema builder ─────────────────────────────────────────────────────

def _tool_schema(fn):
    sig = inspect.signature(fn)
    doc = (fn.__doc__ or "").strip().split("\n")[0]
    props = {}
    required = []
    for name, param in sig.parameters.items():
        ann = param.annotation
        ptype = "number" if ann in (int, float) else "string"
        desc = name
        for line in (fn.__doc__ or "").split("\n"):
            line = line.strip()
            if line.startswith(name + ":"):
                desc = line[len(name)+1:].strip()
                break
        props[name] = {"type": ptype, "description": desc}
        if param.default is inspect.Parameter.empty:
            required.append(name)
    return {
        "name": fn.__name__,
        "description": doc,
        "parameters": {"type": "object", "properties": props, "required": required},
    }


# ─── /chat SSE endpoint ──────────────────────────────────────────────────────

@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    checkout_active = body.get("checkout_active", False)

    async def stream():
        try:
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                yield f"data: {json.dumps({'type':'error','content':'GOOGLE_API_KEY not set'})}\n\n"
                return

            from google import genai
            from google.genai import types
            from agent import SYSTEM_PROMPT, TOOL_MAP, TOOLS

            client = genai.Client(api_key=api_key)
            model  = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            tools_config = [{"function_declarations": [_tool_schema(fn) for fn in TOOLS]}]

            # Build conversation history
            contents = []
            for m in messages:
                role = "user" if m["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": m["content"]}]})

            # ── Confirmation path: skip Gemini, call confirm_payment directly ──
            if checkout_active:
                from tools import confirm_payment
                print("[CONFIRM] calling confirm_payment directly", flush=True)
                try:
                    result = await asyncio.get_event_loop().run_in_executor(None, confirm_payment)
                    yield f"data: {json.dumps({'type':'tool_call','tool':'confirm_payment','args':{}})}\n\n"
                    await asyncio.sleep(0)
                    yield f"data: {json.dumps({'type':'tool_result','tool':'confirm_payment','result':result})}\n\n"
                    await asyncio.sleep(0)
                    if result.get("order_id"):
                        msg = (f"Order confirmed!\n\n"
                               f"Order ID: {result['order_id']}\n"
                               f"Total charged: {result.get('total_charged', '')}\n"
                               f"Estimated delivery: {result.get('estimated_delivery', '3-5 working days')}")
                        yield f"data: {json.dumps({'type':'text','content':msg})}\n\n"
                    else:
                        yield f"data: {json.dumps({'type':'text','content':result.get('error','Payment failed')})}\n\n"
                    await asyncio.sleep(0)
                except Exception as e:
                    yield f"data: {json.dumps({'type':'error','content':str(e)})}\n\n"
                yield f"data: {json.dumps({'type':'done'})}\n\n"
                return

            # ── Agentic loop: each tool runs at most once, stop after create_checkout ──
            called = set()

            for _turn in range(10):
                t0 = time.time()
                resp = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model=model,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                            tools=tools_config,
                            temperature=0.1,
                        ),
                    )
                )
                print(f"[GEMINI] turn={_turn} took {time.time()-t0:.2f}s", flush=True)

                parts = resp.candidates[0].content.parts
                texts = [p.text for p in parts if hasattr(p, "text") and p.text]
                calls = [p.function_call for p in parts
                         if hasattr(p, "function_call") and p.function_call]

                if texts:
                    yield f"data: {json.dumps({'type':'text','content':' '.join(texts)})}\n\n"
                    await asyncio.sleep(0)

                if not calls:
                    break

                new_calls = [c for c in calls if c.name not in called]
                if not new_calls:
                    break

                contents.append(resp.candidates[0].content)

                tool_results = []
                for call in new_calls:
                    fn   = TOOL_MAP.get(call.name)
                    args = dict(call.args)
                    called.add(call.name)

                    print(f"[TOOL] {call.name}({args})", flush=True)
                    yield f"data: {json.dumps({'type':'tool_call','tool':call.name,'args':args})}\n\n"
                    await asyncio.sleep(0)

                    try:
                        # Run sync tool in executor so we don't block the event loop
                        result = await asyncio.get_event_loop().run_in_executor(
                            None, lambda fn=fn, args=args: fn(**args) if fn else {"error": f"unknown tool: {call.name}"}
                        )
                    except Exception as e:
                        result = {"error": str(e)}

                    print(f"[RESULT] {call.name} -> {str(result)[:200]}", flush=True)
                    yield f"data: {json.dumps({'type':'tool_result','tool':call.name,'result':result})}\n\n"
                    await asyncio.sleep(0)

                    tool_results.append({"function_response": {"name": call.name, "response": result}})

                contents.append({"role": "user", "parts": tool_results})

                # After create_checkout — build summary and stop
                if "create_checkout" in called:
                    checkout_result = next(
                        (r["function_response"]["response"] for r in tool_results
                         if r["function_response"]["name"] == "create_checkout"), None
                    )
                    print(f"[CHECKOUT RESULT] {checkout_result}", flush=True)

                    if checkout_result and checkout_result.get("total"):
                        lines = []
                        for li in (checkout_result.get("line_items") or []):
                            lines.append(f"{li['title']} x{li['qty']} — {li['unit_price']}")
                        lines.append(f"Discount: -{checkout_result.get('discount','£0.00')}")
                        lines.append(f"VAT: {checkout_result.get('vat','£0.00')}")
                        lines.append(f"Delivery: {checkout_result.get('delivery','£0.00')}")
                        lines.append(f"Total: {checkout_result.get('total','')}")
                        if checkout_result.get("loyalty_note"):
                            lines.append(checkout_result["loyalty_note"])
                        summary = "\n".join(lines) + "\n\nShall I confirm this order?"
                    else:
                        summary = "Checkout session created. Shall I confirm this order?"

                    yield f"data: {json.dumps({'type':'text','content':summary})}\n\n"
                    await asyncio.sleep(0)
                    break

            yield f"data: {json.dumps({'type':'done'})}\n\n"

        except Exception as e:
            import traceback
            yield f"data: {json.dumps({'type':'error','content':str(e),'detail':traceback.format_exc()})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)