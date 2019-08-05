const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)


const port = process.env.PORT || 3000

//define paths for Express config
const publicDiretoryPath = path.join(__dirname, '../public')

//setup static directory to serve
app.use(express.static(publicDiretoryPath))

io.on('connection', (socket) => {


    socket.on('join', (data, callback) => {
        const {error, user} = addUser( {id: socket.id, ...data} )

        if(error) {
            return callback(error)
            }
        socket.join(user.room)

        //welcome message
    socket.emit('messageToClient', generateMessage(user.username, 'Welcome!'))
    socket.broadcast.to(user.room).emit('messageToClient', generateMessage(user.username, user.username+' has joined!'))

    io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
    })
    })

    

    //recive y envia mensajes
    socket.on('messageToServer', (message, callback) => {
        const user = getUser(socket.id)
        filter = new Filter()
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('messageToClient', generateMessage(user.username ,message))
        callback()
    })

    //recive y envia ubicación
    socket.on('sendLocation', ({latitude, longitude}, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, 'https://google.com/maps?q='+ latitude + ','+ longitude))
        callback()
        })

        

    //disconnect message
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('messageToClient', generateMessage(user.username ,user.username+' has left!'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})



server.listen(port, () => {
    console.log('Running in port '+port)
})



