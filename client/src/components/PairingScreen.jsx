import { useState } from 'react';
import {
    Container, TextField, Button, Typography, useMediaQuery
} from '@mui/material';
import { QRCode } from 'react-qrcode-logo';
import { useTheme } from '@mui/material/styles';
import { Login as LoginIcon } from '@mui/icons-material';


// PairingScreen component
const PairingScreen = ({ pairingKey, onConnect }) => {
    const [inputKey, setInputKey] = useState('');

    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const barCodeValue = `${window.location.href}?pairingKey=${pairingKey}`;

    const onPairingKeySend = (key) => {
        if (!key || key.length !== 6) return;
        if (key === pairingKey) {
            alert('You cannot connect to yourself!');
        } else {
            onConnect(key);
        }
    };

    return (
        <Container sx={{ mt: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant='h5' textAlign='center'>
                Your Pairing Key:<br />
                <strong>{pairingKey}</strong>
            </Typography>

            <QRCode
                size={isSmall ? 180 : 256}
                value={barCodeValue}
            />

            <TextField
                margin='normal'
                value={inputKey}
                label="Enter Partner's Pairing Key"
                placeholder='6-character pairing key'
                inputProps={{ maxLength: 6 }}
                sx={{ minWidth: isSmall ? 250 : 300 }}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onPairingKeySend(inputKey);
                    }
                }}
            />

            <Button
                fullWidth
                variant="contained"
                endIcon={<LoginIcon />}
                disabled={inputKey.length !== 6}
                onClick={() => onPairingKeySend(inputKey)}
                sx={{ maxWidth: 250 }}
            >
                Connect
            </Button>
        </Container>
    );
};

export default PairingScreen;
