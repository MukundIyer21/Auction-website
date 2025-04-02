export const BASE_URL = "ws://localhost:3001";

export class SignalingManager {
    constructor(userId) {
        if (SignalingManager.instance) {
            return SignalingManager.instance;
        }

        this.ws = new WebSocket(`${BASE_URL}?user_id=${userId}`);
        this.bufferedMessages = [];
        this.callbacks = {};
        this.id = 1;
        this.initialized = false;
        this.init();

        SignalingManager.instance = this;
    }

    init() {
        this.ws.onopen = () => {
            this.initialized = true;
            this.bufferedMessages.forEach((message) => {
                this.ws.send(JSON.stringify(message));
            });
            this.bufferedMessages = [];
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const type = message.type;

            if (this.callbacks[type]) {
                this.callbacks[type].forEach(({ callback }) => {
                    switch (type) {
                        case "BIDUPDATE":
                            callback(message.price);
                            break;
                        case "TRANSFER":
                            callback(message.item_name, message.item_id, message.price, message.seller);
                            break;
                        default: { }
                    }
                });
            }
        };
    }

    sendMessage(message) {
        const messageToSend = { ...message, id: this.id++ };
        if (!this.initialized) {
            this.bufferedMessages.push(messageToSend);
            return;
        }
        this.ws.send(JSON.stringify(messageToSend));
    }

    registerCallback(type, callback, id) {
        console.log("registering callback");
        this.callbacks[type] = this.callbacks[type] || [];
        this.callbacks[type].push({ callback, id });
    }

    deRegisterCallback(type, id) {
        if (this.callbacks[type]) {
            const index = this.callbacks[type].findIndex((cb) => cb.id === id);
            if (index !== -1) {
                this.callbacks[type].splice(index, 1);
            }
        }
    }

    terminateConnection() {
        if (this.ws) {
            this.ws.close();
            this.initialized = false;
            this.callbacks = {};
            SignalingManager.instance = undefined;
        }
    }
}
