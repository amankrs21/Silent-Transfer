// Generate a random pairing key for device pairing
export const generatePairingKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
    let key = '';
    for (let i = 0; i < 6; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
};
