import YAML from 'yaml';
import * as fs from 'fs';
import { ServiceList } from './models/Services';

const isDocker = fs.existsSync('/.dockerenv');
const servicesPath = isDocker ? '/services.yaml' : './services.yaml';

const file = fs.readFileSync(servicesPath, 'utf8');
const services = YAML.parse(file);

export default services.services as ServiceList;