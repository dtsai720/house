# seekhouse

```
export POSTGRES_HOST=localhost
export POSTGRES_PASSWORD=postgres
export POSTGRES_USER=postgres
export POSTGRES_PORT=5000
export POSTGRES_DB=house
```

```sh
$ docker run --name db -itd --restart always \
-p ${POSTGRES_PORT}:5432 \
-e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} -e POSTGRES_USER=${POSTGRES_USER} \
-e POSTGRES_PORT=5432 -e POSTGRES_DB=${POSTGRES_DB} \
postgres:16-alpine
```

```sh
liquibase --url="jdbc:postgresql://${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}" --username=${POSTGRES_USER} --password=${POSTGRES_PASSWORD} --changeLogFile=changelog.xml update
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
-v ${PWD}/static:/usr/share/nginx/html nginx:1.25-alpine
```