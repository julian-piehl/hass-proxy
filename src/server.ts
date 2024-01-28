import envConfig from "./envConfig";
import app from "./app";
import "./services";
import { createServer } from "http";
import httpProxy from "http-proxy";
import services from "./services";

const server = createServer(app.server);

const parseCookie = (str: any) =>
  str
    .split(';')
    .map((v: any) => v.split('='))
    .reduce((acc: any, v: any) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});

const proxy = httpProxy.createProxyServer({ ws: true });
server.on('upgrade', (req, socket, head) => {
	if(req.headers.cookie === "") {
		return socket.destroy();
	}

	let sid: string = parseCookie(req.headers.cookie)['connect.sid'];
	sid = sid.substring(sid.indexOf(':') + 1, sid.indexOf('.'));
	if(!sid) {
		return socket.destroy();
	}

	app.sessionStore.get(sid, (err, obj) => {
		if(!err && obj && obj.hassAuth) {
			return proxy.ws(req, socket, head, { target: services[obj.activeService].url });
		}
		return socket.destroy();
	});
});

server.listen(envConfig.PORT);
