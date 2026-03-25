import { Page, test } from '@playwright/test'
import {ENV} from "../../environment";
import {sleep} from "../api/utils";
export class LoginPage  {
    constructor(protected page: Page) {}
    public loginViaAPIButton = this.page.locator('xpath=//button[.="Log in with API"]');
    public userInput = this.page.locator('css=input#email');
    public passwordInput = this.page.locator('css=input#password');
    public signInButton = this.page.locator('css=button[type="submit"]');
    async navigate() {
        await test.step(`Open page`, async()=> {
            await this.page.goto(ENV.BASE_FRONTEND_URL,{waitUntil:"networkidle"});
        })

            // "load"|"domcontentloaded"|"networkidle"|"commit";
    }

    async loginWithAPI() {
        await test.step(`Login with API`, async()=> {
            await this.loginViaAPIButton.click();
        })
    }
    async getInputError() {
        return await test.step(`Get input error`, async()=> {
            return this.page.locator("css=li[role='status']");
        })
    }

    async doLoginAs(user, password) {
        await test.step(`Login as user [${user}] with password [${password}]`, async()=> {
            await this.userInput.fill(user);
            await this.passwordInput.fill(password);
            await this.signInButton.click({force:true});
        })
    }

    async setLanguage(lang:string) {
        await test.step(`Set language to ${lang}`, async()=> {
            await this.page.click("css=span[data-test-id='language-menu']");
            await this.page.click(`//div[@role='menuitem' and contains(.,'${lang}')]`);
        })
    }
    async doLoginAsUser(userObject) {
        await this.doLoginAs(userObject.email,userObject.pass);
    }
}