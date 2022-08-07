#!/bin/bash

function buildDtl(){
  cp -r docker/dtl/Dockerfile optimism/Dockerfile
  cd optimism
  docker build -t davionlabs/data-transport-layer .

  #clean the Dockerfile
  rm -rf Dockerfile
  cd ..
}


function replaceEnv(){
  cp -r envs/dtl.template.env envs/dtl.env
}

function startDtl(){
  docker run --net bridge -itd -p 7878:7878 --env-file envs/dtl.env \
  -v /root/ops/db:/db \
  --restart unless-stopped --entrypoint "/opt/optimism/packages/data-transport-layer/dtl.sh" \
  --name=dtl davionlabs/data-transport-layer
}

buildDtl
replaceEnv
startDtl
