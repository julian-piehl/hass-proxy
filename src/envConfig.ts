import dotenv from "dotenv";
import { CleanedEnv, EnvError, cleanEnv, makeValidator, port, str } from "envalid";

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
	PORT: port({ desc: 'Port for serving the web frontend', example: '3333', default: 3333 })
});
