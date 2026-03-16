import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket;

export const initiateSocketConnection = () => {
    socket = io(SOCKET_URL);
    console.log(`Connecting socket...`);
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if(socket) socket.disconnect();
}
