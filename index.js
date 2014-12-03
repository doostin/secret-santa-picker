var _ = require("lodash");
var async = require("async");
var nodemailer = require("nodemailer");
var prompt = require("prompt");
var santas = require("./santas.json");

// setup transporter to be used to email later on.
var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "",
        pass: ""
    }
});

var fullName;
var gmailAddress;

async.series([

    // prompt for gmail username and password
    function(callback) {

        var promptSchema = {
            properties : {
                name : {
                    required : true,
                    description : "Full Name"
                },
                email : {
                    required : true,
                    description : "Gmail Address"
                },
                password : {
                    description : "Password",
                    required : true,
                    hidden : true
                }
            }
        }

        prompt.start();

        prompt.get(promptSchema, function(err, results) {
            transporter.transporter.options.auth = {
                user : results.email,
                pass : results.password
            };
            fullName = results.name;
            gmailAddress = results.email;
            callback(null);
        });
    },

    // pick names
    function(callback) {
        _.forEach(santas, function(santa) {
            async.until(

                function() { return santa.picked },

                function(callback) {

                    var randomNumber = _.random(0,6);
                    var canPick = _.indexOf(santa.cantPick, santas[randomNumber].name);

                    if(canPick === -1 && !santas[randomNumber].isPicked && santas[randomNumber] !== santa) {
                        santa.picked = santas[randomNumber].name;
                        santas[randomNumber].isPicked = true;
                        callback(null);
                    } else {
                        callback(null);
                    }

                },

                function(err) {

                    if(err) {
                        console.log({ "error" : err });
                    }
                }
            );
        });

        callback(null);
    },

    // send emails
    function(callback) {

        _.forEach(santas, function(santa) {

            var mailOptions = {
                from: fullName+" <"+gmailAddress+">",
                to: santa.email,
                subject: "You're a Secret Santa for...",
                text: "Hi "+santa.name+", You will be a secret santa for "+santa.picked
            };

            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log(error);
                }else{
                    console.log("Message sent: " + info.response);
                }
            });

        });

        callback(null);

    }
]);
