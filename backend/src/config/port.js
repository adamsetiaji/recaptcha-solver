import { networkInterfaces } from 'os';

const DEFAULT_PORT = 3000;

export const getBackendPort = async () => {
  try {
    // Get the local IP address
    const nets = networkInterfaces();
    const results = [];
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          results.push(net.address);
        }
      }
    }

    // Use the first available IP address
    const localIP = results[0] || 'localhost';
    console.log(`Local IP address: ${localIP}`);
    
    return DEFAULT_PORT;
  } catch (error) {
    console.error('Error getting backend port:', error);
    return DEFAULT_PORT;
  }
};

export const getFrontendPort = () => {
  return 5173; // Default Vite development port
};