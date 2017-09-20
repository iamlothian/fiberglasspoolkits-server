
# Notes

docker run --name mongo -it -p 27017:27017 -e MONGO_INITDB_DATABASE='fpkdb' -e MONGO_INITDB_ROOT_USERNAME='admin' -e MONGO_INITDB_ROOT_PASSWORD='admin' mongo --auth
docker exec -it mongo mongo admin

use admin
db.createUser({ user: 'admin', pwd: 'admin', roles: [ { role: "userAdminAnyDatabase", db: "admin" } ] });

mongo admin -u "admin" -p "admin" 
mongo -u "admin" -p "admin" --authenticationDatabase "admin"
