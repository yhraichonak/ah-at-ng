import {GenericPage} from "./generic_page";
import {ENV} from "../../environment";
import {test} from "@playwright/test";

export class DashboardPage extends GenericPage  {
    static PAGE_URL= `${ENV.BASE_FRONTEND_URL}/dashboard`
    async navigate() {
         await test.step(`Open page`, async()=> {
            await this.page.goto(DashboardPage.PAGE_URL);
        })
    }
}