import request from 'supertest';
import { app } from '../../app';
import { users } from '../../test/setup';
import Group from '../../models/group';
import mongoose from 'mongoose';


it('should delete the group', async () => {
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

  await request(app)
    .delete(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send()
    .expect(200);
});


it('should delete the group', async () => {
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

  const user = await global.signin(
      users[1].id,
      users[1].email,
      users[1].phone
  );

  await request(app)
    .delete(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send()
    .expect(400);
});


it('should not delete the group if the user is not the group owner', async () => {
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

  const user = await global.signin(
      users[1].id,
      users[1].email,
      users[1].phone
  );

  await request(app)
    .delete(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${user.token}`)
    .send()
    .expect(400);
});


it('should not delete the group if there is any active expenses', async () => {
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

  await Group.updateOne(
    {
      _id: res.body.id
    },
    { $push: { inActiveExpenses: mongoose.Types.ObjectId(id) } }
  );

  await request(app)
    .delete(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send()
    .expect(400);
});


it('should not delete the group with an invalid auth token', async () => {
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

  await request(app)
    .delete(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer bullshit`)
    .send()
    .expect(401);
});


it('should not delete the group without an auth token', async () => {
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

  await request(app)
    .delete(`/api/group/${res.body.id}`)
    .send()
    .expect(401);
});