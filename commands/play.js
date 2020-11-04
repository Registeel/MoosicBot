const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const request = require('request');
require('dotenv').config();
var serverQueue;


module.exports =
{
    name: '~play',
    description: 'Music!',
    async execute(msg, queue) {
        const args = msg.content.split(" ");
        var searchString = msg.content.substring(msg.content.indexOf(" "));
        serverQueue = queue.get(msg.guild.id);

        var express = require('express'); // Express web server framework
        var cors = require('cors');
        var querystring = require('querystring');
        var cookieParser = require('cookie-parser');

        var client_id = process.env.SPCLIENTID; // Your client id
        var client_secret = process.env.SPSCT; // Your secret
        var redirect_uri = 'https://google.ca/'; // Your redirect uri

        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                grant_type: 'client_credentials',
                client_id: client_id,
                client_secret: client_secret,
                scope: 'playlist-read-collaborative playlist-read-private'
            }
        }

        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel)
            return msg.channel.send(
                "You need to be in a voice channel to play music!"
            );
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return msg.channel.send(
                "I need the permissions to join and speak in your voice channel!"
            );
        }

        var access_token = '';
        if (msg.content.includes('spotify')) {
            var playlistString = "";
            if (msg.content.indexOf("?") != -1) {
                playlistString = msg.content.substring(msg.content.indexOf("playlist") + 9, msg.content.indexOf("?"));
            }
            else {
                playlistString = msg.content.substring(msg.content.indexOf("playlist") + 9);
            }

            var check = request.post(authOptions, function (error, response, body) {
                json = JSON.parse(body);
                access_token = json.access_token;

                var options = {
                    url: 'https://api.spotify.com/v1/playlists/' + playlistString,
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function (error, response, body) {

                    var spotifyQueueSearch = [];

                    var trackList = body.tracks.items;
                    for (var i = 0; i < trackList.length; i++) {
                        var spotifySearchString = "";
                        var track = trackList[i].track;
                        for (var j = 0; j < track.artists.length; j++) {
                            spotifySearchString += track.artists[j].name + " ";
                        }
                        spotifySearchString += track.name;    
                        spotifyQueueSearch.push(spotifySearchString);
                    }


                    for (var j = 0; j < spotifyQueueSearch.length; j++) {
                        setTimeout(() =>
                        {
                            addYT(spotifyQueueSearch, voiceChannel, msg, queue);
                            spotifyQueueSearch.shift();
                        }, 1000 * (j + 1)); 
                    }
                });

            });
        }
        //else if (msg.content.includes('&list=') && msg.content.includes('youtube')) {

        //}
        else {
            var ytSearchUrl = "";
            var ytTitle = "";

            console.log("Search String");
            console.log(searchString);
            request.get("https://www.youtube.com/results?search_query=" + searchString, function (error, response, body) {
                var indices = getIndicesOf("\"videoIds\"", body);
                var titleIndices = getIndicesOf("\"title\":{\"runs\":[{\"text\"", body);
                ytSearchUrl = "https://www.youtube.com/watch?v=" + body.substring(indices[0]+13, body.indexOf(',', indices[0])-2);
                ytTitle = body.substring(titleIndices[0] + 26, body.indexOf(',', titleIndices[0]) - 3);
                songHelper(ytTitle, ytSearchUrl, voiceChannel, msg, queue);
            });    
        }
        


    }
};

function play(guild, song, queue) {
    const sQ = queue.get(guild.id);
    if (!song) {
        sQ.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = sQ.connection
        .playStream(ytdl(song.url))
        .on("end", () => {
            sQ.songs.shift();
            play(guild, sQ.songs[0], queue);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(sQ.volume / 5);
    sQ.textChannel.send(`Now playing: **${song.title}**`);
}

function getIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

async function songHelper(ytTitle, ytSearchUrl, voiceChannel, msg, queue) {
    const song = {
        title: ytTitle,
        url: ytSearchUrl,
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 1,
            playing: true,
        };
        // Setting the queue using our contract
        queue.set(msg.guild.id, queueContruct);
        // Pushing the song to our songs array
        queueContruct.songs.push(song);

        serverQueue = queue.get(msg.guild.id);

        try {
            // Here we try to join the voicechat and save our connection into our object.
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            // Calling the play function to start a song
            play(msg.guild, queueContruct.songs[0], queue);
        } catch (err) {
            // Printing the error message if the bot fails to join the voicechat
            console.log(err);
            queue.delete(msg.guild.id);
            return msg.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return msg.channel.send(`${song.title} has been added to the queue!`);
    }
}

function addYT(spotifyQueueSearch, voiceChannel, msg, queue) {
    var url = encodeURI("https://www.youtube.com/results?search_query=" + spotifyQueueSearch[0]);
    request.get(url, function (error, response, body) {
        var indices = getIndicesOf("\"videoIds\"", body);
        var titleIndices = getIndicesOf("\"title\":{\"runs\":[{\"text\"", body);
        var ytSearchUrl = "https://www.youtube.com/watch?v=" + body.substring(indices[0] + 13, body.indexOf(',', indices[0]) - 2);
        var ytTitle = body.substring(titleIndices[0] + 26, body.indexOf(',', titleIndices[0]) - 3);
        songHelper(ytTitle, ytSearchUrl, voiceChannel, msg, queue);
    });
}