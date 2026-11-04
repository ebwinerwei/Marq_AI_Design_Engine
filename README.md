# Marq Facade Studio — demo source

1. Python 3.9+：`python3 server.py`
2. Open http://127.0.0.1:8080 in Chrome / Edge / Safari with WebGL enabled.
3. No API configuration needed for local rule-based facade design.
4. For real AI, set environment variables OPENAI_API_KEY, OPENAI_MODEL, MARQ_DEMO_TOKEN (24+ chars) before launch. Enter only the demo token in the UI. API billing is through your own account. See dist/proposal.md for limitations and production integration.
5. Imported FBX/GLB stays in the browser. AI receives only intent and current color/pattern params.
6. Standalone static hosting: serve dist/. All runtime Three.js assets are vendored; no CDN required. Do not open index.html via file://.
7. `npm ci && node tests/core.mjs` runs core tests. `python3 -m unittest discover -s tests -p 'test_*.py'` validates backend input boundary. Runtime does not need Node.
8. Tests include a small ASCII FBX cube fixture, not the client's actual warehouse.
9. The demo normalizes model size. GLB export is for appearance; not engineering scale. Save per-wall JSON plus original source model for editing.
10. Current hosted demo has no AI secret/backend. CPU fallback is approximate and no PBR/shadows. WebGL verification on the client's target device is required.

Documents: dist/proposal.html (Chinese implementation proposal), dist/proposal.md, dist/verification.md.
Third party: Three.js r180 MIT, see dist/vendor/THREE-LICENSE.txt and upstream bundled library notices. FBX and GLB loader dependencies are included. Reference images belong to the user/right holders. Logo and brand use is a nonofficial study, not endorsement.
# Marq_AI_Design_Engine
