module.exports =
{
    name: 'leave',
    description: 'Leave',
    execute(msg, args) {
        console.log("leave server");
        console.log(msg.guild.id);
        msg.guild.leave();
    },
};
