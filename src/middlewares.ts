import { Router } from "express";
import httpProxy from "http-proxy";
import services from "./services";

const router = Router();

router.use((req, res, next) => {
	if(req.path.startsWith('/hass-proxy/auth/')) {
		return next();
	}

	if(!req.session.hassAuth) {
		if(req.path.endsWith('manifest.json')) {
			return res.status(503).json({ error: 'manifest_credentials', error_description: 'manifest.json needs \'crossorigin="use-credentials"\' to work. https://developers.google.com/web/fundamentals/web-app-manifest/'});
		}
		return res.redirect('/hass-proxy/auth/authorize');
	}
	return next();

});

const proxy = httpProxy.createProxyServer({ ws: true });

router.use((req, res, next) => {
	if(req.path.startsWith('/hass-proxy/')) {
		return next();
	}

	if(!req.session.activeService) {
		return res.status(404).json({ error: 'no_service_selected' });
	}

	let url: string = services[req.session.activeService].url;
	// if(req.headers.connection == 'Upgrade') {
	// 	url = url.replace('http', 'ws');
	// }
	
	return proxy.web(req, res, { target: url });
});

export default router;