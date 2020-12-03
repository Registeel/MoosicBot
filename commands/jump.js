var serverQueue;
const constants = require('./constants.js');
module.exports =
{
    name: '~jump',
    description: 'jump!',
    execute(msg, queue) {
        serverQueue = queue.get(msg.guild.id);
        if (!msg.member.voiceChannel) {
            return msg.channel.send(
                "You have to be in a voice channel to jump the queue!"
            );
        }
        if (!serverQueue) {
            return msg.channel.send("There is nothing to jump to!");
        }
        var jumpVal = Number(msg.content.substring(msg.content.indexOf(" ")).trim());
        console.log("JumpVal: " + jumpVal);
        if (!Number.isInteger(jumpVal)) {
            msg.channel.send(jumpVal + " is not a number");
        }
        else if (jumpVal <= 0) {
            console.log("Queue below 1, set to 1");
            constants.CurrPlayIndex = 0;
        }
        else if (jumpVal > serverQueue.songs.length) {
            constants.CurrPlayIndex = serverQueue.songs.length - 1;
        }
        else {
            constants.CurrPlayIndex = jumpVal - 1;
        }
        constants.Jump = true;
        serverQueue.connection.dispatcher.end();
    },
};
