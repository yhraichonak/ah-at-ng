import {GenericPage} from "./generic_page";
import {test} from "@playwright/test";
import {ENV} from "../../environment";

export class ServicePackQuotePage extends GenericPage  {
    async navigate(spId:String) {
        await test.step(`Open SP quote page ${spId}`, async()=> {
            await this.page.goto(`${ENV.BASE_FRONTEND_URL}/service-packs/${spId}/quote`);
            await this.sleep(1000)
        })
    }

    async selectServicePack(spname:string) {
        let targetCard=await this.page.locator("div.grid>div.bg-card").filter({hasText:spname})
        await targetCard.click();
    }

    async fillDetails(poName:string, attachFile:string, agreeTerms:boolean) {
        if (poName!==null){
            await this.page.locator("#poNumber").pressSequentially(poName)
        }
        if (attachFile!==null){
            await this.page.locator(`css=input[type='file']`).setInputFiles(attachFile)
        }
        let selector=await this.page.locator("button[role='checkbox']")
        let checked=await selector.getAttribute("aria-checked")
        if (agreeTerms.toString()!==checked){
            await selector.click()
        }
    }
}