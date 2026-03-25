import {GenericPage} from "./generic_page";
import {ENV} from "../../environment";
import {test} from "@playwright/test";
export class OrganizationsPage extends GenericPage  {
    async navigate() {
        await test.step(`Open page`, async()=> {
            await this.page.goto(`${ENV.BASE_FRONTEND_URL}/admin/organizations?limit=25&sortBy=name&sortOrder=asc`,
                {waitUntil:"networkidle"});
        })
    }
}