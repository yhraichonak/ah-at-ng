#!/bin/sh
set -x

echo "AH automation environment preparation"
echo "ENVIRONMENT=$ENVIRONMENT"
echo "TESTS=$TESTS"
echo "STAY_ALIVE=$STAY_ALIVE"
echo "TRIGGER=$TRIGGER"
echo "MODULE=$MODULE"
rm -fr reports/ allure-results/ allure-results.zip
#ENVIRONMENT=$ENVIRONMENT jest src/tests/status.spec.ts

# shellcheck disable=SC3010
if [[ $MODULE == *"ui"* ]]; then
  if [ "$TESTS" = "" ]
  then
    ENVIRONMENT=$ENVIRONMENT FRESHDESK_AUTH=$FRESHDESK_AUTH npx playwright test --reporter=allure-playwright
  else
   ENVIRONMENT=$ENVIRONMENT FRESHDESK_AUTH=$FRESHDESK_AUTH  npx playwright test --reporter=allure-playwright -g "$TESTS"
  fi
   zip -r allure-results.zip allure-results
   curl --location --request POST 'http://13.81.115.18:8080/job/AH-AT-NG/buildWithParameters' -F results_archive=@./allure-results.zip --form trigger="[UI] $TRIGGER" --user $JENKINS_AUTH
fi

# shellcheck disable=SC3010
if [[ $MODULE == *"api"* ]]; then
  if [ "$TESTS" = "" ]
  then
    ENVIRONMENT=$ENVIRONMENT npm test --runInBand
  else
    ENVIRONMENT=$ENVIRONMENT npm test -- -u -t "$TESTS" --runInBand --detectOpenHandles --forceExit
  fi
  zip -r allure-results.zip allure-results
  curl --location --request POST 'http://13.81.115.18:8080/job/AH-AT-NG/buildWithParameters' -F results_archive=@./allure-results.zip --form trigger="[API] $TRIGGER" --user $JENKINS_AUTH
fi
if [ "$STAY_ALIVE" = "true" ]
then
  sleep infinity
fi
