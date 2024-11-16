import {APIResponse} from "@playwright/test";
import {Reporter} from "jest-allure/dist/Reporter";

declare const reporter: Reporter;

class ReportApiDetails {

    /**
     * Function for reporting (allure or console log) API details
     * @param method: API request method. For example: GET, POST etc.
     * @param url: destination URL
     * @param requestHeaders: API request headers
     * @param requestBody: API request body
     * @param response: API response
     */
    async traceApiCalls(method: string, url: string, requestHeaders: { [key: string]: string; }, requestBody: string | undefined, response: APIResponse) {

        const trace = process.env.TRACE_API_CALLS !== undefined ? process.env.TRACE_API_CALLS.toLowerCase() : '';

        if (trace === "true") {

            const name = method.toUpperCase() + ": " + url;

            //Convert headers to string when header is not undefined
            const requestHeadersStr = await this.getHeadersString(requestHeaders);

            //Create request body to be reported
            const requestBodyDet = requestBody !== undefined ? `\nREQUEST BODY: \n${requestBody}` : '';

            //Merge request headers and body to create request details
            const requestDetails = `REQUEST HEADER(s): \n${requestHeadersStr} ${requestBodyDet}`; //\nREQUEST BODY: \n${requestBody}`;

            //Get response headers
            const responseHeaders = await this.getHeadersString(response.headers());

            //Get response body
            const responseBody = await response.text();

            //Merge API response headers and body to create response details
            const responseDetails = `RESPONSE STATUS: ${response.status()} \n\nRESPONSE HEADER(s): \n${responseHeaders} \nRESPONSE BODY: \n${responseBody}`;

            //Merge request and response details to create report
            const report = `${requestDetails} \n\n${responseDetails} \n`;

            //Add API call details as attachment to allure report
            await reporter.addAttachment(name, report, "");

            //Print API call details in console log
            await console.log(name, report);

        }
    }

    /**
     * Function for reporting (allure or console log) API details
     * @param headers: API headers
     * @return headersString: headers in the form of string
     */
    async getHeadersString(headers: { [key: string]: string; }) {

        let headersString = "";

        for (const key in headers) {
            if (Object.hasOwnProperty.call(headers, key)) {
                const value = headers[key];
                headersString = headersString + `${key}: ${value}\n`;
            }
        }

        return headersString;
    }
}

export default new ReportApiDetails();