var Botkit = require('Botkit');

var accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
var verifyToken = process.env.FACEBOOK_VERIFY_TOKEN
var port = process.env.PORT

if (!accessToken) throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN is required but missing')
if (!verifyToken) throw new Error('FACEBOOK_VERIFY_TOKEN is required but missing')
if (!port) throw new Error('PORT is required but missing')

var controller = Botkit.facebookbot({
  access_token: accessToken,
  verify_token: verifyToken
})

var bot = controller.spawn()

controller.setupWebserver(port, function(err, webserver){
  if(err) return console.log(err);

  controller.createWebhookEndpoints(webserver, bot, function(){
    console.log('Ready Player 1');
  })

})

controller.hears(['hello', 'hi'], 'message_received', function (bot, message){
  bot.reply(message, 'Ey man!')
  bot.reply(message, "What's good?")
  bot.reply(message, {
    attachment:{
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'Which do you prefer',
        buttons: [
          {
            type: 'postback',
            title: 'Cats',
            payload: 'show_cat'
          },
          {
            type: 'postback',
            title: 'Dogs',
            payload: 'show_dog'
          }
      ]
      }
    }
  })
})

controller.on('facebook_postback', function(bot, message){
  switch (message.payload) {
    case 'show_cat':
      bot.reply(message, {
        attachment: {
          type: 'image',
          payload:{
            url: 'https://media.giphy.com/media/F69JmzpmSaffi/giphy.gif'
          }
        }
      })
      break;

    case 'show_dog':
      bot.reply(message, {
        attachment: {
          type: 'image',
          payload:{
            url: 'https://media.giphy.com/media/J3ODsTxAB7U7m/giphy.gif'
          }
        }
      })
      break;

  }
})
