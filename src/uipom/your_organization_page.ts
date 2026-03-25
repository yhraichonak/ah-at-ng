import {GenericPage} from "./generic_page";
import {ENV} from "../../environment";
import {test} from "@playwright/test";
export class YourOrganizationPage extends GenericPage  {
    async navigate() {
        await test.step(`Open page`, async()=> {
            await this.page.goto(`${ENV.BASE_FRONTEND_URL}/your-organization?activeTab=users`);
        })
    }
}