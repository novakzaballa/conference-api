import { Router } from 'express';
import * as callController from '../controllers/controller';

const router = Router();

router.get('/get-numbers', callController.getNumbers);
router.post('/start-conference', callController.startConference);
router.post('/end-conference', callController.endConference);
router.post('/end-call', callController.endCall);
router.post('/call-status', callController.callStatus);
router.post('/voice', callController.voiceResponse);

export default router;