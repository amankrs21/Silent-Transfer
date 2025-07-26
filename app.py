import os
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from starlette.routing import WebSocketRoute
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse

# Local imports
from src.web_socket import websocket_endpoint


# Setup FastAPI app
app = FastAPI()

# CORS Config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check route
@app.get("/health")
async def health_check():
    return JSONResponse({"status": "ok"}, status_code=200)


# Add WebSocket route manually
app.router.routes.append(
    WebSocketRoute("/ws", websocket_endpoint)
)

"""---------------- Use this section to serve static files if needed.----------------"""
# Serve static React build files
build_path = os.path.join(os.path.dirname(__file__), "client/dist")
app.mount("/static", StaticFiles(directory=build_path), name="static")

# Serve index.html for non-API, non-static routes
@app.get("/{full_path:path}")
async def serve_react(request: Request, full_path: str):
    if "." in full_path:  # likely a static file like .js or .css that was missed
        file_path = os.path.join(build_path, full_path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return JSONResponse({"error": "File not found"}, status_code=404)

    # fallback to index.html for React Router or unknown paths
    return FileResponse(os.path.join(build_path, "index.html"))
"""------------------------------------------------------------------------------------"""

# 404 handler
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception):
    return JSONResponse({"error": "Not found"}, status_code=404)


# 500 handler
@app.exception_handler(Exception)
async def server_error_handler(request: Request, exc: Exception):
    return JSONResponse({"error": "Internal server error"}, status_code=500)


# Uvicorn entrypoint
if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("app:app", host=host, port=port, reload=True)


"""
------------ HOSTING NOTES ------------
SETUP BELOW COMMAND IN THE STARTUP SCRIPT OF THE SERVER
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app
"""