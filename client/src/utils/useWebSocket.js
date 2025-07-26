/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (pairingKey, onMessage) => {
    const ws = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        ws.current = new WebSocket('ws://192.168.1.39:5000/ws');

        ws.current.onopen = () => {
            console.log('🟢 WebSocket connected');
            setIsConnected(true);
            if (pairingKey) {
                ws.current.send(JSON.stringify({
                    action: 'register',
                    pairing_key: pairingKey
                }));
            }
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        };

        ws.current.onclose = () => {
            console.log('🔴 WebSocket closed');
            setIsConnected(false);
        };

        return () => {
            ws.current?.close();
        };
    }, [pairingKey]);

    const send = (data) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        }
    };

    const sendFileMetadata = (partnerId, file) => {
        if (ws.current.readyState !== WebSocket.OPEN) {
            return false;
        }
        send({
            action: "send_file",
            partner_id: partnerId,
            filename: file.name,
            filesize: file.size
        });
        return true;
    };

    const sendFileChunk = (partnerId, base64Chunk) => {
        send({
            action: "file_chunk",
            partner_id: partnerId,
            chunk: base64Chunk
        });
    };

    const completeFileTransfer = (partnerId) => {
        send({
            action: "file_complete",
            partner_id: partnerId
        });
    };

    const rejectFile = (senderId) => {
        send({
            action: "reject_file",
            sender_id: senderId
        });
    };

    return {
        send,
        isConnected,
        sendFileMetadata,
        sendFileChunk,
        completeFileTransfer,
        rejectFile
    };
};
