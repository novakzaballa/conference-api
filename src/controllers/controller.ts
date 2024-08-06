import { Request, Response } from 'express';
import { Twilio, twiml as TwilioTwiml, jwt as twilioJwt,  } from 'twilio';
import dotenv from 'dotenv';
import { broadcastMessage } from '../app';
const { AccessToken } = twilioJwt;

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const apiKey = process.env.TWILIO_API_KEY!;
const apiSecret = process.env.TWILIO_API_SECRET!;
const callerId = process.env.TWILIO_CALLER_ID!;
const CONFERENCE_HOST_ID = "ConferenceHost";
const CONFERENCE_NAME = "MyConference";

const client = new Twilio(apiKey, apiSecret, { accountSid });
const phoneNumbersHardcoded: string[] = [
  '+18434926596',
  '+17544657460',
  '+16468324592',
];

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

const callParticipants = async () => {
  
    try {
        const callPromises = phoneNumbersHardcoded.map((number) =>
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
        console.log('Calls initiated. BASE URL:', process.env.BASE_URL);
    } catch (error) {
        console.error('Failed to make calls, details: ', error?.message);
    }
  };

export const removeParticipant = async (req: Request, res: Response) => {
    const { callSid } = req.body;
    console.log('DEBUG: req.body', req.body);

    try {
      await client
      .conferences(CONFERENCE_NAME)
      .participants(callSid)
      .remove();

      res.status(204).send({ message: 'Participant Removed' });
    } catch (error) {
      console.log('DEBUG: Failed to end call', error?.message);
      res.status(500).send({ error: 'Failed to end call', details: error?.message });
    }
};

export const callStatus = async (req: Request, res: Response) => {
    const callStatus = req.body.CallStatus;
    const answeredBy = req.body.AnsweredBy;
    const number = req.body.To;

    console.log('DEBUG: Call status', callStatus);
    console.log('DEBUG: Call answered by', answeredBy);

    if (callStatus === 'completed') {
        try {
            broadcastMessage({
                event: 'call-status',
                number: number,
                status: callStatus,
                answeredBy: answeredBy,
                callSid: req.body.CallSid,
              });

            res.status(200).send({ message: 'Call completed' });
        } catch (error) {
            res.status(500).send({ error: 'Failed to get info from conference', details: error.message });
        }
    } else {
        console.log('DEBUG: Call not answered by human');
        res.status(200).send('OK');
    }
};

export const voiceResponse = async (req: Request, res: Response) => {
  const twiml = new TwilioTwiml.VoiceResponse();
  const requestBody = req.body;

  if (requestBody.From === 'client:' + CONFERENCE_HOST_ID) {
    console.log('DEBUG: Creating a new conference. Host:' + JSON.stringify(requestBody));
    // Create a new conference
    const dial = twiml.dial({callerId: callerId});
    dial.conference({
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
    }, CONFERENCE_NAME);
    callParticipants();
  } else if (req.body.CallStatus === 'in-progress' && req.body.AnsweredBy === 'human') {
    console.log('DEBUG: Participant joining an existing conference');
    twiml.say('Hi, I will connect you now to your Regie conference');
    // Join an existing conference
    const dial = twiml.dial({callerId: requestBody.To});
    dial.conference({startConferenceOnEnter: false, participantLabel: req.body.To}, CONFERENCE_NAME);
    broadcastMessage({
      event: 'call-status',
      number: req.body.To,
      status: req.body.CallStatus,
      answeredBy: req.body.AnsweredBy,
      callSid: req.body.CallSid,
    });
  } else if (req.body.AnsweredBy === 'machine_start' || req.body.AnsweredBy === 'fax') {
    console.log('DEBUG: Call answered by machine');
    broadcastMessage({
        event: 'call-status',
        number: req.body.To,
        status: req.body.CallStatus,
        answeredBy: req.body.AnsweredBy,
        callSid: req.body.CallSid,

    });
    twiml.hangup();
  }
  console.log('DEBUG: TwiML generated:', twiml.toString());
  res.type('text/xml');
  res.send(twiml.toString());    
};

export const generateToken = (req: Request, res: Response) => {
    const voiceGrant = new AccessToken.VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: true
    });

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY!,
      process.env.TWILIO_API_SECRET!,
      { identity: CONFERENCE_HOST_ID }
    );

    token.addGrant(voiceGrant);
    res.send({ token: token.toJwt() });
  };
