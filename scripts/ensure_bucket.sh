#!/usr/bin/env bash
set -euo pipefail
EP="https://nyc.cloud.appwrite.io/v1"
PROJ="6897443a0034c54b3fd8"
KEY="standard_05050e5d0a68cccf3e067cf42c24b4930f9a5d182424518eead63c4cfaca263479dc936fc28e17a812b1bf80aee784480d8da6fbe87a35b424599af60dfdcf92d43ee2b6d0ab1d81ee83b2fcb249d544f90c6a7576d29f06202a4b195ee4560c78363d29d4054951bb0a5bc14bce0c42d9078063c5e12382acd9f00778697bf2"
HDR=( -H "X-Appwrite-Project: $PROJ" -H "X-Appwrite-Key: $KEY" -H "Content-Type: application/json" )
# Check if bucket exists
code=$(curl -sS -o /dev/null -w "%{http_code}" -H "X-Appwrite-Project: $PROJ" -H "X-Appwrite-Key: $KEY" "$EP/storage/buckets/documents")
if [ "$code" = "200" ]; then
  # Update to ensure private (fileSecurity) and encryption enabled
  upd=$(curl -sS -o /dev/null -w "%{http_code}" -X PUT "${HDR[@]}" "$EP/storage/buckets/documents" \
    -d '{"name":"Documents","fileSecurity":true,"enabled":true,"encryption":true,"allowedFileExtensions":["pdf","doc","docx","txt","jpg","jpeg","png"]}')
  echo "documents bucket exists; update status: $upd"
else
  # Create
  crt=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${HDR[@]}" "$EP/storage/buckets" \
    -d '{"bucketId":"documents","name":"Documents","fileSecurity":true,"enabled":true,"encryption":true,"allowedFileExtensions":["pdf","doc","docx","txt","jpg","jpeg","png"]}')
  echo "documents bucket create status: $crt"
fi
