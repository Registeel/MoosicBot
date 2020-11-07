var serverQueue;
module.exports =
{
    name: '~queue',
    description: 'Show Queue',
    execute(msg, queue) {
        serverQueue = queue.get(msg.guild.id);
        var page = msg.content.split(" ");
        console.log(msg.content);
        console.log(page);
        console.log(page.length);
        var pageNum = page.length > 1 ? page[1] : 1;
        console.log("Page num after length check");
        console.log(pageNum);
        if (!Number.isInteger(+pageNum)) {
            pageNum = 1;
        }
        else if (pageNum < 0) {
            pageNum *= -1;
        }
        else if (pageNum == 0) {
            pageNum = 1;
        }

        var queueCalcNum = serverQueue.songs.length + 9;
        var numPages = (queueCalcNum - queueCalcNum % 10) / 10;

        pageNum = (pageNum - 1) * 10 > serverQueue.songs.length ? numPages : pageNum;
        var iModifier = (pageNum - 1) * 10;

        var queueString = "```\n";
        queueString += "Page " + pageNum + "/" + numPages + "\n";
        var loopLength = serverQueue.songs.length > iModifier + 10 ? iModifier + 10 : serverQueue.songs.length;
        iModifier = iModifier > serverQueue.songs.length ? songList.length - songList.length % 10 : iModifier;
        if (serverQueue) {
            for (i = iModifier; i < loopLength; i++) {
                var numInQueue = i + 1;
                queueString += "[" + numInQueue + "] " + serverQueue.songs[i].title + "\n";
            }
            queueString += "\n```";
            msg.channel.send(queueString);
        }
    },
};
