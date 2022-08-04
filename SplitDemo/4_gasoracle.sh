#!/bin/bash

function buildGasOracle(){
  cd optimism
  docker build -f gas-oracle/Dockerfile -t davionlabs/gas-oracle .

  cd ..
}


function startGasOracle(){
  docker run --net bridge -itd --restart unless-stopped \
  -e "GAS_PRICE_ORACLE_ETHEREUM_HTTP_URL=https://eth-goerli.g.alchemy.com/v2/821_LFssCCQnEG3mHnP7tSrc87IQKsUp" \
  -e "GAS_PRICE_ORACLE_LAYER_TWO_HTTP_URL=http://172.17.0.1:8545" \
  -e "GAS_PRICE_ORACLE_PRIVATE_KEY=0x6395A7C842A08515961888D21D72F409B61FBCE96AF1E520384E375F301A8297" \
  --name=gas-oracle davionlabs/gas-oracle
}


buildGasOracle
startGasOracle
