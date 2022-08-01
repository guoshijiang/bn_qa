#!/bin/bash

function buildBatchSubmitter(){
  cd optimism
  docker build -f batch-submitter/Dockerfile -t davionlabs/batch-submitter-service .

  cd ..
}


function replaceEnv(){
  cp -r envs/batch-submitter.template.env envs/batch-submitter.env
}

function startBatchSubmitter(){
  docker run --net bridge -itd --env-file envs/batch-submitter.env \
  --restart unless-stopped --entrypoint "/usr/local/bin/batch-submitter.sh" \
  --name=batch-submitter ethereumoptimism/batch-submitter-service
}

buildBatchSubmitter
replaceEnv
startBatchSubmitter
