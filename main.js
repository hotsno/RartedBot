const Discord = require('discord.js');
const ping = require('minecraft-server-util');
const nconf = require('nconf');
const config = require('./config.json');
const private = require('./private.json');
const copypastas = require('./copypastas.json');
const valRanks = require('./valRanks.json');
const bot = new Discord.Client();
const PREFIX = '>';
const valEmojiIds = ['<:Iron1:705933781487321120>', "<:Iron2:705933781609218139>", "<:Iron3:705933781990899803>", "<:Bronze1:705933780103463033>", "<:Bronze2:705933779990085642>", "<:Bronze3:705933780027834389>", "<:Gold1:705933781605023824>", "<:Gold2:705933781726658630>", "<:Gold3:705933781881847970>", "<:Platinum:705933782305210408>", "<:Diamond:705933779977502722>", "<:Valorant:705933781940437091>"];
const valRanksList = ['Iron1', 'Iron2', 'Iron3','Bronze1', 'Bronze2', 'Gold1', 'Gold2', 'Gold3', 'Platinum1', 'Platinum2', 'Platinum3', 'Diamond1', 'Diamond2', 'Diamond3', 'Valorant'];

bot.on('ready', () => {
  console.log('Bot loaded');
  bot.user.setActivity('>help', { type: 'LISTENING' });
});

bot.on('message', msg => {
  let args = msg.content.substring(PREFIX.length).split(' ');

  if (msg.content.includes('<@!700847776778682468>')) help(args, msg);
  if (!msg.content.startsWith(PREFIX)) return;

  switch (args[0]) {
    case 'mc':
      mc(args, msg);
      break;

    case 'help':
      help(args, msg);
      break;

    case "clear":
      clear(args, msg);
      break;

    case "todo":
      todo(args, msg);
      break;

    case "copy":
      copy(args, msg);
      break;
    case "valorant":
      valorant(args, msg);
      break;
  }
});

// Gets Minecraft server info
function mc(args, msg) {
  // If no args give instructions
  if (!args[1]) {
    msg.reply('put the IP of the server after `>mc`!');
    return;
  }

  // Set port to 3rd arg, otherwise use default
  let port = 25565 // default port
  if (args[2]) {
    port = parseInt(args[2]);
  }

  // Get server information
  ping(args[1], 25565, (error, response) => {
    if (error) {
      msg.reply('this server does not use the default server port, or an incorrect IP was provided!')
      throw error;
    }
    // Embed with server information
    const embed = new Discord.MessageEmbed()
      .setColor('34e087')
      .setTitle('Server Status')
      .addField('IP', response.host)
      .addField('Port', response.port)
      .addField('Minecraft Version', response.version)
      .addField('Online Players', response.onlinePlayers)
      .addField('Max Players', response.maxPlayers);
    msg.channel.send(embed);
  })
}

// Sends a help embed
function help(args, msg) {
  if(args[1]) {
    helpSyntax(args, msg);
    return;
  }
  let embed = new Discord.MessageEmbed()
    .setAuthor('RartedBot', config.botPfp, config.rickroll)
    .setColor('c362d9')
    .addFields(
      { name: 'Syntax', value: '`>help <command>`', inline: true },
      { name: 'MC Server Status', value: '`>mc`', inline: true },
      { name: 'Clear', value: '`>clear`', inline: true },
      { name: 'To-do List', value: '`>todo`', inline: true },
      { name: 'Copypastas', value: '`>copy`', inline: true },
    )
    .setTimestamp()
    .setFooter('made by @sgg.#0001', config.botPfp)
  msg.channel.send(embed);
}

// Sends the syntax for commands
function helpSyntax(args, msg) {
  let syntax = "That's not a command! Check for typos.";
  let commandName;
  switch (args[1]) {
    case 'mc':
      syntax = 'Minecraft server status:\n`>mc [IP address] [port number (optional)]`';
      break;

    case 'clear':
      syntax = 'Clear messages:\n`>clear [number of items to clear]`';
      break;

    case 'todo':
      syntax = 'Add item to to-do list:\n`>todo [item to add to to-do list]`\n\nRemove item from to-do list:\n`>todo del [number of item in to-do list]`\n\nClear to-do list:\n`>todo clear`\n\nView to-do list:\n`>todo`';
      break;
    case 'copy':
      syntax = 'Select a copypasta:\n`>copy [copypasta name]`\n\nCopypasta names:\n```\n - bruh\n - quarantaang\n```';
  }
  msg.reply("\n" + syntax);
}

// Deletes messages
function clear(args, msg) {
  if (![args[1]]) {
    msg.reply("put the number of messages to clear after `>clear`!");
    return;
  }
  let x = Number(args[1]);
  while (x > 0) {
    if (x > 98) {
      msg.channel.bulkDelete(99);
      x = x - 99
    }
    else
      msg.channel.bulkDelete(x + 1);
    x = 0;
  }
}

// Manages to-do list
function todo(args, msg) {
  nconf.use('file', { file: './todo.json' });
  nconf.load();
  let id = msg.member.user.id;
  let add = msg.content.substring(6);

  if (!args[1]) { // Get to-do list
    sendTodo(args, msg);
  }
  else if (args[1] === 'clear') { // Clear to-do list
    nconf.set(id, []);
    nconf.save();
    msg.reply('Your to-do list has been cleared!');
  }
  else if (args[1] === 'del') { // Delete from to-do list
    if (!args[2]) {
      msg.reply('put the item number to delete after `>todo del`!');
      return;
    }
    let arr = nconf.get(id);
    arr.splice(args[2] - 1, 1);
    nconf.set(id, arr);
    msg.reply('Item ' + args[2] + ' has been deleted from your to-do list!');
  }
  else { // Add to to-do list
    if (nconf.get(id) == null) {  // If new user
      nconf.set(id, [add]);
    }
    else { // Not new user
      let arr = nconf.get(id);
      arr.push(add);
      nconf.set(id, arr);
    }
    sendTodo(args, msg);
  }
  nconf.save();
}

// Sends the to-do list message
function sendTodo(args, msg) {
  let id = msg.member.user.id;
  let add = msg.content.substring(6);
  if (nconf.get(id) == null || nconf.get(id).length == 0) { // Check if empty
    msg.reply("your to-do list is empty!");
    return;
  }
  let todo = '```\nTo-do list:\n';
  for (let i = 0; i < nconf.get(id).length; i++) {
    todo = todo + (i + 1) + ')   ' + nconf.get(id)[i] +'\n';
  }

  msg.channel.send(todo + '\n```');
  nconf.save();
}

function copy(args, msg) {
  if(!args[1]) {
    msg.reply('put the name of the copypasta after `>copy`!');
    return;
  }
  
  let text = 'Enter a valid copypasta name! Use `>help copy` to find available copypastas!';
  switch (args[1]) {
    case 'bruh':
      text = copypastas.bruh;
      break;
    case 'quarantaang':
      text = copypastas.quarantaang;
      break;
  }
  msg.channel.send(text);
}

function valorant(args, msg) {
  switch (args[1]) {
    case 'rank':
      valRank(args, msg);
      break;
  }
}

function valRank(args, msg) {
  nconf.use('file', { file: './valRanks.json' });
  nconf.load();
  let id = msg.member.user.id;
  if(args[2] == 'set') {
    if(!args[3]) {
      msg.reply('enter your rank! For help use `>help valorant set`');
      return;
    }
    if(!valRanksList.includes(args[3])) {
      msg.reply('invalid rank rank! For help use `>help valorant set`');
      return;
    }
    nconf.set(id, args[3]);
    nconf.save();
    console.log('here');
    return;
  }
  if(msg.mentions.users.first() !== undefined) id = msg.mentions.users.first().id;
  if(nconf.get(id) === undefined) {
    msg.channel.send('<@' + id + '> hasn\'t set their rank yet!');
    return;
  }
  var num = nconf.get(id).match(/\d+/g);
  var letr = nconf.get(id).match(/[a-zA-Z]+/g);
  msg.channel.send('<@' + id + '>\'s rank is ' + letr + ' ' + num + ' ' + valEmojiIds[valRanksList.indexOf(nconf.get(id))]);
}
bot.login(private.token);