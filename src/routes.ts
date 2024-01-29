import axios, { AxiosError } from "axios";
import { Router } from "express";
import { HassAuthCallback } from "./models/HassAuth";
import envConfig from "./envConfig";
import services from "./services";
import { createNewToken, hassAuthURL } from "./hassOauth";

const routes = Router();

routes.get('/style.css', (req, res) => {
	return res.sendFile(__dirname + '/public/output.css');
})

routes.get('/hass-proxy/services/:appName', (req, res) => {
	if(!req.params.appName) {
		return res.status(400).json({ error: 'appname_missing' });
	}

	if(!services[req.params.appName]) {
		return res.status(400).json({ error: 'appname_unknown' });
	}

	req.session.activeService = req.params.appName;
	return res.redirect('/');
})

routes.get('/hass-proxy/auth/authorize', (req, res) => {
	res.redirect(hassAuthURL);
})


routes.get('/hass-proxy/auth/callback', async (req, res) => {
	if(!req.query.code) {
		return res.status(401).json({ error: 'code_missing' });
	}

	const hassAuthData = await createNewToken(req.query.code as string);

	if(!hassAuthData) {
		return res.status(400).json({ error: 'code_invalid', error_description: 'Could not validate against Homeassistant'});
	}

	req.session.hassAuth = hassAuthData;

	if(req.session.redirectPath) {
		const path = req.session.redirectPath;
		req.session.redirectPath = null;
		return res.redirect(path);
	}
	
	return res.redirect('/');
});

export default routes;