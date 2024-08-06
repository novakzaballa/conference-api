export type CallStatus = 'completed' | 'in-progress' | 'busy' | 'no-answer' | 'failed' | 'canceled';
export type MessageType = { event: string, number: string, status: CallStatus, answeredBy: string, callSid: string};
export type ErrorType = { message: string };