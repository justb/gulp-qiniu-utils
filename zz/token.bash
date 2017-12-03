echo $(node -pe 'JSON.parse(process.argv[1]).sk' "$(cat config/qiniu.json)")
echo "/v2/tune/refresh" |openssl dgst -binary -hmac $(node -pe 'JSON.parse(process.argv[1]).sk' "$(cat config/qiniu.json)") -sha1 |base64 | tr + - | tr / _ > zzcdn/token
echo "12313123"