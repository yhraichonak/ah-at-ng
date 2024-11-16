#!/bin/sh

echo "AH automation environment preparation"
echo "TEST_ENVIRONMENT=$TEST_ENVIRONMENT"
echo "STAY_ALIVE=$STAY_ALIVE"
rm -fr reports/ allure-results/
ENVIRONMENT=$TEST_ENVIRONMENT TRACE_API_CALLS=true npm run test
if [ "$STAY_ALIVE" = "true" ]
then
  sleep infinity
fi
