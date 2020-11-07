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
        var express = require('express'); // Express web server framework
        var cors = require('cors');
        var querystring = require('querystring');
        var cookieParser = require('cookie-parser');

        const args = msg.content.split(" ");
        var searchString = msg.content.substring(msg.content.indexOf(" "));
        serverQueue = queue.get(msg.guild.id);

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

        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //If the serverQueue does not exist we will create it here and not in the asynchronous play function that is getting hit with tons of requests on playlists
        //We will add all songs to the queue and start playing only once outside of loop logic.
        if (!serverQueue) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 1,
                playing: false
            };
            queue.set(msg.guild.id, queueConstruct);
        }
        serverQueue = queue.get(msg.guild.id);
        console.log("Server queue object");
        console.log(serverQueue);
        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////        

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

        var access_token = '';
        if (msg.content.includes('spotify')) {
            var playlistString = "";
            if (msg.content.indexOf("?") != -1) {
                playlistString = msg.content.substring(msg.content.indexOf("playlist") + 9, msg.content.indexOf("?"));
            }
            else {
                playlistString = msg.content.substring(msg.content.indexOf("playlist") + 9);
            }

            request.post(authOptions, function (error, response, body) {
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
                        spotifySearchString += "- " + track.name;    
                        spotifyQueueSearch.push(spotifySearchString);
                    }


                    for (var j = 0; j < spotifyQueueSearch.length; j++) {
                        setTimeout(() =>
                        {
                            addYT(spotifyQueueSearch[0]);
                            //console.log("Added " + spotifyQueueSearch[0] + " to queue");
                            spotifyQueueSearch.shift();
                        }, 1000 * (j + 1)); 
                    }
                    setTimeout(() => { startPlay(voiceChannel, msg, queue); },3000);
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

                addToQueue(ytTitle, ytSearchUrl);
                startPlay(voiceChannel, msg, queue);
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

    sQ.textChannel.send(`Now playing: **${song.title}**`);

    var options = {
        highWaterMark: 1<<25
    }
    const dispatcher = sQ.connection
        .playStream(ytdl(song.url, options))
        .on("end", () => {
            console.log("Hit song end");
            console.log("Hit song end in doneEnd");
            sQ.songs.shift();
            play(guild, sQ.songs[0], queue);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(sQ.volume / 5);    
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

async function startPlay(voiceChannel, msg, queue) {
    if (!serverQueue.playing) {
        try {
            // Here we try to join the voicechat and save our connection into our object.
            serverQueue.playing = true;
            var connection = await voiceChannel.join();
            serverQueue.connection = connection;
            // Calling the play function to start a song
            play(msg.guild, serverQueue.songs[0], queue);
        } catch (err) {
            // Printing the error message if the bot fails to join the voicechat
            console.log(err);
            queue.delete(msg.guild.id);
            return msg.channel.send(err);
        }
    }
}

function addToQueue(ytTitle, ytSearchUrl) {
    const song = {
        title: ytTitle,
        url: ytSearchUrl
    };
    serverQueue.songs.push(song);
}

function addYT(spotifyQueueSearchString) {
    var url = encodeURI("https://www.youtube.com/results?search_query=" + spotifyQueueSearchString);
    request.get(url, function (error, response, body) {
        var indices = getIndicesOf("\"videoIds\"", body);
        var titleIndices = getIndicesOf("\"title\":{\"runs\":[{\"text\"", body);
        var ytSearchUrl = "https://www.youtube.com/watch?v=" + body.substring(indices[0] + 13, body.indexOf(',', indices[0]) - 2);
        //var ytTitle = body.substring(titleIndices[0] + 26, body.indexOf(',', titleIndices[0]) - 3);
        var ytTitle = spotifyQueueSearchString;
        addToQueue(ytTitle, ytSearchUrl);
    });
}