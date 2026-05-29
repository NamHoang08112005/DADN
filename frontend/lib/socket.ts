let socket: WebSocket | null = null;
const listeners: ((data: any) => void)[] = [];

export const getSocket = () => {
    if (!socket) {
        socket = new WebSocket("ws://127.0.0.1:8000/ws/device");

        socket.onopen = () => {
            console.log("WS connected (global)");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // broadcast to all subscribers
            listeners.forEach((cb) => cb(data));
        };

        socket.onclose = () => {
            console.log("WS disconnected");
            socket = null;
        };
    }

    return socket;
};

// subscribe function
export const subscribe = (cb: (data: any) => void) => {
    listeners.push(cb);

    return () => {
        const index = listeners.indexOf(cb);
        if (index !== -1) listeners.splice(index, 1);
    };
};
