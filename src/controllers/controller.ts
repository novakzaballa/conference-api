import { Request, Response } from 'express';
import { Twilio, twiml as TwilioTwiml } from 'twilio';
import dotenv from 'dotenv';
import { broadcastMessage } from '../app';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const apiKey = process.env.TWILIO_API_KEY!;
const apiSecret = process.env.TWILIO_API_SECRET!;
const callerId = process.env.TWILIO_CALLER_ID!;

const client = new Twilio(apiKey, apiSecret, { accountSid });
const phoneNumbersHardcoded: string[] = ['+18434926596'];

export const getNumbers = (req: Request, res: Response) => {
    res.json(phoneNumbersHardcoded);
};

const generateRandomConferenceName = () => {
    const adjectives = [
        "Amazing", "Brilliant", "Creative", "Dynamic", "Exciting",
        "Fantastic", "Glorious", "Harmonious", "Incredible", "Jubilant"
    ];

    const nouns = [
        "Eagles", "Stars", "Wolves", "Tigers", "Panthers",
        "Dragons", "Warriors", "Titans", "Champions", "Rangers"
    ];

    const getRandomElement = (array: string | any[]) => array[Math.floor(Math.random() * array.length)];

    const randomAdjective = getRandomElement(adjectives);
    const randomNoun = getRandomElement(nouns);

    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4 digit random number

    return `${randomAdjective}${randomNoun}${randomNumber}`;
}

const checkConferenceCreated = async (conferenceName: string) => {
    let conference;

    while (!conference || conference.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        conference = await client.conferences.list({ friendlyName: conferenceName });
    }

    return conference[0];
};

export const startConference = async (req: Request, res: Response) => {
    const { phoneNumbers } = req.body;

    try {
        const callPromises = phoneNumbers.map((number: string) =>
            client.calls.create({
                to: number,
                from: callerId,
                url: `${process.env.BASE_URL}/voice`,
                statusCallback: `${process.env.BASE_URL}/call-status`,
                statusCallbackEvent: ['completed'],
                machineDetection: 'Enable',
            })
        );

        await Promise.all(callPromises);
        res.status(200).send({ message: 'Calls initiated' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to make calls', details: error?.message });
    }
};

export const endConference = async (req: Request, res: Response) => {
    const { conferenceSid } = req.body;

    try {
        await client.conferences(conferenceSid).update({ status: 'completed' });
        res.status(200).send({ message: 'Conference ended' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to end conference', details: error?.message });
    }
};

export const endCall = async (req: Request, res: Response) => {
    const { callSid } = req.body;

    try {
        await client.calls(callSid).update({ status: 'completed' });
        res.status(200).send({ message: 'Call ended' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to end call', details: error?.message });
    }
};

export const callStatus = async (req: Request, res: Response) => {
    const callStatus = req.body.CallStatus;
    const answeredBy = req.body.AnsweredBy;
    const number = req.body.To;

    console.log('DEBUG: Call status', callStatus);
    console.log('DEBUG: Call answered by', answeredBy);

    if (callStatus === 'in-progress' && answeredBy === 'human') {
        console.log('DEBUG: Call answered by human');
        const twiml = new TwilioTwiml.VoiceResponse();
        try {
            const conferenceName = generateRandomConferenceName();

            twiml.dial().conference(conferenceName, {
                startConferenceOnEnter: true,
                endConferenceOnExit: false,
            });

            broadcastMessage({
                event: 'call-status',
                number: number,
                status: callStatus,
                answeredBy: answeredBy,
                message: 'Call answered by human and joined to conference'
            });

            res.status(200).send({ message: 'Call joined to conference' });
        } catch (error) {
            res.status(500).send({ error: 'Failed to join call to conference', details: error.message });
        }
    } else {
        console.log('DEBUG: Call not answered by human');
        res.status(200).send('OK');
    }
};

export const voiceResponse = async (req: Request, res: Response) => {
    const twiml = new TwilioTwiml.VoiceResponse();
    console.log('DEBUG: Body', req.body);
    if (req.body.CallStatus === 'in-progress' && req.body.AnsweredBy === 'human') {
        const conferenceName = generateRandomConferenceName();

        twiml.say('Hi this is Joe for Regie, please stay on the line while we connect you with one of our agents.');
        twiml.dial().conference(conferenceName, {
            startConferenceOnEnter: true,
            endConferenceOnExit: false,
        });
        const conference = await client.conferences.list({ friendlyName: conferenceName as string });
        console.log('DEBUG: conference', conference);

        broadcastMessage({
            event: 'call-status',
            number: req.body.To,
            status: req.body.CallStatus,
            answeredBy: req.body.AnsweredBy,
            message: 'Call answered by human and joined to conference',
            conferenceSid: conference[0].sid
        });

    } else if (req.body.AnsweredBy === 'machine_start' || req.body.AnsweredBy === 'fax') {
        broadcastMessage({
            event: 'call-status',
            number: req.body.To,
            status: req.body.CallStatus,
            answeredBy: req.body.AnsweredBy,
            message: 'Call answered by machine',
        });
        twiml.hangup();
    } else {
        twiml.pause({ length: 5 });
    }

    res.type('text/xml');
    res.send(twiml.toString());
};
