import axios, { AxiosError, AxiosResponse } from "axios";
import envConfig from "./envConfig";
import { HassAuthCallback, HassAuthToken, HassRefreshAuthCallback } from "./models/HassAuth";
import chalk from "chalk";

const REFRESH_TOKEN_THRESHOLD = 5 * 60 * 1000;

const CLIENT_ID = envConfig.PROXY_HOST;

export const hassAuthURL = `${envConfig.HASS_HOST}/auth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(`${envConfig.PROXY_HOST}/hass-proxy/auth/callback`)}`;

export async function createNewToken(code: string) {
	const formData = new URLSearchParams();
	formData.append('grant_type', 'authorization_code');
	formData.append('code', code);
	formData.append('client_id', CLIENT_ID);

	let hassResponse: AxiosResponse<HassAuthCallback>;
	try {
		hassResponse = await axios.post<HassAuthCallback>(`${envConfig.HASS_HOST}/auth/token`, formData);
	} catch(error) {
		console.log(chalk.red('Could not validate auth callback!'));
		return null;
	}

	const hassAuthToken: HassAuthToken = {
		access_token: hassResponse.data.access_token,
		refresh_token: hassResponse.data.refresh_token,
		expires_in: hassResponse.data.expires_in,
		issued_at: Date.now()
	}

	return hassAuthToken;
}

export function tokenMustBeRefreshed(token: HassAuthToken): boolean {
	return token.issued_at + (token.expires_in * 1000) < Date.now() + REFRESH_TOKEN_THRESHOLD;
}

export async function refreshToken(token: HassAuthToken) {

	const formData = new URLSearchParams();
	formData.append('grant_type', 'refresh_token');
	formData.append('refresh_token', token.refresh_token);
	formData.append('client_id', CLIENT_ID);

	let hassResponse: AxiosResponse<HassRefreshAuthCallback>;
	try {
		hassResponse = await axios.post<HassRefreshAuthCallback>(`${envConfig.HASS_HOST}/auth/token`, formData);
	} catch(error) {
		console.log(chalk.red('Could not refresh token!'));
		return null;
	}

	token.access_token = hassResponse.data.access_token;
	token.expires_in = hassResponse.data.expires_in;
	token.issued_at = Date.now();

	return token;
}