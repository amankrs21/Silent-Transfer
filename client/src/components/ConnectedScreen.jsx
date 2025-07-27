import { useState } from 'react';
import {
    Container, Card, Typography, Button, Grid, IconButton, Tooltip,
    LinearProgress, List, ListItem, ListItemText, ListItemIcon, Alert, Box
} from '@mui/material';
import {
    Logout, CloudUpload, CloudDone, CloudDownload, Send as SendIcon, WarningAmber
} from '@mui/icons-material';

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ConnectedScreen = ({
    partnerId,
    sendFileMetadata,
    sendFileChunk,
    completeFileTransfer,
    incomingFiles,
}) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [sentFiles, setSentFiles] = useState([]);
    const [sendProgress, setSendProgress] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const [fileError, setFileError] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setFileError(`❌ File exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setFileError('');
            setSendProgress(0);
        }
    };

    const sendFile = () => {
        if (!selectedFile || !partnerId) {
            alert("Please select a file.");
            return;
        }

        const chunkSize = 64 * 1024;
        const reader = new FileReader();
        let offset = 0;

        const metadataSent = sendFileMetadata(partnerId, selectedFile);
        if (metadataSent === false) {
            alert("Not connected to server. Please try again later.");
            window.location.reload();
            return;
        }
        setIsSending(true);

        const readChunk = () => {
            const slice = selectedFile.slice(offset, offset + chunkSize);
            reader.readAsArrayBuffer(slice);
        };

        reader.onload = (e) => {
            const base64Chunk = btoa(
                String.fromCharCode(...new Uint8Array(e.target.result))
            );
            sendFileChunk(partnerId, base64Chunk);
            offset += chunkSize;
            const progress = Math.min((offset / selectedFile.size) * 100, 100);
            setSendProgress(progress);

            if (offset < selectedFile.size) {
                readChunk();
            } else {
                completeFileTransfer(partnerId);
                setSentFiles(prev => [...prev, selectedFile.name]);
                setSelectedFile(null);
                setSendProgress(0);
                setIsSending(false);
            }
        };

        readChunk();
    };

    const downloadFile = (file) => {
        const byteArrays = file.chunks.map(chunk =>
            new Uint8Array(atob(chunk).split("").map(char => char.charCodeAt(0)))
        );
        const blob = new Blob(byteArrays);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h5" align="center" gutterBottom>
                ✅ <strong>Connected to:</strong> {partnerId}
            </Typography>

            <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                <Grid item xs={12} md={5}>
                    <Button
                        fullWidth
                        color='error'
                        variant="contained"
                        startIcon={<Logout />}
                        onClick={() => window.location.reload()}
                        sx={{ height: '42px', fontWeight: 600 }}
                    >
                        Disconnect
                    </Button>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Button
                        fullWidth
                        component="label"
                        variant="contained"
                        startIcon={<CloudUpload />}
                        sx={{ height: '42px', fontWeight: 600 }}
                    >
                        Choose File
                        <input type="file" hidden onChange={handleFileChange} />
                    </Button>
                </Grid>
            </Grid>

            <Box mt={1} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                    ⚠️ Maximum file size allowed: <strong>{MAX_FILE_SIZE_MB}MB</strong>
                </Typography>
            </Box>

            {fileError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    <WarningAmber fontSize="small" sx={{ mr: 1 }} /> {fileError}
                </Alert>
            )}

            {selectedFile && (
                <Card variant="outlined" sx={{ mt: 3, p: 2 }}>
                    <Typography variant="subtitle1" align="center" gutterBottom>
                        Selected: <strong>{selectedFile.name}</strong> ({Math.round(selectedFile.size / 1024)} KB)
                    </Typography>
                    <Box textAlign="center">
                        <Button
                            color="primary"
                            variant="contained"
                            onClick={sendFile}
                            endIcon={<SendIcon />}
                            disabled={isSending}
                        >
                            Send File
                        </Button>
                    </Box>
                    {isSending && (
                        <LinearProgress
                            variant="determinate"
                            value={sendProgress}
                            sx={{ mt: 2 }}
                        />
                    )}
                </Card>
            )}

            {sentFiles.length > 0 && (
                <Card variant="outlined" sx={{ mt: 3, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        📤 Sent Files
                    </Typography>
                    <List dense>
                        {sentFiles.map((file, i) => (
                            <ListItem key={i}>
                                <ListItemIcon><CloudDone color="success" /></ListItemIcon>
                                <ListItemText
                                    primary={file.length > 50 ? file.slice(0, 50) + '...' : file}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Card>
            )}

            {incomingFiles && incomingFiles.length > 0 && (
                <Card variant="outlined" sx={{ mt: 3, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        📥 Received Files
                    </Typography>
                    <List dense>
                        {incomingFiles.map((file, index) => (
                            <ListItem
                                key={index}
                                secondaryAction={
                                    file.completed && (
                                        <Tooltip title="Download File">
                                            <IconButton color='primary' onClick={() => downloadFile(file)}>
                                                <CloudDownload />
                                            </IconButton>
                                        </Tooltip>
                                    )
                                }
                            >
                                <ListItemText
                                    primary={`${file.name.length > 40
                                        ? file.name.slice(0, 40) + '...'
                                        : file.name
                                        } (${Math.round(file.size / 1024)} KB)`}
                                    secondary={file.completed ? "✅ Completed" : "Receiving..."}
                                />
                                {!file.completed && (
                                    <LinearProgress
                                        variant="determinate"
                                        value={(file.receivedSize / file.size) * 100}
                                        sx={{ width: '100%' }}
                                    />
                                )}
                            </ListItem>
                        ))}
                    </List>
                </Card>
            )}
        </Container>
    );
};

export default ConnectedScreen;
