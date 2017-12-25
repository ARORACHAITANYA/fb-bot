'use strict';

let token = "EAAV5CG1rZCrcBAMBYzNVwZAfHGb1i4gYfKUrEJMFqVC4tzxsKfxTbPojXGkpoPb5dTCWEZBJCfYcRaxa1xnM6ANsYlrUJJPKhI3DJUrI2vXWJIwlnYMdjdLEeZCxEKDcjA7zan2oVnpJuFjskyxUCMI6F2HHWQ38KZAbWCZBdbbgZDZD"

// Imports dependencies and set up http server
const 
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

function userInfo(sender_psid) {
  let info = request({
    "url": "https://graph.facebook.com/v2.6/${sender_psid}?fields=first_name,last_name,profile_pic&access_token=${token}",
    "method": "GET",
    "json": true
  }, (err, res, body) => {
    if (!err) {
      console.log('request sent!')
    } else {
      console.error("Unable to send request:" + err);
    }
  });
  console.log(info)
  return info.first_name;
}

function handleMessage(sender_psid, received_message) {

  //let name = userInfo(sender_psid); 

  let response;  

  // Check if the message contains text
  if (received_message.text) {    
    response = decideMessage(received_message.text);
    
  } else if (received_message.attachments) {
  
    // Gets the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  
  } 

  // Sends the response message
  callSendAPI(sender_psid, response);    
}

function handlePostback(sender_psid, received_postback) {
  let response;
  
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function decideMessage(text1) {
  let text = text1.toLowerCase();
  let response;
  if (text.includes("course") || text.includes("curicullum")) {
     response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Course Curicullum",
            "subtitle": "Click on the heading to view",
            "image_url": "https://nsit101.weebly.com/uploads/9/7/6/9/97691126/background-images/853635501.jpeg",
            "buttons": [
              {
                "type": "web_url",
                "url": "http://www.nsit.ac.in/static/documents/COE_c.pdf",
                "title": "COE"                
              },
              {
                "type": "web_url",
                "url": "http://www.nsit.ac.in/static/documents/IT_c.pdf",
                "title": "IT"                
              },
              {
                "type": "web_url",
                "url": "http://www.nsit.ac.in/static/documents/ICE_c.pdf",
                "title": "ICE"
              },
              {
                "type": "web_url",
                "url": "http://www.nsit.ac.in/static/documents/ECE_c.pdf",
                "title": "ECE"
              },
              {
                "type": "web_url",
                "url": "http://www.nsit.ac.in/static/documents/ME_c.pdf",
                "title": "ME"
              },
              {
                "type": "web_url",
                "url": "http://www.nsit.ac.in/static/documents/MPAE_c.pdf",
                "title": "MPAE"
              },
              {
                "type": "web_url",
                "url": "http://www.nsit.ac.in/static/documents/BT_c.pdf",
                "title": "BT"
              }
            ],
          }]
        }
      }
    }
  } else{
    response = {
      "text": `"${text1}"`
    }
  }

  return response;
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "messaging_type": "RESPONSE",
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": token },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "chaitanya"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});
