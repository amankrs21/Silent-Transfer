import { useState } from 'react';
import {
    Container, Card, Typography, Button, Grid, IconButton, Tooltip,
    LinearProgress, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
    Logout, CloudUpload, CloudDone, CloudDownload, Send as SendIcon
} from '@mui/icons-material';


// ConnectedScreen component
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
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
        <Container sx={{ mt: 2 }}>
            <Typography variant="h5" textAlign="center" sx={{ mb: 3 }}>
                <strong>✅ Connected to Partner: </strong><br />{partnerId}
            </Typography>

            <Grid container justifyContent="space-evenly" size={{ xs: 12, md: 12 }} gap={1}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Button
                        fullWidth
                        color='error'
                        component="label"
                        variant="contained"
                        startIcon={<Logout />}
                        onClick={() => window.location.reload()}
                        sx={{ height: '42px', fontSize: '1rem' }}
                    >
                        Disconnect
                    </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Button
                        fullWidth
                        component="label"
                        variant="contained"
                        startIcon={<CloudUpload />}
                        sx={{ height: '42px', fontSize: '1rem' }}
                    >
                        Choose File
                        <input type="file" hidden onChange={handleFileChange} />
                    </Button>
                </Grid>
            </Grid>

            {selectedFile && (
                <Card variant="outlined" sx={{ mt: 2, p: 1, textAlign: 'center' }}>
                    <Typography gutterBottom>
                        {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </Typography>
                    <Button
                        color="primary"
                        variant="outlined"
                        onClick={sendFile}
                        endIcon={<SendIcon />}
                        disabled={isSending}
                    >
                        Send File
                    </Button>
                    {isSending && (
                        <LinearProgress
                            variant="determinate"
                            value={sendProgress}
                            sx={{ mt: 2, width: '100%' }}
                        />
                    )}
                </Card>
            )}

            {sentFiles.length > 0 && (
                <Card variant="outlined" sx={{ mt: 2, p: 1 }}>
                    <Typography variant="h6">📤 Sent Files</Typography>
                    <List>
                        {sentFiles.map((file, i) => (
                            <ListItem key={i}>
                                <ListItemIcon><CloudDone color="success" /></ListItemIcon>
                                <ListItemText
                                    primary={
                                        file.length > 50
                                            ? file.slice(0, 50) + '...'
                                            : file
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Card>
            )}

            {incomingFiles && incomingFiles.length > 0 && (
                <Card variant="outlined" sx={{ mt: 2, p: 1 }}>
                    <Typography variant="h6">📥 Received Files</Typography>
                    <List>
                        {incomingFiles.map((file, index) => (
                            <ListItem key={index} secondaryAction={
                                <Tooltip title="Download File">
                                    {file.completed && (
                                        <IconButton color='primary' onClick={() => downloadFile(file)}>
                                            <CloudDownload />
                                        </IconButton>
                                    )}
                                </Tooltip>
                            }>
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
