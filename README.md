# Chat application with SocketIO

This project is a chat application based on websockets, it supports both private messages and chatrooms. The code also covers the registration and login processes. The database being utilized is Postgres.

<img align="right" src="./images/login.png" alt="Login page"><br><br>



## Public chatrooms

After registration, user credentials will be stored in the Postgres DB. Check below to see how to setup the project.

Upon login, users are automatically redirected to the Genaral chatroom. They can change rooms, and only users in the same room can see each others' messages.

<img align="right" src="./images/chatrooms.png" alt="Chatrooms page"><br><br>


## Private chat

Connected users can be viewed in the "Users" section. To initiate a private chat, simply click on a user and they will receive a notification, allowing you to start the private conversation.

<img align="right" src="./images/chatprivate.png" alt="Private chat page">
.
<img align="right" src="./images/chatprivate2.png" alt="Private chat page">


# How run the project

To run this project, you'll need to set up a Postgres DB. The easiest way to do it is to run a postgres container. 

To do so, and assuming you have Docker installed in your machine, pull the posgres image `docker pull postgres`, then start a postgres instance `docker run --name pg_instance -d -p 2023:5432 -e POSTGRES_PASSWORD=postgres postgres`

Now that you have the DB up and running, you can connect to postgres using command line, or a SQL client like DBeaver, then create a "chatDB" database.

The code extracts the URI of this postgres instance from your environment variables. Thus, make sure you have an .env file containing `export POSTGRES_URI="postgresql://postgres:postgres@localhost:2023/chatDB"` (Also, don't forget to load the environment variables `source .env` before starting the app)

Run `python create.py`

Congrats. Everything is set up now. All you have to do is to run `python app.py` and enjoy :D

