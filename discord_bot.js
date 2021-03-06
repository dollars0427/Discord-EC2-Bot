const fs = require('fs');
const path = require('path');
const request = require('request');
const Common = require('./lib/common');
const Message = require('./lib/message');
const Aws = require('./lib/aws');

const configFile = fs.readFileSync(path.resolve(__dirname, './config.json'), 'utf8');
const config = JSON.parse(configFile);

//By default will check server had user each hour
const checkServerTime = config['checkServerTime'];

const discordToken = config['discordBotToken'];
const Discord = require('discord.js');
const client = new Discord.Client();

setInterval(function () {
  _checkValheimStatus();
}, checkServerTime);

//If the bot had been connected, show message
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

//Receive message
client.on('message', msg => {
    const command = Message.readCommand(msg.content);
    switch(command){
      case 'help':
      _getHelp(msg);
      break;

      case 'status':
      _checkStatus(msg);
      break;

      case 'start':
      _startServer(msg);
      break;

      case 'stop':
      _stopServer(msg);
      break;

      case 'choose':
      _choose(msg);
      break;
    }
});

client.login(discordToken);

function _getHelp(msg){
  let content = '目前指令：';
  content += '\n /status 檢查伺服器狀態';
  content += '\n /start 啟動伺服器';
  content += '\n /stop 停止伺服器';
  content += '\n /choose (選項) 機器人老師，幫我選擇！格式範例：選項1|選項2。';
  msg.reply(content);
}

async function _checkStatus(msg){
  const status = await Aws.checkStatus(request, config);

  let content = '遊戲伺服器目前狀態: ';

  if(status === 'running'){
    content += '正在運行✧◝(⁰▿⁰)◜✧';
  }else{
    content += '尚未啟動或正在啟動（¯﹃¯）';
  }
  msg.reply(content);
}

async function _startServer(msg){
  const startResult = await Aws.startServer(request, config);
  let content = '遊戲伺服器正在啟動。需時大約5-7分鐘左右！（請耐心等侯，維京人就是啟動得比較慢）';
  msg.reply(content);
}

async function _stopServer(msg){
  const stopResult = await Aws.stopServer(request, config);
  let content = '遊戲伺服器正在關閉。晚安✧*｡٩(ˊᗜˋ*)و✧*｡ ';
  msg.reply(content);
}

function _choose(msg){
  const chooseRegax = /^(\/choose) ([\s\S]*)$/;
  const optionsString = chooseRegax.exec(msg)[2];
  const options = optionsString.split('|');
  let content = '';
  if(options.length !== 0){
    const result = Common.choose(options);
    content = '隨機選擇結果：' + result;
  }else{
    content = '格式不符合！';
  }
  msg.reply(content);
}

async function _checkValheimStatus(){
  const statusUrl = config['valheimServerStatusUrl'];
  //If server do not had any player, stop the ec2 server
  const serverStatus = await Common.checkValheimStatus(request, statusUrl);
  if(serverStatus === 'non_playing'){
    console.log('Cannot detect any player. Stop Server...');
    await Aws.stopServer(request, config);
  }
}
