import request from 'supertest';
import { app } from '../../app';
import { users } from '../../test/setup';


it('should get a group with the correct id', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  const res = await request(app)
    .post('/api/group')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'hello', picture: 'hello.png' })
    .expect(201);
  
  const group = res.body.id;

  await request(app)
    .get(`/api/group/${group}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
});


it('should not get a group if the user is not a member in it', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  const res = await request(app)
    .post('/api/group')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'hello', picture: 'hello.png' })
    .expect(201);
  
  const group = res.body.id;

  const response = await global.signin(
    users[1].id,
    users[1].email,
    users[1].phone
  );

  await request(app)
    .get(`/api/group/${group}`)
    .set('Authorization', `Bearer ${response.token}`)
    .send()
    .expect(400);
});


it('should not get a group with an invalid group id', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  const res = await request(app)
    .post('/api/group')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'hello', picture: 'hello.png' })
    .expect(201);

  const group = res.body.id;
  
  const resp = await request(app)
    .get(`/api/group/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .send()
    .expect(404);
});
