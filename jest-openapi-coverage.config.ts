import { JestOpenApiCoverageConfig } from 'jest-openapi-coverage';

const config: JestOpenApiCoverageConfig = {
    format: ['json'],
    outputFile: 'oapi-coverage.json',
};

export default config;