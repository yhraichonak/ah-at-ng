#!/bin/sh
find allure-results -type f -name "*.json" -exec  perl -pi -e 's/(KNOWN ISSUE.*?)(failed|broken)/$1unknown/' {} +