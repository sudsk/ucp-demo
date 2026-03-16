"""
Cymbal Sports — FastAPI app
- Real UCP merchant server (/.well-known/ucp, /checkouts/*, /products/search)
- Gemini agent chat endpoint (POST /chat, SSE streaming)
"""

import os, json, asyncio, inspect, time
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from merchant_server import router as ucp_router

app = FastAPI(title="Cymbal Sports UCP Demo", version="2026-01-11")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ucp_router)


# ─── Tool schema builder ────────────────────────────────────────────────────

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


# ─── /chat SSE endpoint ─────────────────────────────────────────────────────

@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    messages = body.get("messages", [])

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

            # Agentic loop
            # Each tool is allowed to run exactly once. Stop after create_checkout.
            called = set()

            for _turn in range(10):
                t0 = time.time()
                resp = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        tools=tools_config,
                        temperature=0.1,
                    ),
                )
                print(f"[GEMINI] turn={_turn} took {time.time()-t0:.2f}s", flush=True)

                parts = resp.candidates[0].content.parts
                texts = [p.text for p in parts if hasattr(p, "text") and p.text]
                calls = [p.function_call for p in parts
                         if hasattr(p, "function_call") and p.function_call]

                # Stream any text
                if texts:
                    yield f"data: {json.dumps({'type':'text','content':' '.join(texts)})}\n\n"
                    await asyncio.sleep(0)

                # No tool calls — Gemini is done
                if not calls:
                    break

                # Filter to only tools not yet called
                new_calls = [c for c in calls if c.name not in called]

                if not new_calls:
                    # Gemini is trying to repeat tools — stop
                    break

                # Append raw model response (preserves thought_signature for Gemini 3)
                contents.append(resp.candidates[0].content)

                # Execute each new tool call
                tool_results = []
                for call in new_calls:
                    fn   = TOOL_MAP.get(call.name)
                    args = dict(call.args)
                    called.add(call.name)

                    print(f"[TOOL] {call.name}({args})", flush=True)
                    yield f"data: {json.dumps({'type':'tool_call','tool':call.name,'args':args})}\n\n"
                    await asyncio.sleep(0)

                    try:
                        result = fn(**args) if fn else {"error": f"unknown tool: {call.name}"}
                    except Exception as e:
                        result = {"error": str(e)}

                    yield f"data: {json.dumps({'type':'tool_result','tool':call.name,'result':result})}\n\n"
                    await asyncio.sleep(0)

                    tool_results.append({"function_response": {"name": call.name, "response": result}})

                contents.append({"role": "user", "parts": tool_results})

                # After create_checkout — do one final Gemini call to get the summary text, then stop
                if "create_checkout" in called:
                    t0 = time.time()
                    final = client.models.generate_content(
                        model=model,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                            tools=tools_config,
                            temperature=0.1,
                            ),
                    )
                    print(f"[GEMINI] final summary took {time.time()-t0:.2f}s", flush=True)
                    final_parts = final.candidates[0].content.parts
                    final_texts = [p.text for p in final_parts if hasattr(p, "text") and p.text]
                    if final_texts:
                        yield f"data: {json.dumps({'type':'text','content':' '.join(final_texts)})}\n\n"
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
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)