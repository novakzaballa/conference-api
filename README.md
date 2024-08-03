# Conference API

## Set Up

### Requirements

- [Nodejs](https://nodejs.org/) version **14.0** or above.
- [ngrok](https://ngrok.com/download) - this is used to expose your local development server to the internet.
- A WebRTC enabled browser (Google Chrome or Mozilla Firefox are recommended). Edge and Internet Explorer will not work for testing.

### Create a TwiML Application, Purchase a Phone Number, Create an API Key

1. [Create a TwiML Application in the Twilio Console](https://www.twilio.com/console/voice/twiml/apps). Once you create the TwiML Application, click on it in your list of TwiML Apps to find the TwiML App SID. You will need this SID for your `.env` file. **Note:** You will need to configure the Voice "REQUEST URL" in your TwiML App later.
 
2. [Purchase a Voice phone number](https://www.twilio.com/console/phone-numbers/incoming). You will need this phone number in [E.164 format](https://en.wikipedia.org/wiki/E.164) for your `.env` file.

3. [Create an API Key in the Twilio Console](https://www.twilio.com/console/project/api-keys). Keep the API Key SID and the API Secret in a safe place, since you will need them for your `.env` file. Your API KEY is needed to create an [Access Token](https://www.twilio.com/docs/iam/access-tokens).

### Gather Config Values

Before we begin local development, we need to collect all the config values we need to run the application.

| Config Value                           | Description                                                                                                                                                              |
| :------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                   | Your primary Twilio account identifier - find this [in the console here](https://www.twilio.com/console).                                                                |
| `TWILIO_TWIML_APP_SID`                 | The SID of the TwiML App you created in step 1 above. Find the SID [in the console here](https://www.twilio.com/console/voice/twiml/apps).                               |
| `TWILIO_CALLER_ID`                     | Your Twilio phone number in [E.164 format](https://en.wikipedia.org/wiki/E.164) - you can [find your number here](https://www.twilio.com/console/phone-numbers/incoming) |
| `TWILIO_API_KEY` / `TWILIO_API_SECRET` | The `TWILIO_API_KEY` is the API Key SID you created in step 3 above, and the `TWILIO_API_SECRET` is the secret associated with that key.                                 |

### Local development

2. Create a configuration file for your application by copying the `.env.example` and edit the `.env` file with the configuration values from above.

   ```bash
   cp .env.example .env
   ```

3. Install the dependencies.

   ```bash
   npm install
   ```

5. Launch local development web server.

   ```bash
   npm run dev
   ```


7. Expose your application to the wider internet using `ngrok`. This step is **crucial** for the app to work as expected.

   ```bash
   ngrok http 3001
   ```

8. `ngrok` will assign a unique URL to your tunnel.
   It might be something like `https://asdf456.ngrok.io`. You will need this to configure your TwiML app in the next step.

9. Configure your TwiML app

   - In the Twilio Console, navigate to [Programmable Voice > TwiML > TwiML Apps](https://www.twilio.com/console/voice/twiml/apps)
   - Select the TwiML App you created earlier
   - On your TwiML App's information page, find the 'Voice Configuration' section.
   - Change the Request URL to your ngrok url with `/voice` appended to the end. (E.g: `https://asdf456.ngrok.io/voice`) **Note:** You **must** use the https URL, otherwise some browsers will block
     microphone access.
   - Click the 'Save' button.

   ![screenshot of TwiML App Voice Configuration](./screenshots/UpdateRequestURL.png)

You should now be ready to make and receive calls from your browser.

## License

[MIT](http://www.opensource.org/licenses/mit-license.html)

## Disclaimer

No warranty expressed or implied. Software is as is.

[twilio]: https://www.twilio.com