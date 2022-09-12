const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear } = require('mineflayer-pathfinder').goals
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
const autoeat = require("mineflayer-auto-eat")
const cmd = require('mineflayer-cmd').plugin
const fs = require('fs');
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);
var lasttime = -1;
var moving = 0;
var connected = 0;
var actions = [ 'forward', 'back', 'left', 'right']
var lastaction;
var pi = 3.14159;
var moveinterval = 5; // 2 second movement interval
var maxrandom = 5; // 0-5 seconds added to movement interval (randomly)
var host = data["ip"];
var username = data["name"]
var nightskip = data["auto-night-skip"]

var bot = mineflayer.createBot({
  host: host,
  username: username
});

function getRandomArbitrary(min, max) {
       return Math.random() * (max - min) + min;

}

bot.loadPlugin(cmd)
bot.loadPlugin(pathfinder)
bot.loadPlugin(autoeat)

bot.on('login',function(){
	console.log("Logged In");
	bot.chat("Online 24/7h");
});

bot.on('time', function(time) {
	if(nightskip == "true"){
	if(bot.time.timeOfDay >= 13000){
	bot.chat('/time set day')
	}}
    if (connected <1) {
        return;
    }
    if (lasttime<5) {
        lasttime = bot.time.age;
    } else {
        var randomadd = Math.random() * maxrandom * 20;
        var interval = moveinterval*20 + randomadd;
        if (bot.time.age - lasttime > interval) {
            if (moving == 1) {
                bot.setControlState(lastaction,false);
                moving = 0;
                lasttime = bot.time.age;
            } else {
                var yaw = Math.random()*pi - (0.5*pi);
                var pitch = Math.random()*pi - (0.5*pi);
                bot.look(yaw,pitch,false);
                lastaction = actions[Math.floor(Math.random() * actions.length)];
                bot.setControlState(lastaction,true);
                moving = 1;
                lasttime = bot.time.age;
                bot.activateItem();
            }
        }
    }
});

bot.once('spawn', () => {
    const mcData = require('minecraft-data')(bot.version)
  
    const defaultMove = new Movements(bot, mcData)
    
    bot.on('chat', function(username, message) {
    
      if (username === bot.username) return
  
      const target = bot.players[username] ? bot.players[username].entity : null
      if (message === 'VemBoT') {
        if (!target) {
          bot.chat('E não te vejo! Preciso te ver pra isso!')
          return
        }
        const p = target.position
  
        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1))
      } 
    })

    bot.autoEat.options.priority = "foodPoints"
    bot.autoEat.options.bannedFood = ["golden_apple", "enchanted_golden_apple", "rotten_flesh"]
    bot.autoEat.options.eatingTimeout = 3
  })

bot.once('spawn', () => {
mineflayerViewer(bot, { port: 3007, firstPerson: true }) // port is the minecraft server port, if first person is false, you get a bird's-eye view
})

bot.on('spawn',function() {
    connected=1;
});

bot.on('death',function() {
    bot.emit("respawn")
});

bot.on("autoeat_started", () => {
  console.log("Auto Eat started!")
})

bot.on("autoeat_stopped", () => {
  console.log("Auto Eat stopped!")
})

bot.on("health", () => {
  if (bot.food === 20) bot.autoEat.disable()
  // Disable the plugin if the bot is at 20 food points
  else bot.autoEat.enable() // Else enable the plugin again
})

