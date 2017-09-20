echo 'Init mongo'
docker exec -i mongo mongo admin --eval "db.createUser({ user: 'admin', pwd: 'admin', roles: [ { role: 'userAdminAnyDatabase', db: 'admin' } ] });"
docker exec -i mongo mongo admin -u "admin" -p "admin" --eval "db = db.getSiblingDB('fpkdb'); db.createUser({ user: 'rw', pwd: 'rwuser', roles: [ { role: 'readWrite', db: 'fpkdb' } ] });"
docker exec -i mongo mongo admin -u "admin" -p "admin" --eval "db = db.getSiblingDB('fpkdb'); db.createUser({ user: 'ro', pwd: 'rouser', roles: [ { role: 'read', db: 'fpkdb' } ] });"
docker exec -d mongo mongod --shutdown