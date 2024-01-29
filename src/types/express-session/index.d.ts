import { HassAuthToken } from '../../models/HassAuth';


declare global {
	namespace Express {
		interface SessionData {
			hassAuth?: HassAuthToken;
			activeService?: string;
			redirectPath?: string;
		}
	}
}