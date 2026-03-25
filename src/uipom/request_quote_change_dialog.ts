import {Locator, Page, test} from '@playwright/test';
import {TableComponent} from "./table_component";

export class RequestQuoteChangeDialog {
    dialog: Locator;
    constructor(private page: Page) {
        this.dialog= this.page.locator("xpath=//div[@role='dialog' and @data-state='open']");
        // this.dialog= this.page.locator("xpath=//div[@role='dialog' and @data-state='open' and contains(., 'Request Change')]");
    }

    async clickButton(button:string) {
        await test.step(`Click button ${button}`, async()=> {
            await this.page.locator(`xpath=//button[.="${button}"]`).click();
        })
    }

    async fillCancellationReason(cancellationReason:string) {
        await test.step(`Fill cancellation reason ${cancellationReason}`, async()=> {
            var element=await this.page.locator("css=button[role='combobox']");
            await element.click();
            await this.page.locator("xpath=//div[@data-radix-popper-content-wrapper]//div[@role='option' and contains(.,'"+cancellationReason+"')]").click();
        })
    }
    async fillComment(comment:string) {
        await test.step(`Fill comment ${comment}`, async()=> {
            await this.page.locator(`xpath=//div[contains(@class,'ql-editor') and not(contains(@class,'hidden'))]`).pressSequentially(comment);
        })
    }

    async getConfirmationDataSection(section:string): Promise<Locator> {
       return await test.step(`Get confirmation data section ${section} content`, async()=> {
            let section_button=await this.page.locator(`xpath=//button[contains(.,'${section}')]`);
            if (await section_button.getAttribute("aria-expanded") != "true"){
                await section_button.click();
            }
            let data_section=await section_button.locator(`xpath=./../../div[@data-state='open']`);
            return data_section;
        })
    }

    async getTable() {
        return await test.step(`Get table`, async()=> {
            return await new TableComponent(this.dialog);
        })
    }

    async setServiceGroup(sns:string[], serviceGroup:string) {
        await test.step(`Set service group to [${serviceGroup}] for elements [${sns}]`, async()=> {
            let columnCells=await (await this.getTable()).getTableColumn("Serial Number");
            let rows=await (await this.getTable()).getRows();
            for (var index= 0; index < columnCells.length ; index++) {
                if (sns.includes(columnCells[index]))
                {
                    var element=await rows.nth(index).locator("css=button[role='combobox']");
                    await element.click();
                    await this.page.locator("xpath=//div[@data-radix-popper-content-wrapper]//div[@role='option' and contains(.,'"+serviceGroup+"')]").click();
                }
            }
        });
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