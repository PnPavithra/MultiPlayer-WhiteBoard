export class NetworkManager
{
    constructor(socket)
    {
        this.socket = socket;
    }

    emit(eventName, data)
    {
        this.socket.emit(eventName, data);
    }

    on(eventName, callback)
    {
        this.socket.on(eventName, callback);
    }
}