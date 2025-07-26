const { v4: uuidv4 } = require('uuid');


class PairingManager {
    constructor() {
        this.sessions = {};
        this.reverse = {};
        this.paired = {};
    }

    generatePairingKey() {
        return uuidv4().slice(0, 6).toUpperCase();
    }

    register(pairingKey, clientId) {
        this.sessions[pairingKey] = clientId;
        this.reverse[clientId] = pairingKey;
    }

    checkPair(pairingKey) {
        return pairingKey in this.sessions;
    }

    getClient(pairingKey) {
        return this.sessions[pairingKey];
    }

    pairClients(a, b) {
        this.paired[a] = b;
        this.paired[b] = a;
    }

    getPartner(clientId) {
        return this.paired[clientId];
    }

    removePairing(clientId) {
        const partner = this.paired[clientId];
        if (partner) {
            delete this.paired[partner];
            delete this.paired[clientId];
        }
        const key = this.reverse[clientId];
        if (key) {
            delete this.sessions[key];
            delete this.reverse[clientId];
        }
    }
}

module.exports = PairingManager;
