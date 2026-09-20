const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

const userDirectory = new Map(); 
const activeSockets = new Map(); 
const userContacts = new Map();  

wss.on('connection', (ws) => {
    let currentUser = null;

    ws.on('message', (rawMessage) => {
        try {
            const data = JSON.parse(rawMessage.toString());

            switch (data.type) {
                case 'register':
                    currentUser = data.username;
                    userDirectory.set(currentUser, { publicKey: data.publicKey });
                    activeSockets.set(currentUser, ws);

                    if (!userContacts.has(currentUser)) {
                        userContacts.set(currentUser, new Set());
                    }

                    ws.send(JSON.stringify({ type: 'registered_success' }));
                    notifyContactsStatusChange(currentUser, true);
                    break;

                case 'add_contact':
                    if (!currentUser) return;
                    const targetUser = data.targetUsername;

                    if (targetUser === currentUser) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Você não pode adicionar a si mesmo.' }));
                        return;
                    }

                    const targetData = userDirectory.get(targetUser);
                    if (!targetData) {
                        ws.send(JSON.stringify({ 
                            type: 'error', 
                            message: `O usuário '${targetUser}' ainda não se conectou.` 
                        }));
                        return;
                    }

                    userContacts.get(currentUser).add(targetUser);
                    if (!userContacts.has(targetUser)) userContacts.set(targetUser, new Set());
                    userContacts.get(targetUser).add(currentUser);

                    const isTargetOnline = activeSockets.has(targetUser);

                    ws.send(JSON.stringify({
                        type: 'contact_added',
                        username: targetUser,
                        publicKey: targetData.publicKey,
                        online: isTargetOnline
                    }));

                    const targetWs = activeSockets.get(targetUser);
                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                        targetWs.send(JSON.stringify({
                            type: 'contact_added',
                            username: currentUser,
                            publicKey: userDirectory.get(currentUser).publicKey,
                            online: true
                        }));
                    }
                    break;

                case 'send_direct_message':
                    if (!currentUser) return;
                    const recipientSocket = activeSockets.get(data.to);

                    if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
                        recipientSocket.send(JSON.stringify({
                            type: 'receive_message',
                            id: data.id,
                            from: currentUser,
                            senderPublicKey: userDirectory.get(currentUser)?.publicKey,
                            ciphertext: data.ciphertext,
                            iv: data.iv
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: `O contato '${data.to}' está offline.`
                        }));
                    }
                    break;

                // Evento: Digitando / Parou de digitar
                case 'typing':
                case 'stop_typing':
                    if (!currentUser) return;
                    const recWs = activeSockets.get(data.to);
                    if (recWs && recWs.readyState === WebSocket.OPEN) {
                        recWs.send(JSON.stringify({
                            type: data.type,
                            from: currentUser
                        }));
                    }
                    break;

                // Evento: Confirmação de Leitura
                case 'message_read':
                    if (!currentUser) return;
                    const origSenderWs = activeSockets.get(data.to);
                    if (origSenderWs && origSenderWs.readyState === WebSocket.OPEN) {
                        origSenderWs.send(JSON.stringify({
                            type: 'message_read',
                            id: data.id,
                            from: currentUser
                        }));
                    }
                    break;
            }
        } catch (err) {
            console.error('Erro no servidor:', err);
        }
    });

    ws.on('close', () => {
        if (currentUser) {
            activeSockets.delete(currentUser);
            notifyContactsStatusChange(currentUser, false);
        }
    });
});

function notifyContactsStatusChange(username, isOnline) {
    const contacts = userContacts.get(username);
    if (!contacts) return;

    contacts.forEach((contactUser) => {
        const contactWs = activeSockets.get(contactUser);
        if (contactWs && contactWs.readyState === WebSocket.OPEN) {
            contactWs.send(JSON.stringify({
                type: 'contact_status_update',
                username: username,
                online: isOnline
            }));
        }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`>>> Servidor Ativo em http://localhost:${PORT}`);
});
