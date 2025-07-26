import { useState, useEffect } from 'react';
import {
  Box, CssBaseline, Container, Typography, Avatar, useMediaQuery, useTheme
} from '@mui/material';

// local imports
import ErrorPage from './components/ErrorPage';
import PairingScreen from './components/PairingScreen';
import ErrorBoundary from './middleware/ErrorBoundary';
import ConnectedScreen from './components/ConnectedScreen';
import { useWebSocket } from './utils/useWebSocket';
import { generatePairingKey } from './utils/generatePairingKey';


// Main App component
export default function App() {
  const [myKey, setMyKey] = useState('');
  const [partnerKey, setPartnerKey] = useState('');
  const [connected, setConnected] = useState(false);
  const [incomingFiles, setIncomingFiles] = useState([]);
  const [autoConnectKey, setAutoConnectKey] = useState(null);

  const handleSocketMessage = (data) => {
    if (data.type === 'connected') {
      setPartnerKey(data.partner_id);
      setConnected(true);
    } else if (data.type === 'file_offer') {
      const file = {
        from: data.from,
        name: data.filename,
        size: data.filesize,
        chunks: [],
        receivedSize: 0,
        completed: false
      };
      setIncomingFiles(prev => [...prev, file]);
    } else if (data.type === 'file_chunk') {
      setIncomingFiles(prev => {
        const updated = [...prev];
        const file = updated.find(f => !f.completed && f.from === data.from);
        if (file) {
          file.chunks.push(data.chunk);
          file.receivedSize += atob(data.chunk).length;
        }
        return updated;
      });
    } else if (data.type === 'file_complete') {
      setIncomingFiles(prev => {
        const updated = [...prev];
        const file = updated.find(f => !f.completed && f.from === data.from);
        if (file) file.completed = true;
        return updated;
      });
    } else if (data.type === 'partner_disconnected') {
      alert('Your partner has disconnected.');
      window.location.reload();
    } else if (data.type === 'error') {
      alert(`Error: ${data.message}`);
    }
  };

  const {
    send,
    isConnected,
    sendFileMetadata,
    sendFileChunk,
    completeFileTransfer,
    rejectFile
  } = useWebSocket(myKey, handleSocketMessage);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const partner = params.get('pairingKey');
    if (partner && partner.length === 6) {
      setAutoConnectKey(partner.toUpperCase());
    }
    setMyKey(generatePairingKey());
  }, []);

  useEffect(() => {
    if (isConnected && autoConnectKey) {
      send({ action: 'connect', pairing_key: autoConnectKey });
      setAutoConnectKey(null);
    }
  }, [isConnected, autoConnectKey, send]);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <CssBaseline />
      <Box
        sx={{
          top: 0,
          zIndex: 999,
          gap: '10px',
          padding: '10px',
          display: 'flex',
          position: 'fixed',
          alignItems: 'center',
          left: isSmall ? '50%' : 'auto',
          transform: isSmall ? 'translateX(-50%)' : 'none',
        }}
      >
        <Avatar src="/share.png" alt="Logo" sx={{ width: 40, height: 40 }} />
        <Typography variant="h5" color="primary" fontWeight={600}>
          WhisperShare
        </Typography>
      </Box>
      <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

        {!connected ? (
          <PairingScreen
            pairingKey={myKey}
            onConnect={(k) => send({ action: 'connect', pairing_key: k })}
          />
        ) : (
          <ConnectedScreen
            partnerId={partnerKey}
            sendFileMetadata={sendFileMetadata}
            sendFileChunk={sendFileChunk}
            completeFileTransfer={completeFileTransfer}
            rejectFile={rejectFile}
            incomingFiles={incomingFiles}
          />
        )}
      </Container>
    </ErrorBoundary>
  );
}
