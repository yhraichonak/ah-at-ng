import {GenericPage} from "./generic_page";
import {ENV} from "../../environment";
import {test} from "@playwright/test";
import {RequestQuoteForm} from "./request_quote_form";
import {sleep} from "../api/utils";

export class QuotesListPage extends GenericPage  {

    static PAGE_URL=`${ENV.BASE_FRONTEND_URL}/quotes`
    static REQUEST_QUOTE_PAGE_URL=`${ENV.BASE_FRONTEND_URL}/quotes/request`
    async navigate() {
         await test.step(`Open page`, async()=> {
            await this.page.goto(QuotesListPage.PAGE_URL);
        })
    }

    async openQuoteRequestForm(restore=false) {
        await this.clickButton("Request Quote");
        await  sleep(1)
        let alert=this.page.locator("xpath=//div[@role='alertdialog' and @data-state='open']")
        if (await alert.isVisible()){
         if (restore){
             await alert.locator("xpath=//button[contains(.,'Restore')]").click();
         }else{
             await alert.locator("xpath=//button[contains(.,'Fresh')]").click();
         }
        }
        return new RequestQuoteForm(this.page);
    }
    async processUnsavedChangesDialog(stay=true) {
        let alert=this.page.locator("xpath=//div[@role='alertdialog' and @data-state='open']")
        if (await alert.isVisible()){
            if (stay){
                await alert.locator("xpath=//button[contains(.,'Stay')]").click();
            }else{
                await alert.locator("xpath=//button[contains(.,'Leave Page')]").click();
            }
        }
    }
}