document.addEventListener('DOMContentLoaded', () => {

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // Retrieve username
    const username = document.querySelector('#get-username').innerHTML;

    // Set default room
    let room = "General"
    joinRoom("General");
    socket.emit('new_user', username);

    // Send messages (with username & room)
    document.querySelector('#send_message').onclick = () => {
        // 'emit' sends messages to custom events (instead of the default 'message' event)
        socket.emit('incoming-msg', {'msg': document.querySelector('#user_message').value,
            'username': username, 'room': room});
            // empty the message box after sending a msg
        document.querySelector('#user_message').value = '';
    };

    // Display all incoming messages
    socket.on('message', data => {

        // Display current message
        if (data.msg) {
            const p = document.createElement('p');
            const span_username = document.createElement('span');
            const span_timestamp = document.createElement('span');
            const br = document.createElement('br')
            // Display user's own message
            if (data.username == username) {
                    // Switch class name to my-msg
                    p.setAttribute("class", "my-msg");
                    // Username
                    span_username.setAttribute("class", "my-username");
                    span_username.innerText = data.username;
                    // Timestamp
                    span_timestamp.setAttribute("class", "timestamp");
                    span_timestamp.innerText = data.time_stamp;
                    // HTML to display
                    p.innerHTML += span_username.outerHTML + ' ' + span_timestamp.outerHTML + br.outerHTML + data.msg 
                    // Append
                    document.querySelector('#display-message-section').append(p);
            }
            // Display other users' messages
            else if (typeof data.username !== 'undefined') {
                // Switch class name to others-msg
                p.setAttribute("class", "others-msg");
                // Username
                span_username.setAttribute("class", "other-username");
                span_username.innerText = data.username;
                // Timestamp
                span_timestamp.setAttribute("class", "timestamp");
                span_timestamp.innerText = data.time_stamp;
                // HTML to append
                p.innerHTML += span_username.outerHTML + ' ' + span_timestamp.outerHTML + br.outerHTML + data.msg;
                // Append
                document.querySelector('#display-message-section').append(p);
            }
            // Display system message
            else {
                // console.log(data)
                if (room==data.room) {
                    printSysMsg(data.msg);
                }
                
            }
        }
        scrollDownChatWindow();
    });

    socket.on('client_private', data => {
        // Display current message
        if (data.msg) {
            const p = document.createElement('p');
            const span_username = document.createElement('span');
            const span_timestamp = document.createElement('span');
            const br = document.createElement('br')
            // Display user's own message
            if (data.sender_username == username) {
                    // Switch class name to my-msg
                    p.setAttribute("class", "my-msg");
                    // Username
                    span_username.setAttribute("class", "my-username");
                    span_username.innerText = data.sender_username;
                    // Timestamp
                    span_timestamp.setAttribute("class", "timestamp");
                    span_timestamp.innerText = data.time_stamp;
                    // HTML to display
                    p.innerHTML += span_username.outerHTML + ' ' + span_timestamp.outerHTML + br.outerHTML + data.msg 
                    // Append
                    document.querySelector('#display-message-section').append(p);
            }
            // Display other users' messages
            else if (data.receiver_username == username) {
                // show others messages only if user in it's own channel
                if (room === data.sender_username) {
                    // Switch class name to others-msg
                    p.setAttribute("class", "others-msg");
                    // Username
                    span_username.setAttribute("class", "other-username");
                    span_username.innerText = data.sender_username;
                    // Timestamp
                    span_timestamp.setAttribute("class", "timestamp");
                    span_timestamp.innerText = data.time_stamp;
                    // HTML to append
                    p.innerHTML += span_username.outerHTML + ' ' + span_timestamp.outerHTML + br.outerHTML + data.msg;
                    // Append
                    document.querySelector('#display-message-section').append(p);
                }
            }
            // Display system message
            else {
                printSysMsg(data.msg);
            }
        }
        scrollDownChatWindow();
    });

    socket.on('request_private', data => {
        if (username===data.to & room != data.from) {
            alert(data.msg)
            //printSysMsg(data.inform);
        }        
    });

    // Select a room
    document.querySelectorAll('.select-room').forEach(p => {
        p.onclick = () => {
            let newRoom = p.innerHTML
            // Check if user already in the room
            if (newRoom === room) {
                msg = `You are already in ${room} room.`;
                printSysMsg(msg);
            } else {
                leaveRoom(room);
                joinRoom(newRoom);
                room = newRoom;
            }
        };
    });
////////////////////////////////////////////////////////////////////////////////////////
    // Select a user
    document.querySelectorAll('.select-user').forEach(p => {
        p.onclick = () => {
            let receiver_username = p.innerHTML
            let sender_username = username
            if (receiver_username === room) {
                msg = `You are already in ${room} room.`;
                printSysMsg(msg);
            } else {
                socket.emit('on_private', {
                    'sender_username':sender_username,
                    'receiver_username': receiver_username,
                    'room': room
                    }
                );
                // update room
                room = receiver_username
                
                // style
                document.querySelectorAll('.select-room,.select-user').forEach(p => {
                    p.style.color = "black";
                    p.style.backgroundColor = "transparent";
                });
                // Highlight selected room in the sidebar
                document.querySelector('#' + CSS.escape(room)).style.color = "#4172c4";
                document.querySelector('#' + CSS.escape(room)).style.backgroundColor = "#8cb5fa";
                // Clear message area
                document.querySelector('#display-message-section').innerHTML = '';
                // Autofocus on text box
                document.querySelector("#user_message").focus();
            }
        };
    });
//////////////////////////////////////////////////////////////////////////////////////////

    // Logout from chat
    document.querySelector("#logout-btn").onclick = () => {
        leaveRoom(room);
    };

    // Trigger 'leave' event
    function leaveRoom(room) {
        // Leave room
        socket.emit('leave', {'username': username, 'room': room});
        // go back to the default style in the sidebar
        document.querySelectorAll('.select-room,.select-user').forEach(p => {
            p.style.color = "black";
            p.style.backgroundColor = "transparent";
        });
    }

    // Trigger 'join' event
    function joinRoom(room) {
        // Join room
        socket.emit('join', {'username': username, 'room': room});
        // Highlight selected room in the sidebar
        document.querySelector('#' + CSS.escape(room)).style.color = "#4172c4";
        document.querySelector('#' + CSS.escape(room)).style.backgroundColor = "#8cb5fa";
        // Clear message area
        document.querySelector('#display-message-section').innerHTML = '';
        // Autofocus on text box
        document.querySelector("#user_message").focus();
    }

    // Scroll chat window down
    function scrollDownChatWindow() {
        const chatWindow = document.querySelector("#display-message-section");
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Print system messages
    function printSysMsg(msg) {
        const p = document.createElement('p');
        p.setAttribute("class", "system-msg");
        p.innerHTML = msg;
        document.querySelector('#display-message-section').append(p);
        scrollDownChatWindow()
        // Autofocus on text box
        document.querySelector("#user_message").focus();
    }

    // Make sidebar collapse on click
    document.querySelector('#show-sidebar-button').onclick = () => {
        document.querySelector('#sidebar').classList.toggle('view-sidebar');
    };

    // Make 'enter' key submit message
    let msg = document.getElementById("user_message");
    msg.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.key === 'Enter') {
            document.getElementById("send_message").click();
        }
    });
});