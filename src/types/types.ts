export type CallStatus = 'completed' | 'in-progress' | 'busy' | 'no-answer' | 'failed' | 'canceled';
export type MessageType = { event: string, number: string, status: CallStatus, answeredBy: string, message: string, conferenceSid?: string };
export type ErrorType = { message: string };