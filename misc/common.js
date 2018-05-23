const config = require("../config")
const request = require("request-promise");
var needle = require('needle');


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

  // var url = "https://graph.facebook.com/v2.6/me/messages?access_token=EAADfiWXfoY8BAPIsS0TeU49pMsLwb4zEvgFJXsHIuiFSJFrPP3zZBEzHlaG0BPuV330v10ZBnZAmGDXonhDUYpFbUZBFUAwqCvdnEJTSoMxU0Ozsd7ZALcpVt40xIs27a81afSsZABLt7nXUxHYGraw00bq2qZBCQbgZBc2kQ2EL0wZDZD"
  // needle.post(url,messageData)
  // .on('readable',function (chunks)  {
  //   console.log(chunks);

  // }).on('done',function (err,resp) {
  //   console.log('Ready-o!');

  // })

module.exports = {
  callSendAPI
}