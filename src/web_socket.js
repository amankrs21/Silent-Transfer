const { v4: uuidv4 } = require('uuid');
const PairingManager = require('./pairing_manager');

// PairingManager instance
const manager = new PairingManager();

// Active WebSocket connections
const activeConnections = {};

// WebSocket handler function
function websocketHandler(ws) {
    const clientId = uuidv4();
    activeConnections[clientId] = ws;
    let currentPairingKey = null;

    ws.on('message', (msg) => {
        let data;
        try { data = JSON.parse(msg); } catch { return; }

        const { action, pairing_key, partner_id, filename, filesize, chunk, sender_id } = data;

        if (action === 'register') {
            manager.register(pairing_key, clientId);
            currentPairingKey = pairing_key;
            ws.send(JSON.stringify({ type: 'registered', message: 'Pairing key registered.' }));

        } else if (action === 'connect') {
            if (manager.checkPair(pairing_key)) {
                const partnerId = manager.getClient(pairing_key);
                const partnerWs = activeConnections[partnerId];
                if (partnerWs) {
                    partnerWs.send(JSON.stringify({ type: 'connected', partner_id: clientId }));
                    ws.send(JSON.stringify({ type: 'connected', partner_id: partnerId }));
                    manager.pairClients(clientId, partnerId);
                    currentPairingKey = pairing_key;
                }
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid pairing key.' }));
            }

        } else if (action === 'send_file') {
            const pw = activeConnections[partner_id];
            if (pw) {
                pw.send(JSON.stringify({
                    type: 'file_offer', from: clientId, filename, filesize
                }));
            }

        } else if (action === 'file_chunk') {
            const pw = activeConnections[partner_id];
            if (pw) {
                pw.send(JSON.stringify({
                    type: 'file_chunk', from: clientId, chunk
                }));
            }

        } else if (action === 'file_complete') {
            const pw = activeConnections[partner_id];
            if (pw) {
                pw.send(JSON.stringify({ type: 'file_complete', from: clientId }));
            }

        } else if (action === 'reject_file') {
            const senderWs = activeConnections[sender_id];
            if (senderWs) {
                senderWs.send(JSON.stringify({ type: 'file_rejected' }));
            }

        } else if (action === 'partner_disconnected') {
            const partner = manager.getPartner(clientId);
            if (partner) {
                const pw = activeConnections[partner];
                if (pw) {
                    pw.send(JSON.stringify({ type: 'partner_disconnected', message: 'Your partner has disconnected.' }));
                }
            }
            manager.removePairing(clientId);
            ws.close();
        }
    });

    ws.on('close', () => {
        delete activeConnections[clientId];
        const partner = manager.getPartner(clientId);
        if (partner) {
            const pw = activeConnections[partner];
            if (pw) {
                pw.send(JSON.stringify({ type: 'partner_disconnected', message: 'Your partner has disconnected.' }));
            }
        }
        manager.removePairing(clientId);
    });
}

module.exports = websocketHandler;
