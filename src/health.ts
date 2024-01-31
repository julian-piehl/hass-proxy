import chalk from "chalk";
import App from "./app";
import { HealthCheck, HealthCheckError, createTerminus } from "@godaddy/terminus";
import axios, { AxiosError } from "axios";
import envConfig from "./envConfig";

let test = 0;

export default class Health {
	private readonly app: App;
	public healthchecks: (() => Promise<any>)[] = [];

	constructor(app: App) {
		this.app = app;
	}

	private onSignal() {
		console.log(chalk.yellow('Stopping Application...'));
		return envConfig.REDIS_ENABLE ? this.app.redis.quit() : Promise.resolve();
	}

	public create() {

		this.healthchecks.push(async () => {
			if(this.app.redis.status !== "ready") {
				throw new HealthCheckError('Redis connection problems!', { status: this.app.redis.status });
			}
		});

		this.healthchecks.push(async () => {
			try {
				await axios.get(envConfig.HASS_HOST);
			} catch(error) {
				throw new HealthCheckError('Homeassistant not reachable!', null);
			}
		});

		createTerminus(this.app.server, {
			healthChecks: {
				'/hass-proxy/health': () => {
					const errors: Error[] = [];
					return Promise.all(this.healthchecks.map(check => check().catch((error: Error) => {
						errors.push(error);
						return undefined;
					}))).then(() => {
						if(errors.length) {
							throw new HealthCheckError('healthcheck failed', errors);
						}
					})
				},
				verbatim: true,
			},
			onSignal: this.onSignal
		})
	}
}