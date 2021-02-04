import request from "supertest";
import { app } from "../../app";
import { users } from "../../test/setup";

it('should add a credit card to my other cards', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
   
   await request(app)
    .post('/api/user/credit-card/other')
    .set('Authorization', `Bearer ${token}`)
    .send({ number: '1234567812345678', name: 'nima' })
    .expect(200)
});


it('should not add a credit card to my other cards without an auth token', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
     
    await request(app)
      .post('/api/user/credit-card/other')
      .send({ number: '1234567812345678', name: 'nima' })
      .expect(401)
});


it('should not add a credit card to my cards with an invalid auth token', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );
   
   await request(app)
    .post('/api/user/credit-card/other')
    .set('Authorization', 'fdalkfdalkjsfldsf')
    .send({ number: '1234567812345678', name: 'nima' })
    .expect(401)
});


it('should not add a credit card to my cards with an invalid card number', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
 
    await request(app)
      .post('/api/user/credit-card/other')
      .set('Authorization', `Bearer ${token}`)
      .send({ number: 'bullshitshit', name: 'nima' })
      .expect(400)
});


it('should not add a credit card to my cards without a name', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .post('/api/user/credit-card/other')
    .set('Authorization', `Bearer ${token}`)
    .send({ number: '1234567812345678' })
    .expect(400)
});


it('should not add a credit card to my cards if it already is in my cards', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
     
    await request(app)
      .post('/api/user/credit-card/other')
      .set('Authorization', `Bearer ${token}`)
      .send({ number: '1234567812345678', name: 'nima' })
      .expect(200)

    await request(app)
      .post('/api/user/credit-card/other')
      .set('Authorization', `Bearer ${token}`)
      .send({ number: '1234567812345678', name: 'nima' })
      .expect(409)
});