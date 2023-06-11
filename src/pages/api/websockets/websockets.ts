import { NextApiHandler } from 'next';
import WebSocket, { AddressInfo } from 'ws';
import url from 'url';

// Create WebSocket Server outside of handler
let wsServer: WebSocket.Server | null = null;

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler: NextApiHandler = (req, res) => {
    if (wsServer === null) {
        wsServer = new WebSocket.Server({ noServer: true });

        wsServer.on('connection', (ws, request) => {
            const { serviceName, namespace } = url.parse(request.url || '', true).query;
            const wsURL = `ws://service-${serviceName}.${namespace}.svc.cluster.local:80`;
            const terminalServerConnection = new WebSocket(wsURL);

            terminalServerConnection.on('message', (data) => {
                ws.send(data);
            });

            ws.on('message', (data) => {
                terminalServerConnection.send(data);
            });

            ws.on('close', () => {
                terminalServerConnection.close();
            });

            terminalServerConnection.on('close', () => {
                ws.close();
            });
        });
    }

    if (!res.socket) {
      res.status(500).send('Could not upgrade the connection to WebSocket, no socket available.');
      return;
    }

    wsServer.handleUpgrade(req, res.socket, Buffer.alloc(0), function done(ws) {
        wsServer?.emit('connection', ws, req);
    });

    res.status(200).send("yeah");
}

export default handler;
