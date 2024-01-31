import express from "express";
import routes from "./routes"
import middlewares from "./middlewares";
import session, { MemoryStore, Store } from "express-session";
import envConfig from "./envConfig";
import { Redis } from "ioredis";
import RedisStore from "connect-redis";
import chalk from "chalk";
import services from "./services";
import { IncomingMessage, Server, ServerResponse, createServer } from "http";
import Health from "./health";
import httpProxy from "http-proxy";
import { tokenMustBeRefreshed } from "./hassOauth";

export default class App {
	public express: express.Express;
	public sessionStore: Store | MemoryStore;
	public redis?: Redis;
	public server: Server<typeof IncomingMessage, typeof ServerResponse>;
	public health: Health;

	private redisReady = false;

	private async setupSessionStore() {
		if(!envConfig.REDIS_ENABLE) {
			console.log(`${chalk.blue('Setting up Session Store')} - ${chalk.magenta('Memory')}`);

			this.sessionStore = new MemoryStore();
			return;
		}

		console.log(`${chalk.blue('Setting up Session Store')} - ${chalk.magenta('Redis')}`);

		this.redis = new Redis({
			host: envConfig.REDIS_HOST,
			port: envConfig.REDIS_PORT,
			password: envConfig.REDIS_PASSWORD.length > 0 ? envConfig.REDIS_PASSWORD : undefined,
			lazyConnect: true,
		});

		this.redis.on('error', (error) => {
			if(error.message.startsWith('connect ECONNREFUSED')) {
				console.log(`${chalk.bgRed("Couldn't reach Redis. Please check your configuration")}`);
				process.exit(1);
			} else if(error.message === 'ERR invalid password') {
				console.log(`${chalk.bgRed("The Redis password seems to be wrong. Please check your configuration")}`);
				process.exit(1);
			}
		});

		await this.redis.connect();

		this.sessionStore = new RedisStore({
			client: this.redis,
			prefix: "hass-proxy:",
		}) as Store;

		this.sessionStore.all((err, obj) => {
			if(err)
				throw err;

			console.log(`Restored Sessions: ${chalk.magenta(Object.keys(obj).length)}`);
			this.redisReady = true;
		});
	}

	private middlewares() {
		this.express.use(express.json());

		this.express.set('trust proxy', 1);
		this.express.use(/^\/(?!manifest.json|hass-proxy\/health).*/, session({
			cookie: {
				sameSite: 'lax',
			},
			name: 'hass-proxy.sid',
			store: this.sessionStore,
			secret: envConfig.SECRET,
			resave: true,
			saveUninitialized: true 
		}));

		this.express.use(middlewares);
	}

	private handleWebsockets() {
		const parseCookie = (str: any) =>
		str
			.split(';')
			.map((v: any) => v.split('='))
			.reduce((acc: any, v: any) => {
			acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
			return acc;
			}, {});

	const proxy = httpProxy.createProxyServer({ ws: true });
	this.server.on('upgrade', (req, socket, head) => {
		if(req.headers.cookie === "") {
			return socket.destroy();
		}

		let sid: string = parseCookie(req.headers.cookie)['hass-proxy.sid'];
		sid = sid.substring(sid.indexOf(':') + 1, sid.indexOf('.'));
		if(!sid) {
			return socket.destroy();
		}

		this.sessionStore.get(sid, (err, obj) => {
			if(err)  {
				return socket.destroy();
			}
			
			if(!obj || !obj.hassAuth || !obj.activeService)  {
				return socket.destroy();
			}

			if(tokenMustBeRefreshed(obj.hassAuth)) {
				return socket.destroy();
			}

			return proxy.ws(req, socket, head, { target: services[obj.activeService].url });
		});
	});
	}

	private routes() {
		this.express.use(routes);
	}

	public async startServer() {
		console.log(`Starting Server...`);
		console.log(`Available Services: ${chalk.magenta(Object.keys(services).length)}`);
		
		this.express = express();

		await this.setupSessionStore();

		this.middlewares();
		this.routes();

		this.server = createServer(this.express);

		this.handleWebsockets();

		this.health = new Health(this);
		this.health.create();

		let retries = 0;
		const startWebserver = () => {
			if(envConfig.REDIS_ENABLE && !this.redisReady) {
				retries++;
				if(retries >= 10) {
					console.log(chalk.bgRed('Redis connection failed!'));
					process.exit(1);
				}
				console.log(chalk.yellow('Waiting for Redis...'));
				setTimeout(startWebserver, 3000);
				return;
			}

			this.server.listen(envConfig.PORT, () => {
				console.log(chalk.green(`Server up and listening.`) + `\nPort: ${envConfig.PORT}\nURL: ${envConfig.PROXY_HOST}`);
			});
		}
		startWebserver();
	}
}
