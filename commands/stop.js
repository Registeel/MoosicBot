var serverQueue;
module.exports =
{
    name: '~stop',
    description: 'stop!',
    execute(msg, queue) {
        serverQueue = queue.get(msg.guild.id);
        if (!msg.member.voiceChannel)
            return msg.channel.send(
                "You have to be in a voice channel to stop the music!"
            );
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    },
};
