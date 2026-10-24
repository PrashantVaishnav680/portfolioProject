const express = require('express');
const cors = require('cors')
const nodemailer = require("nodemailer")
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})


app.post('/api/contact-form', (req, res) => {
    console.log("Received data:", req.body);
    const { name, email, subject, message } = req.body

    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    // email templete
    const adminHtml = `
    <div style="font-family: Arial, sans-serif; padding:20px; color:#333">
    <h2>New Contact Form Submission</h2>
    <p><strong>Name: </strong>${name}</p>
    <p><strong>Email: </strong>${email}</p>
    <p><strong>Message: </strong></p>
    <p>${message}</p>
    </div>
    `
    // user ack email temp
    const userHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333">
    <h2>Thank You for Contacting Me</h2>
    <p>Dear ${name},</p>
    <p>Thank you for contacting me. I have received your message and will get back to you soon.</p>
    </div>
    `

    const adminMailOption = {
        from: process.env.EMAIL_USER,
        replyTo: email,
        to: process.env.EMAIL_USER,
        subject: subject,
        html: adminHtml
    };

    const userMailOption = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Thak you for contacting us!`,
        html: userHTML
    }

    // send mail
    transporter.sendMail(adminMailOption, (err, info) => {
        if (err) {
            console.error("Error sending mail to admin", err);
            return res.status(500).json({ error: "failed to send acknowledgment mail." })
        }

        console.log("admin email send: ", info.response);

        transporter.sendMail(userMailOption, (err, info) => {
            if (err) {
                console.error("Error sending acknowledgement mail to user", err);
                return res.status(500).json({ error: "failed to send acknowledgment mail." })
            }
            console.log("acknowledgment email sent: ", info.response)
            res.status(200).json({ success: true, message: "Email sent successfully" })
        })
    })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});