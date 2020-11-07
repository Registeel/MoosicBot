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
        console.log("Hit dispatcher end in skip");
        console.log("serverQueue connection in skip");
        console.log(serverQueue.connection.player);
        serverQueue.connection.dispatcher.end();
    },
};
