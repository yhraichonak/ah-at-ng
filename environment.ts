const env = process.env.ENVIRONMENT !== undefined ? process.env.ENVIRONMENT : 'local';
import { log, error } from "console";


const local = {
    BASE_URL: "http://localhost:3000",
    BASE_FRONTEND_URL: "http://localhost:5173",
    WEBHOOK_URL: "http://localhost:3001",
    MAILPIT_URL: "http://localhost:8025",
    KEYCLOAK_URL: "http://localhost:8080",
    DB_URL: "postgres://user:password@localhost:5432/app",
    WH_CLIENT_ID: "client-id-1",
    WH_CLIENT_SECRET: "client-secret-1",
    DEFAULT_ORG_ID: "c8256e57-932b-4117-9680-92d486b71996",
    QUOTE_READ_PERM_ID: "c8256e57-932b-4117-9680-92d486b72001",
    ORG_READ_PERM_ID: "c8256e57-932b-4117-9680-92d486b72700",
    SUPER_ORG_ID: "a9233c9c-4634-493a-9f12-bef4d1cf3c51",
    API_KEY: "056d4a98-83f6-4a7b-a487-1aa05f7fb357",
    API_SECRET: "aa4f617d-4b4f-437f-a3af-374d785af27e"
};
const docker = {
    BASE_URL: "http://host.docker.internal:3000",
    BASE_FRONTEND_URL: "http://host.docker.internal:80",
    WEBHOOK_URL: "http://host.docker.internal:3001",
    MAILPIT_URL: "http://host.docker.internal:8025",
    KEYCLOAK_URL: "http://host.docker.internal:8080",
    DB_URL: "postgres://user:password@host.docker.internal:5432/app"

};
const github = {
    BASE_URL: "http://127.0.0.1:3000",
    BASE_FRONTEND_URL: "http://127.0.0.1:80",
    WEBHOOK_URL: "http://127.0.0.1:3001",
    MAILPIT_URL: "http://127.0.0.1:8025",
    KEYCLOAK_URL: "http://127.0.0.1:8080",
    DB_URL: "postgres://user:password@127.0.0.1:5432/app"
};
const githubmac = {
    BASE_URL: "http://192.168.0.100:3000",
    BASE_FRONTEND_URL: "http://192.168.0.100:80",
    WEBHOOK_URL: "http://192.168.0.100:3001",
    MAILPIT_URL: "http://192.168.0.100:8025",
    KEYCLOAK_URL: "http://192.168.0.100:8080",
    DB_URL: "postgres://user:password@192.168.0.100:5432/app"
};
const test = {
    BASE_URL: "https://jsonplaceholder.typicode.com"
};

const dev = {
    BASE_URL: "https://jsonplaceholder.typicode.com"
};

const stg = {
};

const environment = {
    test,
    dev,
    stg,
    local,
    github,
    githubmac,
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

// log("ENVIRONMENT: ", ENV);