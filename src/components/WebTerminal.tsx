import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { io } from "socket.io-client";

interface WebTerminalProps {
  ingressPath: string;
  onClose: () => void;
}

const WebTerminal: React.FC<WebTerminalProps> = ({ ingressPath, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const socket = useRef<any>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminal.current = new Terminal();
      const fitAddon = new FitAddon();
      terminal.current.loadAddon(fitAddon);

      terminal.current.open(terminalRef.current);
      fitAddon.fit();

      const appUrl = window.location.hostname === 'localhost' ? 'ws://localhost:3000' : `wss://${window.location.hostname}${ingressPath}`;

      // Initialize socket.io connection
      socket.current = io(appUrl);

      socket.current.on('connect', () => {
        console.log('Connected to socket.io server');
      });

      socket.current.on('reply', (data: any) => {
        terminal.current?.write(data);
      });

      terminal.current.onData(data => {
        socket.current.emit('message', data);
      });

      socket.current.on('disconnect', () => {
        console.log('Disconnected from socket.io server');
      });
    }

    return () => {
      terminal.current?.dispose();
      socket.current?.disconnect();
      onClose();
    };
  }, [ingressPath, onClose]);

  return <div ref={terminalRef} />;
};

export default WebTerminal;
