import request from "supertest";
import { app } from "../../app";
import { users } from "../../test/setup";

it('should remove a credit card from from my cards', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  const response = await request(app)
    .post('/api/user/credit-card/my')
    .set('Authorization', `Bearer ${token}`)
    .send({ number: '1234567812345678', name: 'nima' })
    .expect(200);

  const user = response.body;

  await request(app)
    .delete('/api/user/credit-card/my')
    .set('Authorization', `Bearer ${token}`)
    .send({ cardId: user.myCreditCards[0]._id })
    .expect(200)
});


it('should not remove a credit card from from my other cards without an auth token', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
  const response = await request(app)
    .post('/api/user/credit-card/my')
    .set('Authorization', `Bearer ${token}`)
    .send({ number: '1234567812345678', name: 'nima' })
    .expect(200);
  
  const user = response.body;
  
  await request(app)
    .delete('/api/user/credit-card/my')
    .send({ cardId: user.myCreditCards[0]._id })
    .expect(401)
});


it('should not remove a credit card from my other cards with an invalid auth token', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
 
  const response = await request(app)
    .post('/api/user/credit-card/my')
    .set('Authorization', `Bearer ${token}`)
    .send({ number: '1234567812345678', name: 'nima' })
    .expect(200);
  
  const user = response.body;

  await request(app)
    .delete('/api/user/credit-card/my')
    .set('Authorization', `Bearer fjldaksjdfls`)
    .send({ cardId: user.myCreditCards[0]._id })
    .expect(401)
});


it('should not remove a credit card from my other cards if the card does not exist', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    )
  
    await request(app)
      .delete('/api/user/credit-card/my')
      .set('Authorization', `Bearer ${token}`)
      .send({ cardId: 'bullshitshit' })
      .expect(404)
});


it('should remove a credit card from my cards if it is not in my cards', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  const response = await request(app)
    .post('/api/user/credit-card/my')
    .set('Authorization', `Bearer ${token}`)
    .send({ number: '1234567812345678', name: 'nima' })
    .expect(200);
  
  const user = response.body;

  await request(app)
    .delete('/api/user/credit-card/my')
    .set('Authorization', `Bearer ${token}`)
    .send({ cardId: user.myCreditCards[0]._id })
    .expect(200)
  
  console.log(user.myCreditCards[0]);
  await request(app)
    .delete('/api/user/credit-card/my')
    .set('Authorization', `Bearer ${token}`)
    .send({ cardId: user.myCreditCards[0]._id })
    .expect(404)
});