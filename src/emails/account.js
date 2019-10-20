const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMessage = (name, email) => {
  sgMail.send({
    to: email,
    from: "ihijazi313@gmail.com",
    subject: "Thanks for joining in!",
    text: `Welcome to the app ${name}`
  });
};
module.exports = {
  sendWelcomeMessage
};
