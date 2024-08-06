import { Router } from 'express';
import * as callController from '../controllers/controller';

const router = Router();

router.get('/get-numbers', callController.getNumbers);
router.delete('/remove-participant', callController.removeParticipant);
router.post('/call-status', callController.callStatus);
router.post('/voice', callController.voiceResponse);
router.post('/token', callController.generateToken);

export default router;