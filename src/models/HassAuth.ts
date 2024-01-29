export type HassAuthCallback = {
	access_token: string;
	token_type: string;
	refresh_token: string;
	expires_in: number;
	ha_auth_provider: string;
}

export type HassRefreshAuthCallback = {
	access_token: string;
	token_type: string;
	expires_in: number;
}

export type HassAuthToken = {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	issued_at: number;
}