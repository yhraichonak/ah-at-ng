import {Locator, Page, test} from '@playwright/test';

export class DeclineQuoteDialog {
    dialog: Locator;
    constructor(private page: Page) {
        this.dialog= this.page.locator("xpath=//div[@role='dialog' and @data-state='open' and contains(., 'Decline Quote')]");
    }

    async clickButton(button:string) {
        await test.step(`Click button ${button}`, async()=> {
            await this.page.locator(`xpath=//button[.="${button}"]`).click();
        })
    }

    async fillReason(comment:string) {
        await test.step(`Fill reason ${comment}`, async()=> {
            var element=await this.page.locator("css=button[role='combobox']");
            await element.click();
            await this.page.locator("xpath=//div[@data-radix-popper-content-wrapper]//div[@role='option' and contains(.,'"+comment+"')]").click();
        })
    }
}