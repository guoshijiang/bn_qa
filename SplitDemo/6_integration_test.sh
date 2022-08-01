#!/bin/bash

function buildIntegrationTest(){
  cp -r docker/integration-test/Dockerfile optimism/Dockerfile
  cd optimism
  docker build -t davionlabs/integration-test .

  #clean the Dockerfile
  rm -rf Dockerfile
  cd ..
}

function replaceEnv(){
  cp -r envs/intergration.template.env envs/intergration.env
}

function startIntegrationtest(){
  docker run --net bridge -itd --env-file envs/intergration.env --restart unless-stopped --name=intergration_test --entrypoint "/opt/optimism/integration-tests/integration-tests.sh" davionlabs/integration-test
}

buildIntegrationTest
replaceEnv
startIntegrationtest
