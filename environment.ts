const env = process.env.ENVIRONMENT !== undefined ? process.env.ENVIRONMENT : '';
console.log(`Environment under test: ${env}`);


const local = {
    BASE_URL: "http://127.0.0.1:3000"
};
const docker = {
    BASE_URL: "http://host.docker.internal:3000"
};
const test = {
    BASE_URL: "https://jsonplaceholder.typicode.com"
};

const dev = {
    BASE_URL: "https://jsonplaceholder.typicode.com"
};

const stg = {
    BASE_URL: "https://jsonplaceholder.typicode.com"
};

const environment = {
    test,
    dev,
    stg,
    local,
    docker
};

class ConfigManager {
    config: Record<string, any>;

    constructor(config: Record<string, any>) {
        this.config = config;
    }

    public getConfig(env: string): any {
        return this.config[env];
    }
}

const configManager = new ConfigManager(environment);

export const ENV = configManager.getConfig(env);

console.log("ENVIRONMENT: ", ENV);