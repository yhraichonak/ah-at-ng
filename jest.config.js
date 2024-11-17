module.exports = {
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
        ['jest-junit', {}],
    ],
    testRunner: 'jest-jasmine2',
    roots: [
        "./src/tests/bs-mvp",
    ],
     setupFilesAfterEnv: [
        'jest-allure/dist/setup'
      ],
}