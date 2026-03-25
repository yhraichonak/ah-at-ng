import fs from "fs";
import path from "path";

function cleanDir(dir: string) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
}

async function globalSetup() {

    const allureResults = path.resolve(process.cwd(), "allure-results");
    cleanDir(allureResults);
    const allureReport = path.resolve(process.cwd(), "allure-report");
    cleanDir(allureReport);
    console.log("✔ Allure folders cleaned for Playwright run");
}

export default globalSetup;
