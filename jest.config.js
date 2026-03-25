module.exports = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
    // globalSetup: 'jest-openapi-coverage/global-setup',
    globalSetup: "./src/tests/setup.ts",
    testTimeout: 10000,
    globalTeardown: 'jest-openapi-coverage/global-teardown',
    verbose: true,
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
        "node"
    ],
    reporters: [
        'default',
        ['jest-ctrf-json-reporter', {}],
        ['jest-junit', {
            "outputName": "junit.xml",
        }],
    ],
    preset: "ts-jest",
    // testEnvironment: "allure-jest/jsdom",
    testEnvironment: "allure-jest/node",
    testEnvironmentOptions: {
        resultsDir: "allure-results",
        links: {
            issue: {
                nameTemplate: "Issue #%s",
                urlTemplate: "https://tesedi-group.atlassian.net/browse/%s",
            },
            tms: {
                nameTemplate: "TMS #%s",
                urlTemplate: "https://tms.example.com/%s",
            },
            jira: {
                urlTemplate: (v) => `https://tesedi-group.atlassian.net/browse/{v}`,
            },
        },
        categories: [
            {
                name: "foo",
                messageRegex: "bar",
                traceRegex: "baz",
                matchedStatuses: ["failed", "broken"],
            },
        ]},
    // testRunner: 'allure-jest',
    roots: [
        "./src/tests",
    ],

    // setupFilesAfterEnv: [
    //     'jest-allure/dist/setup'
    // ],
}