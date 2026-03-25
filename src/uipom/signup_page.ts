import { Page, test } from '@playwright/test'
export class SignUpPage  {
    constructor(protected page: Page) {}
    public firstName = this.page.locator('#firstName');
    public lastName = this.page.locator('#lastName');
    public password = this.page.locator('#password');
    public registerButton = this.page.locator("xpath=.//button[.='Register']");


    async doRegister(fName, lName, password) {
        await test.step(`Confirm registration as  fname=[${fName}] and lname=[${lName}]`, async()=> {
            await this.firstName.fill(fName);
            await this.lastName.fill(lName);
            await this.password.fill(password);
            await this.registerButton.click({force:true});
        })
    }

}