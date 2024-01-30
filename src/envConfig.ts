import dotenv from "dotenv";
import { CleanedEnv, EnvError, bool, cleanEnv, host, makeValidator, port, str } from "envalid";

dotenv.config();

const baseUrl = makeValidator<string>((input: string) => {
	if(/^https?:\/\/[-a-zA-Z0-9:._]+\/?$/.test(input)) {
		if(input.endsWith('/')) return input.substring(0, input.length - 1);
		return input;
	}

	throw new EnvError(`Invalid BaseURL: "${input}"`)
})

export default cleanEnv(process.env, {
	HASS_HOST: baseUrl({ desc: 'URL of the Homeassistant instance including http(s)', example: 'http://homeassistant.local' }),
	PROXY_HOST: baseUrl({ desc: 'URL of the Proxy including http(s)', example: 'http://homeassistant.local:3333' }),
	SECRET: str( {desc: 'Secret for data encoding (random string)', example: 'MY_SUPER_SECRET' }),
	PORT: port({ desc: 'Port for serving the web frontend', example: '3333', default: 3333 }),

	REDIS_ENABLE: bool({ desc: 'Enable Redis for Session Storage (recommended)', default: true }),
	REDIS_HOST: host({ desc: 'Redis Hostname or IP Address', example: '127.0.0.1', default: 'redis' }),
	REDIS_PORT: port({ desc: 'Redis Port', example: '6379', default: 6379 }),
	REDIS_PASSWORD: str({ desc: 'Redis Password', example: 'CatS', default: '' }),
});
