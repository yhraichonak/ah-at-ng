import ahAPI from "../../api/AHAPIHelper";
import {Reporter} from "jest-allure/dist/Reporter";
declare const reporter: Reporter;

describe("Make BS status call", () => {
        test("Make BS status call", async () => {
            await reporter.description("DESC: Get user posts");
            const response = await ahAPI.getStatus();
            expect(response.ok()).toBeTruthy();
            expect(response.status()).toBe(200);
        })
    }
)