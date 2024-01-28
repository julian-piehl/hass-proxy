import express from "express";
import routes from "./routes"
import middlewares from "./middlewares";
import session, { MemoryStore } from "express-session";
import envConfig from "./envConfig";

class App {
	public server: express.Express;
	public sessionStore: MemoryStore;

	constructor() {
		this.server = express();

		this.middlewares();
		this.routes();
	}

	middlewares() {
		this.server.use(express.json());

		this.sessionStore = new MemoryStore();
		this.server.use(session({
			cookie: {
				sameSite: 'lax',
			},
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