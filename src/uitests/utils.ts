import path from "path";
import {chromium, Page} from "@playwright/test";
import {LoginPage} from "../uipom/login_page";
import {GenericPage} from "../uipom/generic_page";
import TestData from "../tests/testdata";
import {sleep} from "../api/utils";
import {DashboardPage} from "../uipom/dashboard_page";

export async function init_content_persistent_browser(testInfo, org=TestData.defaultOrganization) {
    const userDataDir = path.join(__dirname, '../.persistent-context');
    const cpPage = (await chromium.launchPersistentContext(userDataDir,  {headless: testInfo.project.use?.headless})).pages()[0];
    let lp=new LoginPage(cpPage)
    let cp=new GenericPage(cpPage)
    await lp.navigate()
    await sleep(2)
    let currentUrl=await cpPage.url()
    if (currentUrl.includes("sign-in")) {
        await lp.doLoginAsUser(TestData.defaultUserDetails)
        await sleep(1)
        await  cp.setLanguage("English")
    }
    await  cp.setOrganization(org);
    await  sleep(2)
    cpPage.context().close();
    await  sleep(0.5)
}

export async function try_process_relogin(cp:Page,lp:LoginPage, dp:DashboardPage) {
    if (cp.url().includes("/sign-in")) {
        await lp.doLoginAsUser(TestData.defaultUserDetails)
        await sleep(1)
        await dp.setOrganization(TestData.defaultOrganization);
        await sleep(1)
        await dp.navigate()
        await sleep(1)
    }
}
