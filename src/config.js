import dotenv from 'dotenv';
import { logger as commonLogger } from './utils';

export const logger = commonLogger.createCustomLogger('Gateway');

dotenv.config({ path: `${process.cwd()}/.env` });

export const GATEWAY_PORT = process.env['GATEWAY_PORT'];
export const CORS_ORIGINS = process.env['CORS_ORIGINS'];
export const PRIMARY_HOST = process.env['PRIMARY_HOST'];
export const JWT_SECRET = process.env['JWT_SECRET'];
