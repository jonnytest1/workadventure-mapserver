# how to run the server :



like always first run: 

```bash
    npm install
```

## requirements

    - mariadb 
      - using this (self made) package for all the database stuff [HibernateTs](https://github.com/jonnytest1/hibernateTS)
      - initializes itself on startup 
      - required environment variables
        - process.env.DB_NAME;
        - process.env.DB_PORT;
        - process.env.DB_USER;
        - process.env.DB_URL;
        - process.env.DB_PASSWORD;

## environment variables
    - you can use dotenv in the root directory 
    - or specify them in the process environment

you can start the server with 


```bash
    node -r ts-node/register index.ts
```


example docker-compose 


```yaml
version: '3'
services:
 mapserver:
  image: jonathanheindl/rpi-nodets # basically the same as the nod base image source at https://github.com/jonnytest1/docker-images-rpi/tree/main/node
  depends_on:
   - maria
  ports: 
   - "8080:8080"
  restart: unless-stopped
  environment:
   ADMIN_API_KEY: ~ # this can be mostly ignored there exists an endpoint that shows where all the users are only if you're self hosted and have acess to the api-key [ApiProxy][(./resources\mapserver\api.proxy.ts)
   DB_NAME: workadventure
   DB_PORT: 3306
   DB_USER: workadventure-account
   DB_URL: docker_maria_1
   DB_PASSWORD: ~
  volumes:
   - "/var/www/mapserver/mapserver:/var/node"
  networks:
   - host
 maria:
  image: jsurf/rpi-mariadb # should be the same as the default mariadb image but for raspberrypi
  command: ["mysqld", "--max_allowed_packet=1073741824","--innodb_log_file_size=2G","--interactive_timeout=600","--wait_timeout=600"]
  container_name: docker_maria_1
  environment:
    MYSQL_ROOT_PASSWORD: ~
    MYSQL_USER: workadventure-account
    MYSQL_PASSWORD: ~
    MYSQL_DATABASE: workadventure
  ports:
   - "3306:3306" # just exported to connect with external tools to take a look at the data
  restart: unless-stopped
  volumes:
    - "maraidbdata:/var/lib/mysql/"
  networks:
   - host
networks:
   host:
volumes:
  maraidbdata:



```