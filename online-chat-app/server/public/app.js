const socket = io('ws://localhost:1412');

var msgInput = document.querySelector('#msgContainer');
var activity = document.querySelector('.activity');
var usersList = document.querySelector('.userList');
var roomList = document.querySelector('.roomList');
var chatDisplay = document.querySelector('.chatContainer');
var form_2 = document.querySelector('.form-2');
var leaveChatRoom = document.querySelector('#btnLeaveChat');

function getQueryParam(param) {
    var params = new URLSearchParams(window.location.search);
    return params.get(param);
}

// Retrieve username and room
var nameInput = getQueryParam("username");
var chatRoom = getQueryParam("room");

function sendMessage(e) {
    e.preventDefault()
    if (nameInput && msgInput.value && chatRoom) {
        socket.emit('message', {
            name: nameInput,
            text: msgInput.value
        });
        msgInput.value = "";
    }
    msgInput.focus();
};
if (nameInput && chatRoom) {
    socket.emit('enterRoom', {
        name: nameInput,
        room: chatRoom
    });
}
if (form_2) {
    form_2.addEventListener('submit', sendMessage);
}

if (msgInput) {
    msgInput.addEventListener('keypress', () => {
        socket.emit('activity', nameInput);
    });
}

if (leaveChatRoom) {
    leaveChatRoom.addEventListener('click', () => {
        window.location.href = '/';
    });
}

// Listen for messages 
socket.on("message", (data) => {
    activity.textContent = "";
    const { name, text, time } = data;
    const li = document.createElement('li');
    li.className = 'post';
    if (name === nameInput) {
        li.className = 'post post--left';
    }
    if (name !== nameInput && name !== 'Admin') {
        li.className = 'post post--right';
    }
    if (name !== 'Admin') {
        li.innerHTML = `
        <div class="chatHeader ${name === nameInput ? 'chatHeaderUser' : 'chatHeaderReply'}">
            <span class="headerName">${name}</span> 
            <span class="headerTime">${time}</span> 
        </div>
        <div class="chatText">${text}</div>`;
    } else {
        li.innerHTML = `<div class="chatText">${text}</div>`;
    }
    document.querySelector('.chatContainer').appendChild(li);

    chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

var activityTimer
socket.on("activity", (name) => {
    activity.textContent = `${name} is typing...`;

    // Clear after 2 seconds 
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
        activity.textContent = ""
    }, 2000);
})

socket.on('userList', ({ users }) => {
    showUsers(users);
});

socket.on('roomList', ({ rooms }) => {
    showRooms(rooms);
});

function showUsers(users) {
    usersList.textContent = '';
    if (users) {
        usersList.innerHTML = `<span>${chatRoom}:</span>`;
        users.forEach((user, i) => {
            usersList.textContent += ` ${user.name}`;
            if (users.length > 1 && i !== users.length - 1) {
                usersList.textContent += ",";
            }
        })
    }
}

function showRooms(rooms) {
    roomList.textContent = '';
    if (rooms) {
        rooms.forEach((room, i) => {
            roomList.textContent += ` ${room}`;
            if (rooms.length > 1 && i !== rooms.length - 1) {
                roomList.textContent += ",";
            }
        })
    }
}