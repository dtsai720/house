# seekHourse

```sh
$ docker run --name postgres -itd --restart always \
-p 5432:5432 -v ${PWD}/pg-data:/var/lib/postgresql/data \
-e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres \
-e POSTGRES_PORT=5432 -e POSTGRES_DB=hourse \
postgres:15.0-alpine
```

```sh
liquibase --url="jdbc:postgresql://localhost:5432/hourse" --username=postgres --password=postgres --changeLogFile=changelog.xml update
```
