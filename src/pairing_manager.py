import uuid
from typing import Dict


# PairingManager class
class PairingManager:
    def __init__(self):
        self.sessions: Dict[str, str] = {}
        self.reverse: Dict[str, str] = {}
        self.paired: Dict[str, str] = {}

    def generate_pairing_key(self) -> str:
        return str(uuid.uuid4())

    def register(self, pairing_key: str, client_id: str):
        self.sessions[pairing_key] = client_id
        self.reverse[client_id] = pairing_key

    def check_pair(self, pairing_key: str) -> bool:
        return pairing_key in self.sessions

    def get_client(self, pairing_key: str) -> str:
        return self.sessions.get(pairing_key)

    def pair_clients(self, client_a: str, client_b: str):
        self.paired[client_a] = client_b
        self.paired[client_b] = client_a

    def get_partner(self, client_id: str) -> str:
        return self.paired.get(client_id)

    def remove_pairing(self, client_id: str):
        partner = self.paired.pop(client_id, None)
        if partner:
            self.paired.pop(partner, None)

        key = self.reverse.pop(client_id, None)
        if key:
            self.sessions.pop(key, None)
