import {GenericPage} from "./generic_page";
import {RequestQuoteChangeDialog} from "./request_quote_change_dialog";
import {ApproveQuoteDialog} from "./approve_quote_dialog";
import {DeclineQuoteDialog} from "./decline_quote_dialog";
import {test} from "@playwright/test";
import {ENV} from "../../environment";

export class QuoteDetailsPage extends GenericPage  {
    async navigate(pageId:String) {
        await test.step(`Open page ${pageId}`, async()=> {
            await this.page.goto(`${ENV.BASE_FRONTEND_URL}/quotes/${pageId}`);
            await this.sleep(1000)
        })
    }

    async getRequestChangeDialog() {
        await this.sleep(500)
        return new RequestQuoteChangeDialog(this.page);
    }
    async getApproveQuoteDialog() {
        await this.sleep(500)
        return new ApproveQuoteDialog(this.page);
    }
    async getDeclineDialog() {
        await this.sleep(500)
        return new DeclineQuoteDialog(this.page);
    }
}