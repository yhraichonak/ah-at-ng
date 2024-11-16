### To run API tests: use commands 
`npm run ENIRONMENT=local`
`npm run TRACE_API_CALLS=local`
`npm run report`
### To run tests via Docker:  
`TEST_ENVIRONMENT=http://127.0.0.1:3000/ docker-compose  up -d`
### To run tests via Docker and not  stay alive: 
`STAY_ALIVE=false TEST_ENVIRONMENT=local docker-compose  up -d`
### test commit