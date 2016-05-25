var Botkit   = require('botkit');
var httpRequest  = require('request');
var Firebase = require('firebase');
// var config = require('./config.js');


var accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
var verifyToken = process.env.FACEBOOK_VERIFY_TOKEN
var port        = process.env.PORT


// process.exit();

Firebase.initializeApp({
  serviceAccount: "iReport-Dev-d295383b217f.json",
  databaseURL: "https://ireport-dev.firebaseio.com/"
});

var fbDB = Firebase.database();
var ref = fbDB.ref("/messages");




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
    console.log("Webserver Ready");
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

  if (message.payload.startsWith('GetNumber')) {
    var place_id = message.payload.split('_')[1];
    bot.reply(message, place_id)
    httpRequest('https://maps.googleapis.com/maps/api/place/details/json?placeid='+place_id+'&key=AIzaSyBEDsria02odnrGQPz2Gj_MS_RwdoeG9rw', function(error, response, body){
      if (!error && response.statusCode == 200) {
          var details = JSON.parse(body);

          var phoneNumber = details.formatted_phone_number

          bot.reply(message, phoneNumber)

    }
  }


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

controller.on('message_received', function(bot, message) {
  var image     = false,
      location  = false,
      url = false,
      attachment,
      author    = message.user,
      timestamp = message.timestamp,
      text      = message.text,
      lat = false,
      long = false;

  console.log("MESSAGE: ", JSON.stringify(message));


  if (message.attachments && message.attachments.length > 0) {
    attachment = message.attachments[0];


    if (attachment.type === 'image') {
      if (!message.text)
        text = false

        image = attachment.payload.url
    }

    if (attachment.type === 'location' ) {
      if (!message.text)
        text = false

      if (attachment.title)
        text = attachment.title



      location = attachment.payload.coordinates
      url = attachment.url

      lat = location.lat;
      long = location.long;
      var type = "hospital"

      bot.reply(message, "Your Coords: " + lat + ", "+ long);
      httpRequest('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+ lat +','+ long +'&radius=10000&type='+type+'&key=AIzaSyBEDsria02odnrGQPz2Gj_MS_RwdoeG9rw', function(error, response, body){

        console.log("BODY: ", body);
        var hospitals = JSON.parse(body)

        if (hospitals.status !== "OK") {
            return;
        }

        // console.log("FIRST HOSPITAL: ", body.results[0].name);

        if (!error && response.statusCode == 200) {
          bot.reply(message, "These are the 3 nearest Hospitals");

          bot.reply(message, {
            "attachment":{
          "type":"template",
          "payload":{
            "template_type":"generic",
            "elements":[
              {
                "title": hospitals.results[0].name,
                "image_url": getPlacePhoto(hospitals.results[0]),
                "subtitle": hospitals.results[0].name,
                "buttons":[
                  {
                    "type":"web_url",
                    "url":"https://petersapparel.parseapp.com/view_item?item_id=100",
                    "title":"View Item"
                  },
                  {
                    "type":"web_url",
                    "url":"https://petersapparel.parseapp.com/buy_item?item_id=100",
                    "title":"Buy Item"
                  },
                  {
                    "type":"postback",
                    "title":"Get Phone Number",
                    "payload":"GetNumber_" + hospitals.results[0].place_id
                  }
                ]
              },
              {
                "title": hospitals.results[1].name,
                "image_url": getPlacePhoto(hospitals.results[1]),
                "subtitle": hospitals.results[1].vicinity,
                "buttons":[
                  {
                    "type":"web_url",
                    "url":"https://petersapparel.parseapp.com/view_item?item_id=101",
                    "title":"View Item"
                  },
                  {
                    "type":"web_url",
                    "url":"https://petersapparel.parseapp.com/buy_item?item_id=101",
                    "title":"Buy Item"
                  },
                  {
                    "type":"postback",
                    "title":"Bookmark Item",
                    "payload":"GetNumber_"+ hospitals.results[0].place_id
                  }
                ]
              }
            ]
          }
        }
      })
    }
      })
      // console.log(hospitals);
      // bot.reply(message, JSON.stringify(hospitals));






    }

  }

  ref.child("chats").push({
    author: author,
    timestamp: timestamp,
    text: text,
    image: image,
    location: location,
    url: url
  }, function(err){
    console.log("ERROR: ", err);
  })



    // carefully examine and
    // handle the message here!
    // Note: Platforms such as Slack send many kinds of messages, not all of which contain a text field!
});

function getPhoneNumber(placeId){

}

function getPlacePhoto(place){
  if (!place.photos) {
    return place.icon
  }
  const imageUrl = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference='+ place +'&key=AIzaSyBEDsria02odnrGQPz2Gj_MS_RwdoeG9rw'

  return imageUrl
}
