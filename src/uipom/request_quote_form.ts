import {Locator, Page, test} from '@playwright/test';
import {TableComponent} from "./table_component";

export class RequestQuoteForm {
    container: Locator;
    constructor(private page: Page) {
        this.container= this.page.locator("xpath=//div[contains(@class,'container') and contains(., 'Request Quote')]");
    }

    async clickButton(button:string) {
        await test.step(`Click button ${button}`, async()=> {
            await this.container.locator(`xpath=//button[.="${button}"]`).click();
        })
    }

    async fillQuoteDetails(quoteDetails:object){
        await test.step(`Fill request quote`, async()=> {
            if (quoteDetails["message"]!=undefined) {
                await this.container.locator(`css=div.ql-editor`).pressSequentially(quoteDetails["message"]);
            }

            if (quoteDetails["assets"]!=undefined){

                for (const asset of  quoteDetails["assets"]) {
                    let serial_number_elem= await this.container.locator(`css=input[data-test-id="input-serialNumber"]`)
                    await serial_number_elem.clear();
                    await serial_number_elem.pressSequentially(asset["serialNumber"]);

                    let product_sku_elem=await this.container.locator(`css=input[data-test-id="input-productSku"]`)
                    await product_sku_elem.clear();
                    await product_sku_elem.pressSequentially(asset["productSKU"]);

                    let end_date_elem=await this.container.locator(`css=input#date`)
                    await end_date_elem.clear();
                    await end_date_elem.pressSequentially(asset["endDate"]);

                    let service_group_elem=await this.container.locator(`css=input[placeholder="Find service groups"]`)
                    await service_group_elem.clear();
                    await service_group_elem.pressSequentially(asset["serviceGroup"]);
                    await this.container.locator(`css=div[aria-label="Suggestions"] div[data-value^='${asset["serviceGroup"]}']`).click()
                    await this.clickButton("Add")
                }
            }
            if (quoteDetails["customer"]!=undefined){
                let customer_elem=await this.container.locator(`css=input[placeholder$="customer name"]`);
                await customer_elem.pressSequentially(quoteDetails["customer"]);
                await this.container.locator(`css=div[aria-label="Suggestions"] div[data-value='${quoteDetails["customer"]}']`).first().click()
            }
            if (quoteDetails["files"]!=undefined){
                for (const filepath of  quoteDetails["files"]) {
                    await this.container.locator(`css=input[type="file"]`).setInputFiles(filepath);
                }
            }
        })
    }




    async getTable() {
        return await test.step(`Get table`, async()=> {
            return await new TableComponent(this.container);
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