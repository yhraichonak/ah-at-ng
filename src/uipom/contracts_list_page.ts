import {GenericPage} from "./generic_page";
import {ENV} from "../../environment";
import {test} from "@playwright/test";

export class ContractsListPage extends GenericPage  {

    async navigate() {
         await test.step(`Open page`, async()=> {
            await this.page.goto(`${ENV.BASE_FRONTEND_URL}/contracts?limit=25&sortBy=endDate&sortOrder=desc&filter=%257B%2522status%2522%253A%255B%2522Active%2522%252C%2522Renewed%2522%255D%257D`,{waitUntil:"load"});
        })
    }
}