var serverQueue;
module.exports =
{
    name: '~skip',
    description: 'skip!',
    execute(msg, queue) {
        serverQueue = queue.get(msg.guild.id);
        if (!msg.member.voiceChannel) {
            return msg.channel.send(
                "You have to be in a voice channel to stop the music!"
            );
        }
        if (!serverQueue) {
            return msg.channel.send("There is no song that I could skip!");
        }
        console.log("ServerQueue Connection Object");
        console.log(serverQueue.connection);
        console.log("ServerQueue Connection Dispatcher Object");
        console.log(serverQueue.connection.dispatcher);
        serverQueue.connection.dispatcher.end();
    },
};
