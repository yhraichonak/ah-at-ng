
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        setupFiles: ["allure-vitest/setup"],
        reporters: [
            'junit',
            'json',
            'html',
            'verbose',
            ["allure-vitest/reporter", { resultsDir: "allure-results"}]],
        outputFile: {
            junit: './junit-report.xml',
            json: './json-report.json',
            html: './html-report.html'
        },
    },
})