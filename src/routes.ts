import axios, { AxiosError } from "axios";
import { Router } from "express";
import { HassAuthCallback } from "./models/HassAuth";
import envConfig from "./envConfig";
import services from "./services";

const routes = Router();

routes.get('/hass-proxy/services/:appName', (req, res) => {
	if(!req.params.appName) {
		return res.status(400).json({ error: 'appname_missing' });
	}

	if(!services[req.params.appName]) {
		return res.status(400).json({ error: 'unknown_appname' });
	}

	req.session.activeService = req.params.appName;
	return res.redirect('/');
})

const CLIENT_ID = envConfig.PROXY_HOST;

routes.get('/hass-proxy/auth/authorize', (req, res) => {
	res.redirect(`${envConfig.HASS_HOST}/auth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(`${envConfig.PROXY_HOST}/hass-proxy/auth/callback`)}`);
})


routes.get('/hass-proxy/auth/callback', async (req, res) => {
	if(!req.query.code) {
		return res.status(403).json({ error: 'code_missing' });
	}

	const formData = new URLSearchParams();
	formData.append('grant_type', 'authorization_code');
	formData.append('code', req.query.code as string);
	formData.append('client_id', CLIENT_ID);

	let hassResponse;
	try {
		hassResponse = await axios.post<HassAuthCallback>(`${envConfig.HASS_HOST}/auth/token`, formData);
	} catch(error) {
		if(!(error instanceof AxiosError)) {
			console.log(error);
			return res.status(500).json({ error: 'internal_error' });
		}

		if(error.response) {
			return res.status(error.response.status).json(error.response.data);
		} else {
			console.log(error.request || error.message);
			return res.status(500).json({ error: 'internal_error' });
		}
	}

	req.session.hassAuth = hassResponse.data;

	return res.redirect('/');
});

export default routes;