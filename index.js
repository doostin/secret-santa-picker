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
        var areAllMatched;

        function pickSanta() {
            // Create a duplicate of the possible Santas and randomize them for selection
            var eligibleSantas = _.shuffle(_.cloneDeep(santas));

            for (var j=0; j < santas.length; j++) {
                var santa = santas[j];

                for (var i=0; i < eligibleSantas.length; i++) {
                    var eligibleSanta = eligibleSantas[i];
                    var canPick = _.indexOf(santa.cantPick, eligibleSanta.name) === -1;

                    if (canPick && eligibleSanta.name !== santa.name) {
                        santa.picked = eligibleSanta.name;
                        eligibleSantas.splice(i, 1);

                        break;
                    }
                }

                if (santa.picked == null) {
                    areAllMatched = false;
                    return;
                }
            }

            areAllMatched = true;
        }

        while (areAllMatched !== true) {
            pickSanta();
        }

        callback();
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
