import express from "express";
import routes from "./routes"
import middlewares from "./middlewares";
import session, { MemoryStore, Store } from "express-session";
import envConfig from "./envConfig";
import { Redis } from "ioredis";
import RedisStore from "connect-redis";
import chalk from "chalk";
import services from "./services";

class App {
	public server: express.Express;
	public sessionStore: Store | MemoryStore;
	public redis?: Redis;

	constructor() {
		console.log(`Starting Server...`);
		console.log(`Available Services: ${chalk.magenta(Object.keys(services).length)}`);
		
		this.server = express();

		this.setupSessionStore();

		this.middlewares();
		this.routes();
	}

	setupSessionStore() {
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

		this.redis.connect();

		this.sessionStore = new RedisStore({
			client: this.redis,
			prefix: "hass-proxy:",
		}) as Store;

		this.sessionStore.all((err, obj) => {
			if(err)
				throw err;

			console.log(`Restored Sessions: ${chalk.magenta(Object.keys(obj).length)}`);
		})
	}

	middlewares() {
		this.server.use(express.json());

		this.server.set('trust proxy', 1);
		this.server.use(/^\/(?!manifest.json).*/, session({
			cookie: {
				sameSite: 'lax',
			},
			name: 'hass-proxy.sid',
			store: this.sessionStore,
			secret: envConfig.SECRET,
			resave: true,
			saveUninitialized: true 
		}));

		this.server.use(middlewares);
	}

	routes() {
		this.server.use(routes);
	}
}

export default new App();