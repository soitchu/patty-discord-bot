const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const bot = new Client({ intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.MessageContent
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

const snakeClass = require("./snake.js");
const duelClass = require("./duel.js");

const prefix = "!";
const TOKEN = process.env.TOKEN;
const snakeData = {};
const duelData = {};


bot.login(TOKEN);
bot.on("ready", () => {
    console.log(`Logged in as ${bot.user.tag}!`);
});


function replyToMessage(msg, player1 = 0, player2 = 0) {

    return new Promise(function(resolve, reject) {
        try {
            let reply = "Loading...";
            if (player1 != 0 && player2 != 0) {
                reply = player1 + " is 🐨 and " + player2 + " is 🐼";
            }

            msg.reply(reply).then(function(x) {
                resolve(x);
            }).catch(function() {
                reject("err");
            });

        } catch {
            reject("err");
        }
    });

}

async function snakeIni(channelID, msg, timeoutInterval) {
    try {
        let channelData = snakeData[channelID];
        let mainMessage = await replyToMessage(msg);
        await Promise.all([mainMessage.react("⬅"), mainMessage.react("⬆"), mainMessage.react("⬇"),mainMessage.react("➡")]);
        channelData.message = mainMessage;     
        thisGameClass = new snakeClass(channelID, msg.author.id, timeoutInterval, snakeData);
        channelData.gameClass = thisGameClass;
        channelData.check = 1;    
    } catch (err) {
        console.error(err);
        snakeData[channelID].check = 0;
        return "err";
    }
}



async function duelIni(channelID, msg, timeoutInterval) {
    try {
        let channelData = duelData[channelID];
        let mainMessage = await replyToMessage(msg, channelData.player1.name, channelData.player2.name);
        channelData.message = mainMessage;
        channelData.gameClass = new duelClass(channelID, duelData, timeoutInterval);
        let promiseArray = [[mainMessage.react("⬅"),mainMessage.react("⬆"),mainMessage.react("⬇"), mainMessage.react("➡"), mainMessage.react("🍎"), mainMessage.react("🍏"), mainMessage.react("🛑")]];
        await (Promise.all(promiseArray)); 
        channelData.check = 1;     
    } catch (err) {
        console.error(err);
        duelData[channelID].check = 0;
        return "err";
    }
}


bot.on("messageCreate", msg => {
    if (msg.author.bot) {
        return;
    }

    let channelID = msg.channel.id;
    let guildID = msg.guild.id;
    let authorID = msg.author.id;
    let msgContent = msg.content;
    
    if(channelID && guildID && authorID){
        if(msgContent.startsWith(`${prefix}snake`)){
            let timeoutInterval;
            try {
                timeoutInterval = parseInt(msg.content.split(" ")[1]);
    
                if (isNaN(timeoutInterval)) {
                    timeoutInterval = 2000;
                } else if (timeoutInterval > 2000 || timeoutInterval < 1000) {
                    timeoutInterval = 2000;
                }
            } catch {
                timeoutInterval = 2000;
            }
    
            try {    
                if (channelID in snakeData && snakeData[channelID].check == 1) { 
                    return;    
                }
                else if (channelID in duelData && duelData[channelID].check == 1){
                    return;
                }
                else if (!(channelID in snakeData) || snakeData[channelID].check == 0) {
                    snakeData[channelID] = {};
                    snakeData[channelID].author = msg.author.id;
                    try {
                        snakeIni(channelID, msg, timeoutInterval);
                    } catch {
                        snakeData[channelID] = {};
                    }    
                }
            } catch (err) {
                return;
            }
        }
        else if (msgContent.startsWith(`${prefix}duel`)) {
            let timeoutInterval;
            try {
                timeoutInterval = parseInt(msg.content.split(" ")[1]);
    
                if (isNaN(timeoutInterval)) {
                    timeoutInterval = 2000;
                } else if (timeoutInterval > 2000 || timeoutInterval < 1000) {
                    timeoutInterval = 2000;
                }
            } catch {
                timeoutInterval = 2000;
            }

            try {
                if (channelID in snakeData && snakeData[channelID].check == 1) { 
                    return;    
                }
                else if (channelID in duelData && duelData[channelID].check == 1){
                    return;
                }else if(!(channelID in duelData) || duelData[channelID].check == 0) {
                    let secondPlayer;
                    try {
                        secondPlayer = msg.mentions.users.first();
                        if (secondPlayer === undefined) {
                            msg.reply("You must mention someone to duel with.");
                            return;
                        }
                    }catch(err){
                        return;
                    }

                    
                    if (secondPlayer.id === msg.author.id) {
                        msg.reply("You can't play with yourself!").then((err) => {}).catch((err) => {
                            console.error(err);
                        });
                        return;
                    }

                    duelData[channelID] = {};
                    duelData[channelID].player1 = {
                        "id" : msg.author.id,
                        "name" : msg.author.username + "#" + msg.author.discriminator
                    };

                    duelData[channelID].player2 = {
                        "id" : secondPlayer.id,
                        "name" : secondPlayer.username + "#" + secondPlayer.discriminator
                    };

                    duelData[channelID].check = 3;

                    msg.channel.send("<@" + secondPlayer.id + ">, <@" + msg.author.id + "> invited you to a duel. Type `!duel` to accept. ").then((x) => console.log()).catch(function(err) { console.log(err); });

                    duelData[channelID].timeout = setTimeout(function() {
                        duelData[channelID] = {};
                        duelData[channelID].check = 0;
                        msg.reply("This is sad; nobody responded.").then((x) => console.log(x)).catch((err) => console.error(err));
                    }, 20000);

                } else if (channelID in duelData && duelData[channelID].check == 3 && duelData[channelID].player2.id === msg.author.id) {
                    clearTimeout(duelData[channelID].timeout);
                    try {
                        duelIni(channelID, msg, timeoutInterval);
                    } catch(err) {
                        console.error(err);
                        duelData[channelID] = {};
                    }
                }
            } catch (err) {
                console.error(err);
                return;
            }
        }
    }
});