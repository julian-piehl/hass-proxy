import YAML from 'yaml';
import * as fs from 'fs';

const isDocker = fs.existsSync('/.dockerenv');
const servicesPath = isDocker ? '/services.yaml' : './services.yaml';

const file = fs.readFileSync(servicesPath, 'utf8');
const services = YAML.parse(file);

export default services.services;