const nodemailer = require("nodemailer");
const googleApis = require("googleapis");
const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `969128600429-vev66o76v44jfmf5qqdhp4v2sm4p8k4o.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//04LEsz36ilO_kCgYIARAAGAQSNwF-L9IrN9MzU7SjzcRdDVZ0lq8c4Yqdw5e_ODZDPuo18JZV1f04P-nvqN-ei45zOneoycusFIo`;
const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET,
    REDIRECT_URI);


authClient.setCredentials({ refresh_token: REFRESH_TOKEN });
async function mailer(email, otp, userid) {
    try {
        const ACCESS_TOKEN = await authClient.getAccessToken();
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: "nitishjsr7209@gmail.com",
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: ACCESS_TOKEN
            }
        })

        
        const details = {
            from: "NITISH KUMAR ❤️ <nitishjsr7209@gmail.com>",
            to: email,
            subject: "RESET YOUR PASSWORD",
            text: "Hello",
            html: `<h5 style="font-family: gilroy; font-weight: 400; line-height: 20px;">Hello, <br> Please click on the link to reset your password: <br> <br> <a href="http://localhost:3000/forgot/${userid}/otp/${otp}">reset password</a>
            <br> <br> If you did not request this, please ignore this email and yur password <br> will remain unchanged <br> Thanks, <br> Nitish Kumar</h5>`
        }
        const result = await transport.sendMail(details);
        return result;
    }
    catch (err) {
        return err;
    }
}

module.exports = mailer;

