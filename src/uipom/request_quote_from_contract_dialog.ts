import {Locator, Page, test} from '@playwright/test';
import {TableComponent} from "./table_component";
import {sleep} from "../api/utils";

export class RequestQuoteFromContractDialog {
    dialog: Locator;
    constructor(private page: Page) {
        this.dialog= this.page.locator("xpath=//div[@role='dialog' and @data-state='open' and contains(., 'Request quote for Contract')]");
    }

    async clickButton(button:string) {
        await test.step(`Click button ${button}`, async()=> {
            await this.dialog.locator(`xpath=//button[.="${button}"]`).click();
        })
    }

    async fillQuoteDetails(quoteDetails:object){
        await test.step(`Fill request quote`, async()=> {
            if (quoteDetails["generalRequest"]!=undefined) {
                await (await this.dialog.locator(`css=div.ql-editor`)).pressSequentially(quoteDetails["generalRequest"]);
            }
            if (quoteDetails["requestQuoteForContractGroup"]){
                await (await this.dialog.locator(`css=button#switch-input`)).click()
            }
            if (quoteDetails["files"]!=undefined){
                for (const filepath of  quoteDetails["files"]) {
                    await this.dialog.locator(`css=input[type="file"]`).setInputFiles(filepath);
                }
            }
            await sleep(1)
        })
    }




    async getTable() {
        return await test.step(`Get table`, async()=> {
            return await new TableComponent(this.dialog);
        })
    }

    async deleteItems(sns:string[]) {
        await test.step(`Delete elements [${sns}]`, async()=> {
            let columnCells=await (await this.getTable()).getTableColumn("Serial Number");
            let rows=await (await this.getTable()).getRows();
            for (var index= 0; index < columnCells.length ; index++) {
                if (sns.includes(columnCells[index]))
                {
                      await rows.nth(index).locator("css=button").last().click();
                }
            }
        });
    }

}