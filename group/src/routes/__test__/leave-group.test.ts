import request from 'supertest';
import { app } from '../../app';
import { users } from '../../test/setup';
import Group from '../../models/group';
import mongoose from 'mongoose';


it('should leave from the group and the group should be deleted', async () => {
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
    
  const response = await request(app)
    .delete(`/api/group/${res.body.id}/members`)
    .set('Authorization', `Bearer ${token}`)
    .send();
    
    
  expect(response.status).toBe(200);
    
  const group = await Group.exists({ _id: res.body.id });
  expect(group).toBe(false);
});


it('should leave from the group and the group and the creator should be updated', async () => {
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
    .put(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      members: [
        users[1].id,
        users[2].id,
        users[3].id
      ]
    });
    
  const response = await request(app)
    .delete(`/api/group/${res.body.id}/members`)
    .set('Authorization', `Bearer ${token}`)
    .send();
    
    
  expect(response.status).toBe(200);
    
  const group = await Group.findById(res.body.id);
  expect(group?.creator.toHexString() != id).toBe(true);
});


it('should leave from the group', async () => {
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
    .put(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      members: [
        users[1].id,
        users[2].id,
        users[3].id
      ]
    });
    
  const response = await request(app)
    .delete(`/api/group/${res.body.id}/members`)
    .set('Authorization', `Bearer ${token}`)
    .send();
    
    
  expect(response.status).toBe(200);
    
  const group = await Group.findById(res.body.id);
  expect(group?.members.includes(mongoose.Types.ObjectId(id))).toBe(false);
});


it('should not leave from the group if the user is a participant in an expense', async () => {
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
    .put(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      members: [
        users[1].id,
        users[2].id,
        users[3].id
      ]
    });

  await Group.updateOne(
    {
      _id: res.body.id
    },
    { $push: { inActiveExpenses: mongoose.Types.ObjectId(users[1].id) } }
  );
  
  const user = await global.signin(
    users[1].id,
    users[1].email,
    users[1].phone
  );
    
  const response = await request(app)
    .delete(`/api/group/${res.body.id}/members`)
    .set('Authorization', `Bearer ${user.token}`)
    .send();
    
  expect(response.status).toBe(400);
});


it('should not leave from the group if the user is not a member of the group', async () => {
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
    .put(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      members: [
        users[2].id,
        users[3].id
      ]
    });
  
  const user = await global.signin(
    users[1].id,
    users[1].email,
    users[1].phone
  );
    
  const response = await request(app)
    .delete(`/api/group/${res.body.id}/members`)
    .set('Authorization', `Bearer ${user.token}`)
    .send();
    
    
  expect(response.status).toBe(400);
});


it('should not leave from the group if the group does not exist', async () => {
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
    .put(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      members: [
        users[2].id,
        users[3].id
      ]
    });
  
  const user = await global.signin(
    users[1].id,
    users[1].email,
    users[1].phone
  );
    
  const response = await request(app)
    .delete(`/api/group/${id}/members`)
    .set('Authorization', `Bearer ${user.token}`)
    .send();
    
  expect(response.status).toBe(404);
});


it('should not leave from the group if the group does not exist', async () => {
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
    .put(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      members: [
        users[2].id,
        users[3].id
      ]
    });
  
  const user = await global.signin(
    users[1].id,
    users[1].email,
    users[1].phone
  );
    
  const response = await request(app)
    .delete(`/api/group/${id}/members`)
    .set('Authorization', `Bearer ${user.token}`)
    .send();
    
  expect(response.status).toBe(404);
});


it('should not leave from the group without an auth token', async () => {
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
    .put(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      members: [
        users[2].id,
        users[3].id
      ]
    });
  
  const user = await global.signin(
    users[1].id,
    users[1].email,
    users[1].phone
  );
    
  const response = await request(app)
    .delete(`/api/group/${id}/members`)
    .send();
    
  expect(response.status).toBe(401);
});


it('should not leave from the group with an invalid auth token', async () => {
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
    .put(`/api/group/${res.body.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      members: [
        users[2].id,
        users[3].id
      ]
    });
  
  const user = await global.signin(
    users[1].id,
    users[1].email,
    users[1].phone
  );
    
  const response = await request(app)
    .delete(`/api/group/${id}/members`)
    .set('Authorization', `bullshit`)
    .send();
    
  expect(response.status).toBe(401);
});