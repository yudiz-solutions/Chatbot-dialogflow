"use strict";

const apiai = require("apiai");
const config = require("./config");
const express = require("express");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const request = require("request-promise");
const app = express();
const uuid = require("uuid");
const mongoose = require("mongoose");
const logger = require("morgan");
const db = require("./config/db");
var emoji = require("node-emoji");

const { sendListMessege,sendGraphTemplate, greetUserText, sendFbImageVideo, isDefined, sendAccountLinking, sendAudioMessage, sendButtonMessage, sendFileMessage, sendGenericMessage, sendGifMessage, sendImageMessage, sendQuickReply, sendReadReceipt, sendReceiptMessage, sendTextMessage, sendTypingOff, sendTypingOn, sendVideoMessage } = require("./misc/payload")
const { callSendAPI } = require("./misc/common")
const cli = require('./config/cli').console
/**
 * DEBUG=http NODE_ENV=dev nodemon app.js // Run Command
 *  Image ratio: 1.91:1
    Recommended image size: 1200 x 628 px
    Minimum image size: 560 x 292 px
 */
// Messenger API parameters
if (!config.FB_PAGE_TOKEN) {
  throw new Error("missing FB_PAGE_TOKEN");
}
if (!config.FB_VERIFY_TOKEN) {
  throw new Error("missing FB_VERIFY_TOKEN");
}
if (!config.API_AI_CLIENT_ACCESS_TOKEN) {
  throw new Error("missing API_AI_CLIENT_ACCESS_TOKEN");
}
if (!config.FB_APP_SECRET) {
  throw new Error("missing FB_APP_SECRET");
}
if (!config.SERVER_URL) {
  //used for ink to static files
  throw new Error("missing SERVER_URL");
}
app.use(logger("dev"));

app.set("port", process.env.PORT || 5000);

//verify request came from facebook
// app.use(bodyParser.json({
// 	verify: verifyRequestSignature
// }));

//serve static files in the public directory
app.use(express.static("public"));

// Process application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

// Process application/json
app.use(bodyParser.json());

const apiAiService = apiai(config.API_AI_CLIENT_ACCESS_TOKEN, {
  language: "en",
  requestSource: "fb"
});
const sessionIds = new Map();

// Index route
app.get("/", function (req, res) {
  res.send("Hello world, I am a chat bot");
});

// for Facebook verification
app.get("/webhook/", function (req, res) {
  console.log("request");
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === config.FB_VERIFY_TOKEN
  ) {
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post("/webhook/", function (req, res) {
  var data = req.body;
  // console.log(JSON.stringify(data));

  // Make sure this is a page subscription
  if (data.object == "page") {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function (pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log(
            "Webhook received unknown messagingEvent: ",
            messagingEvent
          );
        }
      });
    });

    // Assume all went well.
    // You must send back a 200, within 20 seconds
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  if (!sessionIds.has(senderID)) {
    sessionIds.set(senderID, uuid.v1());
  }
  //console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
  //console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    handleEcho(messageId, appId, metadata);
    return;
  } else if (quickReply) {
    handleQuickReply(senderID, quickReply, messageId);
    return;
  }

  if (messageText) {
    //send message to api.ai
    sendToApiAi(senderID, messageText);
  } else if (messageAttachments) {
    handleMessageAttachments(messageAttachments, senderID);
  }
}

function handleMessageAttachments(messageAttachments, senderID) {
  console.log(messageAttachments);

  //for now just reply
  sendTextMessage(senderID, "Attachment received. Thank you.");
}

function handleQuickReply(senderID, quickReply, messageId) {
  var quickReplyPayload = quickReply.payload;
  console.log(
    "Quick reply for message %s with payload %s",
    messageId,
    quickReplyPayload
  );
  //send payload to api.ai
  sendToApiAi(senderID, quickReplyPayload);
}

//https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo
function handleEcho(messageId, appId, metadata) {
  // Just logging message echoes to console
  console.log(
    "Received echo for message %s and app %d with metadata %s",
    messageId,
    appId,
    metadata
  );
}

function handleApiAiAction(sender, action, responseText, contexts, parameters) {
  cli.magenta(action)
   switch (action) {
    case "send-graph" :
      case "SENDGRAPH":
      const graphEle = [{
        "url": "https://open.spotify.com/album/1XbZ2tMfcQTbVkr55JnoRg",
        "buttons": [
          {
            "type": "web_url",
            "url": "https://en.wikipedia.org/wiki/Rickrolling",
            "title": "View More"
          }
        ]     
      }]  
      sendGraphTemplate(sender,graphEle);
     break;
    case "send-text":
     case "SENDTEXT":
      const text = "This is example of Text message."
      sendTextMessage(sender, text);
      break;
    case "sedn-quick-reply":
     case "SENDQUICKREPLY":
      const textRp = "Choose the oprions"
      const replies = [{
        "content_type": "text",
        "title": "1",
        "payload": "Example 1",
      },
      {
        "content_type": "text",
        "title": "2",
        "payload": "Example 2",
      },
      {
        "content_type": "text",
        "title": "3",
        "payload": "Example 3",
      }];
      sendQuickReply(sender, textRp, replies)
      break;
    case "send-photo":
     case "SENDIMAGE":
      const imgUrl = "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/881e6651881085.58fd911b65d88.png";
      sendImageMessage(sender, imgUrl);
      break;
    case "send-button":
     case "SENDBUTTON":
      const bText = "exmple buttons";
      const buttons = [{
        "type": "web_url",
        "url": "https://f1948e04.ngrok.io",
        "title": "URL",
      }, {
        "type": "postback",
        "title": "POSTBACK",
        "payload": "POSTBACK TEST"
      }, {
        "type": "phone_number",
        "title": "CALL",
        "payload": "+919510733999"
      }]
      sendButtonMessage(sender, bText, buttons)
      break;
    case "send-carousel" :
      case "SENDCAROUSEL" :   
      const elements = [{
        "title": "Welcome!",
        "subtitle": "We have the right hat for everyone.We have the right hat for everyone.We have the right hat for everyone.",
        "imageUrl": "https://www.stepforwardmichigan.org/wp-content/uploads/2017/03/step-foward-fb-1200x628-house.jpg",
        "buttons": [
          {
            "postback": "https://f1948e04.ngrok.io",
            "text": "View Website"
          }, {
            "text": "Start Chatting",
            "postback": "PAYLOAD EXAMPLE"
          }
        ]
      }, {
        "title": "Welcome!",
        "imageUrl": "https://www.stepforwardmichigan.org/wp-content/uploads/2017/03/step-foward-fb-1200x628-house.jpg",
        "subtitle": "We have the right hat for everyone.We have the right hat for everyone.We have the right hat for everyone.",
        "buttons": [
          {
            "postback": "https://f1948e04.ngrok.io",
            "text": "View Website"
          }, {
            "text": "Start Chatting",
            "postback": "PAYLOAD EXAMPLE"
          }
        ]
      }];
      handleCardMessages(elements, sender)
      break;

    case "send-media":
     case "SENDMEDIA":
      const messageData = [
        {
          "media_type": "image",
          "url": "https://www.facebook.com/photo.php?fbid=1013368485505320&set=pcb.1013368562171979&type=3&theater  ",
          "buttons": [
            {
              "type": "web_url",
              "url": "https://f1948e04.ngrok.io",
              "title": "View Website",
            }
          ]
        }
      ]      
      const elm = [
        {
          "media_type": "video",
          "url": "https://www.facebook.com/FacebookIndia/videos/1709899462380301"
          , "buttons": [
            {
              "type": "web_url",
              "url": "http://google.com",
              "title": "View Website",
            }
          ]
        }
      ]
      async function sendMedia() {
        await sendFbImageVideo(sender, elm);
        await sendFbImageVideo(sender, messageData);
      }
      sendMedia();
      break;

    case "send-receipt":
     case "SENDRECEIPT":
       const recipient_name = "Nikhil Savaliya";
       const currency = "INR";
       const payment_method = "Visa 2345";
       const timestamp = 1428444852;
       const elementRec = [{
         "title": "Classic Blue T-Shirt",
         "subtitle": "100% Soft and Luxurious Cotton",
         "quantity": 1,
         "price": 350,
         "currency": "INR",
         "image_url": "http://pngimg.com/uploads/tshirt/tshirt_PNG5450.png"
       }];
       const address = {
         "street_1": "A-6, First Floor",
         "street_2": "Safal Profitaire,",
         "city": "Ahmedabad",
         "postal_code": "380015",
         "state": "Gujarat",
         "country": "IN"
       };
       const summary = {
         "subtotal": 350.00,
         "shipping_cost": 4.95,
         "total_tax": 6.19,
         "total_cost": 361.14
       };
       const adjustments = [
         {
           "name": "New Customer Discount",
           "amount": 20
         },
         {
           "name": "$10 Off Coupon",
           "amount": 10
         }
       ];
       const order_url = "https://37cf1e51.ngrok.io"
       sendReceiptMessage(sender,
         recipient_name,
         currency,
         payment_method,
         timestamp,
         elementRec,
         address,
         summary,
         adjustments,
         order_url);
      break;
    case "send-list":
       const list = {
         "template_type": "list",
         "top_element_style": "compact",
         "elements": [
           {
             "title": "Classic T-Shirt Collection",
             "subtitle": "See all our colors",
             "image_url": "http://pngimg.com/uploads/tshirt/tshirt_PNG5450.png",
             "buttons": [
               {
                 "title": "View",
                 "type": "web_url",
                 "url": "https://yudiz-bot.herokuapp.com/collection",
                 "messenger_extensions": true,
                 "webview_height_ratio": "tall",
                 "fallback_url": "https://yudiz-bot.herokuapp.com"
               }
             ]
           },
           {
             "title": "Classic White T-Shirt",
             "subtitle": "See all our colors",
             "default_action": {
               "type": "web_url",
               "url": "https://yudiz-bot.herokuapp.com/view?item=100",
               "messenger_extensions": false,
               "webview_height_ratio": "tall"
             }
           },
           {
             "title": "Classic Blue T-Shirt",
             "image_url": "http://pngimg.com/uploads/tshirt/tshirt_PNG5450.png",
             "subtitle": "100% Cotton, 200% Comfortable",
             "default_action": {
               "type": "web_url",
               "url": "https://yudiz-bot.herokuapp.com/view?item=101",
               "messenger_extensions": true,
               "webview_height_ratio": "tall",
               "fallback_url": "https://yudiz-bot.herokuapp.com"
             },
             "buttons": [
               {
                 "title": "Shop Now",
                 "type": "web_url",
                 "url": "https://yudiz-bot.herokuapp.com/shop?item=101",
                 "messenger_extensions": true,
                 "webview_height_ratio": "tall",
                 "fallback_url": "https://yudiz-bot.herokuapp.com"
               }
             ]
           }
         ],
         "buttons": [
           {
             "title": "View More",
             "type": "postback",
             "payload": "payload"
           }
         ]
       }
       sendListMessege(sender,list)
    break;
    
      default:
      //unhandled action, just send back the text
      sendTextMessage(sender, responseText);
  }
}

function handleMessage(message, sender) {
  switch (message.type) {
    case 0: //text
      sendTextMessage(sender, message.speech);
      break;
    case 2: //quick replies
      let replies = [];
      for (var b = 0; b < message.replies.length; b++) {
        let reply = {
          content_type: "text",
          title: message.replies[b],
          payload: message.replies[b]
        };
        replies.push(reply);
      }
      sendQuickReply(sender, message.title, replies);
      break;
    case 3: //image
      sendImageMessage(sender, message.imageUrl);
      break;
    case 4:
      // custom payload
      var messageData = {
        recipient: {
          id: sender
        },
        message: message.payload.facebook
      };
      callSendAPI(messageData)
      break;
  }
}

async function handleCardMessages(messages, sender) {
  let elements = [];
  for (var m = 0; m < messages.length; m++) {
    let message = messages[m];
    let buttons = [];
    for (var b = 0; b < message.buttons.length; b++) {
      let isLink = message.buttons[b].postback.substring(0, 4) === "http";
      let button;
      if (isLink) {
        button = {
          type: "web_url",
          title: message.buttons[b].text,
          url: message.buttons[b].postback
        };
      } else {
        button = {
          type: "postback",
          title: message.buttons[b].text,
          payload: message.buttons[b].postback
        };
      }
      buttons.push(button);
    }

    let element = {
      title: message.title,
      image_url: message.imageUrl,
      subtitle: message.subtitle,
      buttons: buttons
    };
    elements.push(element);
  }
  await sendGenericMessage(sender, elements);
}

function handleApiAiResponse(sender, response) {
  let responseText = response.result.fulfillment.speech;
  let responseData = response.result.fulfillment.data;
  let messages = response.result.fulfillment.messages;
  let action = response.result.action;
  let contexts = response.result.contexts;
  let parameters = response.result.parameters;

  sendTypingOff(sender);

  if (
    isDefined(messages) &&
    ((messages.length == 1 && messages[0].type != 0) || messages.length > 1)
  ) {
    let timeoutInterval = 1500;
    let previousType;
    let cardTypes = [];
    let timeout = 0;
    for (var i = 0; i < messages.length; i++) {
      if (
        previousType == 1 &&
        (messages[i].type != 1 || i == messages.length - 1)
      ) {
        timeout = (i - 1) * timeoutInterval;
        setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
        cardTypes = [];
        timeout = i * timeoutInterval;
        setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
      } else if (messages[i].type == 1 && i == messages.length - 1) {
        cardTypes.push(messages[i]);
        timeout = (i - 1) * timeoutInterval;
        setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
        cardTypes = [];
      } else if (messages[i].type == 1) {
        cardTypes.push(messages[i]);
      } else {
        timeout = i * timeoutInterval;
        setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
      }

      previousType = messages[i].type;
    }
  } else if (responseText == "" && !isDefined(action)) {
    //api ai could not evaluate input.
    console.log("Unknown query" + response.result.resolvedQuery);
    sendTextMessage(
      sender,
      "I'm not sure what you want. Can you be more specific?"
    );
  } else if (isDefined(action)) {
    handleApiAiAction(sender, action, responseText, contexts, parameters);
  } else if (isDefined(responseData) && isDefined(responseData.facebook)) {
    try {
      console.log("Response as formatted message" + responseData.facebook);
      sendTextMessage(sender, responseData.facebook);
    } catch (err) {
      sendTextMessage(sender, err.message);
    }
  } else if (isDefined(responseText)) {
    sendTextMessage(sender, responseText);
  }
}

function sendToApiAi(sender, text) {
  // sendTypingOn(sender);
  let apiaiRequest = apiAiService.textRequest(text, {
    sessionId: sessionIds.get(sender)
  });

  apiaiRequest.on("response", response => {
    if (isDefined(response.result)) {
      handleApiAiResponse(sender, response);
    }
  });

  apiaiRequest.on("error", error => console.error(error));
  apiaiRequest.end();
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {
  console.log(event);

  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;
  cli.blue(payload);
  handleApiAiAction(senderID, payload, "", "", "")
  switch (payload) {
    case "FACEBOOK_WELCOME":
      greetUserText(senderID);
      break;
  }
  console.log(
    "Received postback for user %d and page %d with payload '%s' " + "at %d",
    senderID,
    recipientID,
    payload,
    timeOfPostback
  );

}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;
  console.log(
    "Received message read event for watermark %d and sequence " + "number %d",
    watermark,
    sequenceNumber
  );

}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log(
    "Received account link event with for user %d with status %s " +
    "and auth code %s ",
    senderID,
    status,
    authCode
  );
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function (messageID) {
      console.log(
        "Received delivery confirmation for message ID: %s",
        messageID
      );

    });
  }
  console.log("All message before %d were delivered.", watermark);

}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log(
    "Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d",
    senderID,
    recipientID,
    passThroughParam,
    timeOfAuth
  );

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

// Spin up the server
app.listen(app.get("port"), function () {
  console.log("Magic Started on port", app.get("port"));
});
