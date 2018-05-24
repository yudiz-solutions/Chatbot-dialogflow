const config = require("../config")
const request = require("request-promise");
var axios = require('axios');


/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
const callSendAPI = async (messageData) => {


  const url = "https://graph.facebook.com/v3.0/me/messages?access_token=" + config.FB_PAGE_TOKEN;
  await axios.post(url,messageData)
    .then(function (response) {
      if (response.statuse == 200) {
        var recipientId = response.data.recipient_id;
        var messageId = response.data.message_id;

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
        response.status,
        response.statusText 
      );
    });
  }

module.exports = {
  callSendAPI
}