require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const botCommands = require('./commands');
const queue = new Map();
const currPlayIndex = 0;

Object.keys(botCommands).map(key => {
  bot.commands.set(botCommands[key].name, botCommands[key]);
});

const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', async msg => {
    //Ignore messages from bot
    if (msg.author.bot) return;

    const args = msg.content.split(/ +/);
    const command = args.shift().toLowerCase();

    console.info(`Called command: ${command}`);

    if (!bot.commands.has(command)) return;

    try {
        var passArgs = args;
        console.log(command);
        if (command.includes('~')) {
            bot.commands.get(command).execute(msg, queue);
        }
        else {
            bot.commands.get(command).execute(msg, passArgs);
        }
    } catch (error) {
        console.error(error);
        msg.reply('there was an error trying to execute that command!');
    }
});
