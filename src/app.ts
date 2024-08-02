import express, { Request, Response } from 'express';
import { Twilio, twiml as TwilioTwiml } from 'twilio';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
const cors = require('cors');

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors());

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const apiKey = process.env.TWILIO_API_KEY!;
const apiSecret = process.env.TWILIO_API_SECRET!;
const callerId = process.env.TWILIO_CALLER_ID!;

const client = new Twilio(apiKey, apiSecret, { accountSid });

const phoneNumbersHarcoded: string[] = [
    '+18434926596',
    '+17544657460',
    '+16468324592',
];

app.get('/generate-numbers', (req: Request, res: Response) => {
    res.json(phoneNumbersHarcoded);
});

app.post('/start-conference', async (req: Request, res: Response) => {
    const { phoneNumbers } = req.body;

    try {
        const callPromises = phoneNumbers.map((number: string) =>
            client.calls.create({
                to: number,
                from: callerId,
                url: 'https://5ab6-181-188-171-226.ngrok-free.app/voice',
                statusCallback: 'https://5ab6-181-188-171-226.ngrok-free.app/call-status',
                statusCallbackEvent: ['completed'],
                machineDetection: 'Enable',
            })
        );

        await Promise.all(callPromises);

        res.status(200).send({ message: 'Calls initiated' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to make calls', details: error?.message });
    }
});

app.post('/end-conference', async (req: Request, res: Response) => {
    const { conferenceSid } = req.body;

    try {
        await client.conferences(conferenceSid).update({ status: 'completed' });
        res.status(200).send({ message: 'Conference ended' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to end conference', details: error.message });
    }
});

app.post('/end-call', async (req: Request, res: Response) => {
    const { callSid } = req.body;

    try {
        await client.calls(callSid).update({ status: 'completed' });
        res.status(200).send({ message: 'Call ended' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to end call', details: error.message });
    }
});


app.post('/call-status', async (req: Request, res: Response) => {
    const callStatus = req.body.CallStatus;
    const answeredBy = req.body.AnsweredBy;

    console.log('DEBUG: Call status', callStatus);
    console.log('DEBUG: Call answered by', answeredBy);

    if (callStatus === 'completed' && answeredBy === 'human') {
        console.log('DEBUG: Call answered by human');

        try {
            const conferenceName = 'MyConferenceRoom';

            const twiml = new TwilioTwiml.VoiceResponse();
            twiml.dial().conference(conferenceName, {
                startConferenceOnEnter: true,
                endConferenceOnExit: false,
            });

            await client.calls(callBody.id).update({
                twiml: twiml.toString(),
            });

            res.status(200).send({ message: 'Call joined to conference' });
        } catch (error) {
            res.status(500).send({ error: 'Failed to join call to conference', details: error.message });
        }
    } else {
        console.log('DEBUG: Call not answered by human');
        // client.calls(callSid).update({ status: 'completed' });
        res.status(200).send('OK');
    }
});


app.post('/voice', (req: Request, res: Response) => {
    const twiml = new TwilioTwiml.VoiceResponse();

    if (req.body.AnsweredBy === 'human') {
        const dial = twiml.dial();
        twiml.say('Hi this is Joe for Regie please stay on the line, while we connect you with one of our agents.');
        dial.conference('MyConferenceRoom', {
            startConferenceOnEnter: true,
            endConferenceOnExit: false,
        });
    } else if (req.body.AnsweredBy === 'machine_start' || req.body.AnsweredBy === 'fax') {
        twiml.hangup();
    } else {
        twiml.pause({ length: 5 });
        console.log('DEBUG: req.body:', req.body);
        // twiml.redirect('/voice');
    }



  res.type('text/xml');
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});