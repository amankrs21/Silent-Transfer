const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const websocketHandler = require('./src/web_socket');

// Initialize Express app
const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// === Safe static file serving ===
try {
    const buildPath = path.join(__dirname, 'client', 'dist');
    if (fs.existsSync(buildPath) && fs.existsSync(path.join(buildPath, 'index.html'))) {
        app.use(express.static(buildPath));

        // React Router fallback
        app.get(/^\/(?!api|ws).*/, (req, res) => {
            res.sendFile(path.join(buildPath, 'index.html'));
        });

    } else {
        console.warn('⚠️ React build not found. Skipping static file serving.');
    }
} catch (error) {
    console.error('Error serving static files:', error);
}


// WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });
wss.on('connection', websocketHandler);

// Error handling
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server listening at http://localhost:${PORT}`));
