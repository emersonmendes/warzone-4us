
export NPM_CONFIG_PRODUCTION=false

# build server

npm --prefix ./server/ install

# build web

npm --prefix ./web/ install
npm --prefix ./web/ run build