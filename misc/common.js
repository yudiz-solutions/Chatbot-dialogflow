const config = require("../config")
const request = require("request-promise");


/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
const callSendAPI = async (messageData) => {
  let op = {
    uri: "https://graph.facebook.com/v3.0/me/messages",
    qs: {
      access_token: config.FB_PAGE_TOKEN
    },
    method: "POST",
    json: messageData
  };
  await request(op)
    .then(function (response, body) {
      if (response.statusCode == 200) {
        var recipientId = body.recipient_id;
        var messageId = body.message_id;

        if (messageId) {
          console.log(
            "Successfully sent message with id %s to recipient %s",
            messageId,
            recipientId
          );
        } else {
          console.log(
            "Successfully called Send API for recipient %s",
            recipientId
          );
        }
      }
    })
    .catch(function (error) {
      console.error(
        "Failed calling Send API",
        response.statusCode,
        response.statusMessage,
        body.error
      );
    });

}

module.exports = {
  callSendAPI
}