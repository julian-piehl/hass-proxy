import { Router } from "express";
import httpProxy from "http-proxy";
import services from "./services";
import { refreshToken, tokenMustBeRefreshed } from "./hassOauth";

const router = Router();

router.use(/^\/manifest.json/, (req, res, next) => {
	return res.status(503).json({ error: 'manifest_credentials', error_description: 'manifest.json needs \'crossorigin="use-credentials"\' to work. https://developers.google.com/web/fundamentals/web-app-manifest/'});
});

router.use(async (req, res, next) => {
	if(req.path.startsWith('/hass-proxy/auth/')) {
		return next();
	}

	if(!req.session.hassAuth && (req.path.startsWith('/hass-proxy/services/') || req.session.activeService)) {
		req.session.redirectPath = req.path;
		return res.redirect('/hass-proxy/auth/authorize');
	}

	if(req.session.hassAuth && tokenMustBeRefreshed(req.session.hassAuth)) {
		req.session.hassAuth = await refreshToken(req.session.hassAuth);
		if(!req.session.hassAuth) {
			return res.redirect('/hass-proxy/auth/authorize');
		}
	}

	return next();

});

const proxy = httpProxy.createProxyServer({ ws: true });

router.use((req, res, next) => {
	if(req.path.startsWith('/hass-proxy/')) {
		return next();
	}

	if(!req.session.hassAuth || !req.session.activeService) {
		if(req.path === '/style.css') {
			return next();
		}
			
		return res.status(404).sendFile(__dirname + '/public/index.html');
	}

	return proxy.web(req, res, { target: services[req.session.activeService].url });
});

export default router;