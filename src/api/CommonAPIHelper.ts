
import request from 'supertest'
import * as allure from "allure-js-commons";
const DETAILED_API_REPORTING = process.env.DETAILED_API_REPORTING !== undefined ? process.env.DETAILED_API_REPORTING : "false";
class CommonAPIHelper {

    async getHeadersString(headers: Headers|{ [key: string]: string; }) {

        let headersString = "";

        for (const key in headers) {
            if (Object.hasOwnProperty.call(headers, key)) {
                const value = headers[key];
                headersString = headersString + `${key}: ${value}\n`;
            }
        }

        return headersString;
    }
     async reportAPICallDetails(method: string, url: string, headers: { [key: string]: string; }, requestBody: any, response: Response ) {
               const name = method.toUpperCase() + ": " + url;
               const requestBodyDet = requestBody !== undefined ? `\nREQUEST BODY: \n${JSON.stringify(requestBody)}` : '';
               const requestDetails = `REQUEST HEADER(s): \n${await this.getHeadersString(headers)} ${requestBodyDet}`; //\nREQUEST BODY: \n${requestBody}`;
               const responseHeaders =await this.getHeadersString(response.headers);
               const responseBody = response.text;
               const responseDetails = `RESPONSE STATUS: ${response.status} \n\nRESPONSE HEADER(s): \n${responseHeaders} \nRESPONSE BODY: \n${responseBody}`;
               const report = `${requestDetails} \n\n${responseDetails} \n`;
               console.log(name);
               console.log(report);
               allure.attachment(name,report,"text/plain");
     }

     async send(method:string, baseUrl: string, url: string,headers:  { [key: string]: string; }, payload?:any) {
          if (headers==null) headers={};
          let response;
          url=url.replace("/?","?").replace(/\/$/, '')
          switch(method.toUpperCase()) {
               case "POST": {response = await request(baseUrl).post(url).send(payload).set(headers); break;}
               case "GET": {response = await request(baseUrl).get(url).set(headers);break;}
               case "PUT": {response=await request(baseUrl).put(url).send(payload).set(headers); break;}
               case "PATCH": {response=await request(baseUrl).patch(url).send(payload).set(headers); break;}
               case "DELETE": {response=await request(baseUrl).delete(url).set(headers);break;}
               default: {
                    throw new Error("Unrecognized HTTP request method: " + method);
               }
          }
          if (DETAILED_API_REPORTING=="true")
              await this.reportAPICallDetails(method, `${baseUrl}/${url}`, headers, payload, response);
          return response
     }
}

export default new CommonAPIHelper();