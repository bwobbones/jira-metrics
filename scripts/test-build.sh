#!/bin/bash

BASE_DIR=`dirname $0`

echo "-----------------------"
echo "LOG Running npm install"
echo "-----------------------"
echo "$BASE_DIR/config/karma-build.conf.js $*"

npm install

echo "----------------------"
echo "LOG Fixing permissions" 
echo "----------------------"
chmod +x node_modules/karma/bin/karma
chmod +x node_modules/jasmine-node/bin/jasmine-node

echo "-----------------------------"
echo "LOG Starting controller tests"
echo "-----------------------------"
echo node_modules/karma/bin/karma start config/karma-build.conf.js $*
node_modules/karma/bin/karma start config/karma-build.conf.js $*

echo "----------------------"
echo "LOG Starting api tests"
echo "----------------------"
echo node_modules/jasmine-node/bin/jasmine-node --junitreport --output report/ --forceexit components/*/test/api/*_apispec.js
node_modules/jasmine-node/bin/jasmine-node --junitreport --output report/ --forceexit components/*/test/api/*_apispec.js
