import request from 'supertest';
import { app } from '../../app';
import { users } from '../../test/setup';


it('should create a group with a name and a picture', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .post('/api/group')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'hello', picture: 'hello.png' })
    .expect(201);
});


it('should create a group with a name', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .post('/api/group')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'hello' })
    .expect(201);
});


it('should not create a group without a name', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .post('/api/group')
    .set('Authorization', `Bearer ${token}`)
    .send({ picture: 'hello.png' })
    .expect(400);
});


it('should not create a group without a name', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .post('/api/group')
    .set('Authorization', `Bearer ${token}`)
    .expect(400);
});


it('should not create a group without an auth token', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .post('/api/group')
    .send({ name: 'hello', picture: 'hello.png' })
    .expect(401);
});


it('should not create a group with an invalid auth token', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .post('/api/group')
    .set('Authorization', 'bullshit')
    .send({ name: 'hello', picture: 'hello.png' })
    .expect(401);
});