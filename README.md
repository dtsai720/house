# seekHourse

```sh
$ docker run --name postgres -itd --restart always \
-p 5432:5432 \
-e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres \
-e POSTGRES_PORT=5432 -e POSTGRES_DB=hourse \
postgres:15.0-alpine
```

```sh
liquibase --url="jdbc:postgresql://localhost:5432/hourse" --username=postgres --password=postgres --changeLogFile=changelog.xml update
```

```
npx playwright test
    Runs the end-to-end tests.

  npx playwright test --project=chromium
    Runs the tests only on Desktop Chrome.

  npx playwright test example
    Runs the tests in a specific file.

  npx playwright test --debug
    Runs the tests in debug mode.

  npx playwright codegen
    Auto generate tests with Codegen.

We suggest that you begin by typing:

    npx playwright test
```

```
$ docker run --name nginx -itd --restart always -p 80:80 \
-v ${PWD}/conf/default.conf:/etc/nginx/conf.d/default.conf \
-v ${PWD}/static:/usr/share/nginx/html nginx
```