import { SessionData } from "express-session"
import { HassAuthCallback } from '../../models/HassAuth';

declare module 'express-session' {
	export interface SessionData {
		hassAuth: HassAuthCallback;
		activeService: string;
	}
}