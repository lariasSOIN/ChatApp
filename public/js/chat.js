const socket = io()

//Elements
const $messageForm = document.querySelector('#submit')
const $messageFormInput = document.querySelector('input')
const $messageFormButtom = document.querySelector('button')
const $locationButtom = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoScroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}

//leer mensaje
socket.on('messageToClient', ({ username, text, createAt }) => {
    const html = Mustache.render(messageTemplate, {
        username,
        message: text,
        createAt: moment(createAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

//leer ubicación
socket.on('locationMessage', ({ username, url, createAt }) => {
    console.log(url)
    const html = Mustache.render(locationTemplate, {
        username,
        url,
        createAt: moment(createAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})


//recivir rooms
socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate,{
        room, users
    })
    document.querySelector('#sidebar').innerHTML = html
})


//envia mensaje
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    //disable button
    $messageFormButtom.setAttribute('disabled', 'disabled')
    const message = document.querySelector('#input');
    socket.emit('messageToServer', message.value, (error) => {
        //enable buton
        $messageFormButtom.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error) {
            return console.log(error)
        }
        console.log('The message was delivered!')
    })
})


//envia ubicacion
$locationButtom.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    //disable button
    $locationButtom.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        //enable button
        $locationButtom.removeAttribute('disabled')

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {
            if(error) {
                return console.log(error)
            }
            console.log('Location shared!')
        })
    })
})
socket.emit('join', { username, room }, (error) => {
    alert(error)
    location.href = '/'
})