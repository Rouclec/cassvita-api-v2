const nodemailer = require("nodemailer");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.fullName.split(" ")[0];
    this.url = url;
    this.from = `CassVita ${process.env.EMAIL_FROM}`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      //TODO: create a transporter for sendgrid
      return 1;
    } else {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
        //Activate less secure app options in gmail
      });
    }
  }

  //send the actual email
  async send(subject) {
    //define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: `Hi, ${
        this.firstName
      }, ${"\n"} Forgot your password? Submite a PATCH request to this <a href="${
        this.url
      }">link</a>: ${"\n\n"} If you didn't forget your password, please ignore this message ${"\n"} -Asonganyi Rouclec, CEO ${"\n"} CassVita Inc, 123 Nowhere Road, Limbe Cameroon`,
    };

    //create a transport and send mail
    await this.newTransport().sendMail(mailOptions);
  }

  async sendPasswordReset() {
    await this.send("Your password reset token (Valid for only 10 minutes)");
  }
};
