type Service = {
	url: string;
	require_admin: boolean;
}

type ServiceList = {
	[key: string]: Service;
}

type Services = {
	services: ServiceList;
}

export {
	Service,
	ServiceList,
	Services
}