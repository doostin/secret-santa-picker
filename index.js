var _ = require("lodash");
var async = require("async");
var nodemailer = require("nodemailer");
var prompt = require("prompt");
var familyMembers = require("./family-members.json");

var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "",
        pass: ""
    }
});

async.series([

    // prompt for gmail username and password
    function(callback) {

        var promptSchema = {
            properties : {
                email : {
                    required : true
                },
                password : {
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
            callback(null);
        });
    },

    // pick names
    function(callback) {
        _.forEach(familyMembers, function(familyMember) {
            async.until(

                function() { return familyMember.picked },

                function(callback) {

                    var randomNumber = _.random(0,6);
                    var canPick = _.indexOf(familyMember.cantPick, familyMembers[randomNumber].name);

                    if(canPick === -1 && !familyMembers[randomNumber].isPicked) {
                        familyMember.picked = familyMembers[randomNumber].name;
                        familyMembers[randomNumber].isPicked = true;
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

        _.forEach(familyMembers, function(familyMember) {
            var mailOptions = {
                from: "Dustin Boudreau <dustin.boudreau@gmail.com>",
                to: "dustin.boudreau@gmail.com",
                subject: "Your Secret Santa is...",
                text: "Hi "+familyMember.name+", You will be a secret santa for "+familyMember.picked
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
