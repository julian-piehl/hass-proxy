type HassAuthCallback = {
	access_token: string;
	token_type: string;
	refresh_token: string;
	expires_in: number;
	ha_auth_provider: string;
}

export {
	HassAuthCallback
}