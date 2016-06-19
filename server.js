var Botkit = require('botkit');
var httpRequest = require('request');
var Firebase = require('firebase');

var image = false,
    location = false,
    url = false,
    attachment,
    author = false
timestamp = false,
    text = false,
    lat = false,
    long = false;

// var config = require('./config.js');


var accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
var verifyToken = process.env.FACEBOOK_VERIFY_TOKEN
var port = process.env.PORT


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

controller.setupWebserver(port, function(err, webserver) {
    if (err) return console.log(err);

    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log("Webserver Ready");
    })

})

controller.hears(['help'], 'message_received', function(bot, message) {

    findHospital(bot, message);
})

controller.hears(['shutdown'], 'message_received', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [{
            pattern: bot.utterances.yes,
            callback: function(response, convo) {
                convo.say('Bye!');
                convo.next();
                setTimeout(function() {
                    process.exit();
                }, 3000);
            }
        }, {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }]);
    });
});

/*controller.on('facebook_postback', function(bot, message) {

    if (message.payload.startsWith('GetNumber')) {
        var place_id = message.payload.split('@')[1] || 'error getting place id';
        // bot.reply(message, JSON.stringify(message.payload));
        // console.log(JSON.stringify(message.payload))
        // console.log("Place ID: ", place_id );
        // bot.reply(message, place_id)
        httpRequest('https://maps.googleapis.com/maps/api/place/details/json?placeid=' + place_id + '&key=AIzaSyBEDsria02odnrGQPz2Gj_MS_RwdoeG9rw', function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var details = JSON.parse(body);

                var phoneNumber = details.result.formatted_phone_number
                    // console.log("Phone Number: " + phoneNumber)
                bot.reply(message, phoneNumber)
                return;

            }
        });

    }


})*/

controller.on('message_received', function(bot, message) {

    // console.log("MESSAGE: ", JSON.stringify(message));






    // ref.child("chats").push({
    //   author: author,
    //   timestamp: timestamp,
    //   text: text,
    //   image: image,
    //   location: location,
    //   url: url
    // }, function(err){
    //   console.log("ERROR: ", err);
    // })



    // carefully examine and
    // handle the message here!
    // Note: Platforms such as Slack send many kinds of messages, not all of which contain a text field!
});

function findHospital(bot, message) {

    bot.startConversation(message, function(err, convo) {

                // askHelpKind = function(response, convo) {
                        // convo.say("")
                        convo.ask({
                                "attachment": {
                                    "type": "template",
                                    "payload": {
                                        "template_type": "button",
                                        "text": "What Kind of Help Do You Need?",
                                        "buttons": [{
                                            "type": "postback",
                                            "url": "https://petersapparel.parseapp.com",
                                            "title": "Show Website"
                                        }, {
                                            "type": "postback",
                                            "title": "Get Nearest Hospital",
                                            "payload": "USER_DEFINED_PAYLOAD"
                                        }]
                                    }
                                },
                                function(response, convo) {
                                    convo.say("These are what I Found");
                                    convo.next();
                                    askLocation();
                                }
                        });

                        askLocation = function(response, convo) {
                            // convo.say('Please Attach your Location');

                            convo.ask("Please attach your location", function(response, convo) {

                                author = response.user
                                timestamp = response.timestamp
                                text = response.text

                                console.log("RESPONSE: ", response)
                                    // console.log("CONVO: ", convo);
                                if (response.attachments && response.attachments.length > 0) {
                                    attachment = response.attachments[0];


                                    if (attachment.type === 'image') {
                                        if (!message.text)
                                            text = false

                                        image = attachment.payload.url
                                    }


                                    if (attachment.type === 'location') {
                                        if (!message.text)
                                            text = false

                                        if (attachment.title)
                                            text = attachment.title



                                        location = attachment.payload.coordinates
                                        url = attachment.url

                                        lat = location.lat;
                                        long = location.long;
                                        var type = "hospital"

                                        // bot.reply(message, "Your Coords: " + lat + ", "+ long);
                                        httpRequest('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + lat + ',' + long + '&radius=10000&type=' + type + '&key=AIzaSyBEDsria02odnrGQPz2Gj_MS_RwdoeG9rw', function(error, resp, body) {

                                            // console.log("BODY: ", body);
                                            var hospitals = JSON.parse(body)

                                            if (hospitals.status !== "OK") {
                                                return;
                                            }

                                            // convo.say('These are the 2 Nearest Hospitals')

                                            // console.log("FIRST HOSPITAL: ", body.results[0].name);

                                            if (!error && resp.statusCode == 200) {
                                                convo.next();
                                                convo.say("These are the 3 nearest Hospitals");

                                                convo.ask({
                                                    "attachment": {
                                                        "type": "template",
                                                        "payload": {
                                                            "template_type": "generic",
                                                            "elements": [{
                                                                "title": hospitals.results[0].name,
                                                                "image_url": getPlacePhoto(hospitals.results[0]),
                                                                "subtitle": hospitals.results[0].name,
                                                                "buttons": [{
                                                                    "type": "web_url",
                                                                    "url": "https://www.google.com/maps/dir/Current+Location/" + hospitals.results[0].geometry.location.lat + "," + hospitals.results[0].geometry.location.lng,
                                                                    "title": "Get Directions"
                                                                }, {
                                                                    "type": "web_url",
                                                                    "url": "http://yahoo.com",
                                                                    "title": "Buy Item"
                                                                }, {
                                                                    "type": "postback",
                                                                    "title": "Get Phone Number",
                                                                    "payload": "GetNumber@" + hospitals.results[0].place_id
                                                                }]
                                                            }, {
                                                                "title": hospitals.results[1].name,
                                                                "image_url": getPlacePhoto(hospitals.results[1]),
                                                                "subtitle": hospitals.results[1].vicinity,
                                                                "buttons": [{
                                                                    "type": "web_url",
                                                                    "url": "https://www.google.com/maps/dir/Current+Location/" + hospitals.results[1].geometry.location.lat + "," + hospitals.results[1].geometry.location.lng,
                                                                    "title": "Get Directions"
                                                                }, {
                                                                    "type": "web_url",
                                                                    "url": "https://www.google.com/maps/dir/Current+Location/43.12345,-76.12345",
                                                                    "title": "Buy Item"
                                                                }, {
                                                                    "type": "postback",
                                                                    "title": "Bookmark Item",
                                                                    "payload": "GetNumber@" + hospitals.results[1].place_id
                                                                }]
                                                            }]
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                    }
                                }


                            }, function(response, convvo) {

                                convo.stop();
                            })
                        }

                        function getPhoneNumber(placeId) {

                        }

                        function getPlacePhoto(place) {
                            if (!place.photos) {
                                return place.icon
                            }

                            const imageUrl = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=' + place.photos[0].photo_reference + '&key=AIzaSyBEDsria02odnrGQPz2Gj_MS_RwdoeG9rw'
                            return imageUrl
                        }
