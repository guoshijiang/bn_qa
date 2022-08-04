#!/bin/bash

function buildDeployer(){
  cp -r docker/deployer/Dockerfile optimism/Dockerfile
  cd optimism
  docker build -t davionlabs/deployer .

  #clean the Dockerfile
  rm -rf Dockerfile
  cd ..
}


function startDeployer(){
  docker run --net bridge -itd  --restart unless-stopped  -p 8080:8081 -e "AUTOMATICALLY_TRANSFER_OWNERSHIP=true" \
  -e "ETHERSCAN_API_KEY=B1XAN986315AME96W9QK7X1RGQ6WJMWEPW" \
  -e "CONTRACTS_RPC_URL=https://eth-goerli.g.alchemy.com/v2/821_LFssCCQnEG3mHnP7tSrc87IQKsUp" \
  -e "CONTRACTS_DEPLOYER_KEY=6395A7C842A08515961888D21D72F409B61FBCE96AF1E520384E375F301A8297" \
  -e "CONTRACTS_TARGET_NETWORK=gorelibn" --entrypoint "/opt/optimism/packages/contracts/redeployer.sh" \
   --name=deployer davionlabs/deployer
}

buildDeployer
startDeployer
