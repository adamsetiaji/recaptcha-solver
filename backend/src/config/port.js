import dotenv from 'dotenv';

dotenv.config();

export const BACKEND_PORT = process.env.BACKEND_PORT || 3000;
export const VNC_PORT = process.env.VNC_PORT || 5900;