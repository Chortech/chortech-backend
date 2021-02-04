import request from 'supertest';
import { app } from '../../app';
import { users } from '../../test/setup';


it('should get activities', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .get('/api/activity')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
});


it('should not get activities without an auth token', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .get('/api/activity')
    .expect(401);
});

it('should not get activities with an invalid auth token', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .get('/api/activity')
    .set('Authorization', `fdlaksjfdlajfdalshfksaj`)
    .expect(401);
});