import ahAPI from "../../api/AHAPIHelper";
import {Reporter} from "jest-allure/dist/Reporter";
declare const reporter: Reporter;
// jest.retryTimes(2); Working only with Jest Circul Runner
describe("POC API Suite", () => {
        test("Make BS status call", async () => {
            await reporter.description("DESC: Get user posts");
            const response = await ahAPI.getStatus();
            expect(response.ok()).toBeTruthy();
            expect(response.status()).toBe(200);
        })
    test("Artifical passed test ", async () => {
        expect(true).toBeTruthy();
    })
    test("Artifical failed test ", async () => {
        expect(false).toBeTruthy();
    })
    test("Artificial flaky test", async () => {
        expect( (Math.random()>=0.5)? 1 : 0).toEqual(1);
    });
    }
)