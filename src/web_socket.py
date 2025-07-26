import uuid
from fastapi import WebSocket, WebSocketDisconnect

# Local imports
from .pairing_manager import PairingManager


# Pairing manager instance
manager = PairingManager()

file_buffers = {}
active_connections = {}

# WebSocket endpoint
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_id = str(uuid.uuid4())
    active_connections[client_id] = websocket

    current_pairing_key = None

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            pairing_key = data.get("pairing_key")

            # === Pairing Logic ===
            if action == "register":
                manager.register(pairing_key, client_id)
                current_pairing_key = pairing_key
                await websocket.send_json({"type": "registered", "message": "Pairing key registered."})

            elif action == "connect":
                if manager.check_pair(pairing_key):
                    partner_id = manager.get_client(pairing_key)
                    partner_ws = active_connections.get(partner_id)
                    if partner_ws:
                        await partner_ws.send_json({
                            "type": "connected",
                            "partner_id": client_id
                        })
                        await websocket.send_json({
                            "type": "connected",
                            "partner_id": partner_id
                        })

                        # Track mutual connection
                        manager.pair_clients(client_id, partner_id)
                        current_pairing_key = pairing_key
                else:
                    await websocket.send_json({"type": "error", "message": "Invalid pairing key."})


            # === File Transfer Logic ===
            elif action == "send_file":
                partner_id = data.get("partner_id")
                filename = data.get("filename")
                filesize = data.get("filesize")

                partner_ws = active_connections.get(partner_id)
                if partner_ws:
                    await partner_ws.send_json({
                        "type": "file_offer",
                        "from": client_id,
                        "filename": filename,
                        "filesize": filesize
                    })

            elif action == "file_chunk":
                partner_id = data.get("partner_id")
                chunk = data.get("chunk")  # base64 encoded

                partner_ws = active_connections.get(partner_id)
                if partner_ws:
                    await partner_ws.send_json({
                        "type": "file_chunk",
                        "from": client_id,
                        "chunk": chunk
                    })

            elif action == "file_complete":
                partner_id = data.get("partner_id")
                partner_ws = active_connections.get(partner_id)
                if partner_ws:
                    await partner_ws.send_json({
                        "type": "file_complete",
                        "from": client_id
                    })

            elif action == "reject_file":
                sender_id = data.get("sender_id")
                sender_ws = active_connections.get(sender_id)
                if sender_ws:
                    await sender_ws.send_json({
                        "type": "file_rejected"
                    })

    except WebSocketDisconnect:
        active_connections.pop(client_id, None)

        partner_id = manager.get_partner(client_id)
        if partner_id:
            partner_ws = active_connections.get(partner_id)
            if partner_ws:
                try:
                    await partner_ws.send_json({
                        "type": "partner_disconnected",
                        "message": "Your partner has disconnected."
                    })
                except Exception as e:
                    print(f"Failed to notify partner: {e}")

        # Clean up all mapping
        manager.remove_pairing(client_id)
