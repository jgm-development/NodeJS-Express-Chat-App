import express from 'express';
import { Server } from "socket.io";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 1412
// const PORT = 1412;
const admin = "Admin";

const app = express();

app.use(express.static(path.join(__dirname, "public")));
// app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
});
const io = new Server(expressServer, {
    cors: { origin: ['*'] }
});
// state 
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray
    }
};

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`);

    //notify connection to user
    socket.emit('message', containerMsg(admin, "Welcome to Chat App!"));

    socket.on('enterRoom', ({ name, room }) => {
        debugger;
        // leaves the previous room 
        const prevRoom = getUser(socket.id)?.room;

        if (prevRoom) {
            socket.leave(prevRoom);
            io.to(prevRoom).emit('message', containerMsg(admin, `${name} has left the room`));
        }

        const user = activateUser(socket.id, name, room);

        // updates prev room after state update in activate user
        if (prevRoom) {
            io.to(prevRoom).emit('userList', {
                users: getUsersInRoom(prevRoom)
            });
        }

        // join room 
        socket.join(user.room);

        // notification message to User
        socket.emit('message', containerMsg(admin, `You have joined the ${user.room} chat room`));

        // to notify everyone
        socket.broadcast.to(user.room).emit('message', containerMsg(admin, `${user.name} has joined the room`));

        // update user list
        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room)
        });

        // notify the users for the room list
        io.emit('roomList', {
            rooms: getAllActiveRooms()
        });
    })

    //disconnect notification 
    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        userLeavesApp(socket.id);

        if (user) {
            io.to(user.room).emit('message', containerMsg(admin, `${user.name} has left the room`));

            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room)
            });

            io.emit('roomList', {
                rooms: getAllActiveRooms()
            });
        }

        console.log(`User ${socket.id} disconnected`);
    })

    //message event 
    socket.on('message', ({ name, text }) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            io.to(room).emit('message', containerMsg(name, text));
        }
    })

    //activity event
    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            socket.broadcast.to(room).emit('activity', name);
        }
    })
});

function containerMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).format(new Date())
    };
};

// User functions 
function activateUser(id, name, room) {
    const user = { id, name, room };
    UsersState.setUsers([...UsersState.users.filter(user => user.id !== id), user]);
    return user;
};

function userLeavesApp(id) {
    UsersState.setUsers(UsersState.users.filter(user => user.id !== id));
};

function getUser(id) {
    return UsersState.users.find(user => user.id === id);
};

function getUsersInRoom(room) {
    return UsersState.users.filter(user => user.room === room);
};

function getAllActiveRooms() {
    return Array.from(new Set(UsersState.users.map(user => user.room)));
};