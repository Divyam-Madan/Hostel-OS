import { api } from './client';

export function createWellbeingLog(payload) {
  return api('/wellbeing', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchMyWellbeingLogs() {
  return api('/wellbeing/my');
}