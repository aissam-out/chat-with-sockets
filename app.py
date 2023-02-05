import os
import time
from flask import Flask, render_template, redirect, url_for, flash, request
from flask_login import LoginManager, login_user, current_user, logout_user
from flask_socketio import SocketIO, join_room, leave_room, send, emit

from wtform_fields import *
from models import *

# Configure app
app = Flask(__name__)
app.secret_key='SECRET_KEY_OF_MY_CHOICE'

# Configure database
app.config['SQLALCHEMY_DATABASE_URI']=os.environ.get('POSTGRES_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Initialize login manager
login = LoginManager(app)
login.init_app(app)

@login.user_loader
def load_user(id):
    return User.query.get(int(id))

# Initialize socketio
socketio = SocketIO(app, cors_allowed_origins="*")

# Available channels for chat
ROOMS = ["General", "Web Dev", "Mobile Dev", "Tests", "DevOps", "Design", "Cyber Security", "Support"]
USERS = {}

# The root path for registration
@app.route("/", methods=['GET', 'POST'])
def index():
    '''Add user to db & redirect to login page'''
    reg_form = RegistrationForm()
    # Allow registration after input validation 
    if reg_form.validate_on_submit():
        # Extract input from the form
        username = reg_form.username.data
        password = reg_form.password.data
        hashed_password = pbkdf2_sha256.hash(password)
        # Add username & hashed password to DB
        user = User(username=username, hashed_pswd=hashed_password)
        db.session.add(user)
        db.session.commit()
        flash('Registered successfully. Please login.', 'success')

        return redirect(url_for('login'))

    return render_template("index.html", form=reg_form)


@app.route("/login", methods=['GET', 'POST'])
def login():
    '''login & redirect to chat page'''
    login_form = LoginForm()
    # Allow login after input validation
    if login_form.validate_on_submit():
        # Extract the user from DB & validate the user using flask_login
        user_object = User.query.filter_by(username=login_form.username.data).first()
        login_user(user_object)
        return redirect(url_for('chat'))

    return render_template("login.html", form=login_form)


@app.route("/logout", methods=['GET'])
def logout():
    '''logout & redirect to login page'''
    # Logout the user using flask_login
    logout_user()

    flash('You have logged out successfully', 'success')
    return redirect(url_for('login'))


@app.route("/chat", methods=['GET', 'POST'])
def chat():
    '''Allow user to access chat app if authenticated, otherwise redirect to login'''
    if not current_user.is_authenticated:
        flash('Please login', 'danger')
        return redirect(url_for('login'))

    return render_template("chat.html", username=current_user.username, rooms=ROOMS, users=USERS)


@app.errorhandler(404)
def page_not_found(e):
    '''Redirect to 404 page when path not found'''
    return render_template('404.html'), 404


@socketio.on('incoming-msg')
def on_message(data):
    '''Broadcast messages'''
    # Extract data
    msg = data["msg"]
    username = data["username"]
    room = data["room"]
    # Set time to be displayed with messages 
    time_stamp = time.strftime('%b-%d %r', time.localtime())
    # Sends messages that will be received by the 'message' event
    if (room in ROOMS):
        send({"username": username, "msg": msg, "time_stamp": time_stamp}, room=room)
    else:
        data= {
            "msg" : msg,
            'receiver_username' : room,
            'sender_username' : username,
            'time_stamp' : time_stamp
        }
        emit('client_private', data, room=USERS[room])


@socketio.on('join')
def on_join(data):
    '''User joins a room'''
    username = data["username"]
    room = data["room"]
    join_room(room)
    # Inform users in that channel that new user has joined
    send({"msg": username + " has joined the " + room + " channel.",
        "usr":username,
        'room':room}, room=room)


@socketio.on('leave')
def on_leave(data):
    """User leaves a room"""
    username = data['username']
    room = data['room']
    leave_room(room)
    # Inform users in that channel that new user has left
    send({"msg": username + " has left the " + room + " channel.",
        "usr":username,
        'room':room}, room=room)

####################################### Private messaging
@socketio.on('new_user')
def receive_private(username):
    USERS[username] = request.sid


@socketio.on('on_private')
def on_private(payload):
    receiver_username = payload['receiver_username']
    sender_username = payload['sender_username']
    current_room = payload['room']
    receiver_id = USERS[receiver_username]
    sender_id = USERS[sender_username]

    leave_room(current_room)
    if current_room in ROOMS:
        send({"msg": sender_username + " has left the " + current_room + " channel.",
            "usr":sender_username,
            'room':current_room}, room=current_room)
    else:
        send({"msg": sender_username + " has left the " + current_room + " channel.",
            "usr":sender_username,
            'room':current_room}, room=sender_id)

    join_room(USERS[receiver_username])
    data = {'msg': sender_username + " wants to chat with you. Join " + sender_username + " channel!",
        'inform': sender_username + " has joined the " + receiver_username + " channel.",
        'from': sender_username,
        'to': receiver_username}
    emit('request_private', data, room=receiver_id)

    

if __name__ == "__main__":
    socketio.run(app, debug=True)
