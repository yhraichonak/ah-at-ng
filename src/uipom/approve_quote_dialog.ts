import {Locator, Page, test} from '@playwright/test';

export class ApproveQuoteDialog {
    dialog: Locator;
    constructor(private page: Page) {
        this.dialog= this.page.locator("xpath=//div[@role='dialog' and @data-state='open' and contains(., 'Approve Quote')]");
    }

    async clickButton(button:string) {
        await test.step(`Click button ${button}`, async()=> {
            await this.page.locator(`xpath=//button[.="${button}"]`).click();
        })
    }

    async fillPoNumber(poNumber:string) {
        await test.step(`Fill PO number with ${poNumber}`, async()=> {
            await this.page.locator(`css=input#poNumber`).pressSequentially(poNumber);
        })
    }
    async fillComment(comment:string) {
        await test.step(`Fill comment ${comment}`, async()=> {
            await this.page.locator(`xpath=//div[contains(@class,'ql-editor') and not(contains(@class,'hidden'))]`).pressSequentially(comment);
        })
    }

    async AttachPO(filePath:string) {
        await test.step(`Fill PO file with ${filePath}`, async()=> {
            await this.page.locator(`css=input[type='file']`).setInputFiles(filePath)
        })
    }
}