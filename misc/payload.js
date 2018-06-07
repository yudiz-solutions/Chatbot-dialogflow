const { callSendAPI } = require('./common')
const config = require("../config")
const request = require("request-promise");
const isDefined = (obj) => {
  if (typeof obj == "undefined") {
    return false;
  }

  if (!obj) {
    return false;
  }

  return obj != null;
}

const sendFbImageVideo = (recipientId, elements) => {
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "media",
          elements: elements
        }
      }
    }
  };
  callSendAPI(messageData)
}

const sendTextMessage = async (recipientId, text) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: text
    }
  };

  await callSendAPI(messageData);
}

/*
 * Send an image using the Send API.
 *
 */
const sendImageMessage = async (recipientId, imageUrl) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: imageUrl
        }
      }
    }
  };

  await callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
const sendGifMessage = async (recipientId) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: config.SERVER_URL + "/assets/instagram_logo.gif"
        }
      }
    }
  };

  await callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
const sendAudioMessage = async (recipientId) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: config.SERVER_URL + "/assets/sample.mp3"
        }
      }
    }
  };

  await callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example videoName: "/assets/allofus480.mov"
 */
const sendVideoMessage = async (recipientId, urlLink) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: urlLink
        }
      }
    }
  };

  await callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example fileName: fileName"/assets/test.txt"
 */
const sendFileMessage = async (recipientId, fileName) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: config.SERVER_URL + fileName
        }
      }
    }
  };

  await callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
const sendButtonMessage = async (recipientId, text, buttons) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: text,
          buttons: buttons
        }
      }
    }
  };

  await callSendAPI(messageData);
}

const sendGenericMessage = async (recipientId, elements) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: elements
        }
      }
    }
  };
  await callSendAPI(messageData);
}
const sendGraphTemplate = async (recipientId, elements) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "open_graph",
          elements: elements
        }
      }
    }
  };
  await callSendAPI(messageData);
}

const sendListMessege = async (recipientId, elements) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: elements
      }
    }
  };
  await callSendAPI(messageData);
}
const sendReceiptMessage = async (
  recipientId,
  recipient_name,
  currency,
  payment_method,
  timestamp,
  elements,
  address,
  summary,
  adjustments,
  order_url
 ) => {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = "order" + Math.floor(Math.random() * 1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: recipient_name,
          order_number: receiptId,
          currency: currency,
          payment_method: payment_method,
          order_url: order_url,
          timestamp: timestamp,
          address: address,
          summary: summary,
          adjustments: adjustments,
          elements: elements,
        }
      }
    }
  };

  await callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
const sendQuickReply = async (recipientId, text, replies, metadata) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: text,
      metadata: isDefined(metadata) ? metadata : "",
      quick_replies: replies
    }
  };

  await callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
const sendReadReceipt = async (recipientId) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  await callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
const sendTypingOn = (recipientId) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };
  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
const sendTypingOff = (recipientId) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
const sendAccountLinking = async (recipientId) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons: [
            {
              type: "account_link",
              url: config.SERVER_URL + "/authorize"
            }
          ]
        }
      }
    }
  };
  await callSendAPI(messageData);
}

const greetUserText = async (userId) => {
  //first read user firstname
  await request(
    {
      uri: "https://graph.facebook.com/v3.0/" + userId,
      qs: {
        access_token: config.FB_PAGE_TOKEN
      }
    },
    (error, response, body) => {
      if (!error && response.statusCode == 200) {
        var user = JSON.parse(body);

        if (user.first_name) {
          console.log(
            "FB user: %s %s, %s",
            user.first_name,
            user.last_name,
            user.gender
          );

          sendTextMessage(userId, "Welcome " + user.first_name + " " + user.last_name + " 😀 " + "! " + "I am Y-Assistant 🤖 Here to Help You.");
        } else {
          console.log("Cannot get data for fb user with id", userId);
        }
      } else {
        console.error(response.error);
      }
    }
  );
}

module.exports = {
  sendListMessege,
  sendGraphTemplate,
  sendTextMessage,
  sendImageMessage,
  sendGifMessage,
  sendAudioMessage,
  sendVideoMessage,
  sendFileMessage,
  sendButtonMessage,
  sendGenericMessage,
  sendReceiptMessage,
  sendQuickReply,
  sendReadReceipt,
  sendTypingOn,
  sendTypingOff,
  sendAccountLinking,
  greetUserText,
  isDefined,
  sendFbImageVideo
}