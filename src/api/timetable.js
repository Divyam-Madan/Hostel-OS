import client from './client';

export async function fetchTimetable() {
  const d = await client.get('/timetable');
  return d.timetable || {};
}

export async function createClass(entry) {
  const d = await client.post('/timetable', entry);
  return d.entry || d;
}

export async function updateClass(id, patch) {
  const d = await client.patch(`/timetable/${id}`, patch);
  return d.entry || d;
}

export async function deleteClass(id) {
  const d = await client.delete(`/timetable/${id}`);
  return d;
}
