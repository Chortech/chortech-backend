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
    .post('/api/user/credit-card/create')
    .set('Authorization', `Bearer ${token}`)
    .send({ number: '1234567812345678', name: 'nima' })
    .expect(201);

   const creditCard = response.body;
   
   await request(app)
    .post('/api/user/credit-card/my/add')
    .set('Authorization', `Bearer ${token}`)
    .send({ cardId: creditCard.id })
    .expect(200)

    await request(app)
    .post('/api/user/credit-card/my/remove')
    .set('Authorization', `Bearer ${token}`)
    .send({ cardId: creditCard.id })
    .expect(200)
});


it('should not remove a credit card from from my other cards without an auth token', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
    const response = await request(app)
      .post('/api/user/credit-card/create')
      .send({ number: '1234567812345678', name: 'nima' })
      .expect(401);
  
     const creditCard = response.body;
     
     await request(app)
      .post('/api/user/credit-card/my/add')
      .send({ cardId: creditCard.id })
      .expect(401)
  
      await request(app)
      .post('/api/user/credit-card/my/remove')
      .send({ cardId: creditCard.id })
      .expect(401)
});


it('should not remove a credit card from my other cards with an invalid auth token', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  const response = await request(app)
    .post('/api/user/credit-card/create')
    .set('Authorization', `Bearer fdajlsfjasdf`)
    .send({ number: '1234567812345678', name: 'nima' })
    .expect(401);

   const creditCard = response.body;
   
   await request(app)
    .post('/api/user/credit-card/my/add')
    .set('Authorization', `Bearer fdjlasjfdas`)
    .send({ cardId: creditCard.id })
    .expect(401)

    await request(app)
    .post('/api/user/credit-card/my/remove')
    .set('Authorization', `Bearer fjldaksjdfls`)
    .send({ cardId: creditCard.id })
    .expect(401)
});


it('should not remove a credit card from my other cards if the card does not exist', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    )
  
    await request(app)
      .post('/api/user/credit-card/my/remove')
      .set('Authorization', `Bearer ${token}`)
      .send({ cardId: 'bullshitshit' })
      .expect(404)
});


it('should remove a credit card from my other cards if it is not in my other cards', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  const response = await request(app)
    .post('/api/user/credit-card/create')
    .set('Authorization', `Bearer ${token}`)
    .send({ number: '1234567812345678', name: 'nima' })
    .expect(201);

   const creditCard = response.body;
   
   await request(app)
    .post('/api/user/credit-card/my/add')
    .set('Authorization', `Bearer ${token}`)
    .send({ cardId: creditCard.id })
    .expect(200)

    await request(app)
      .post('/api/user/credit-card/my/remove')
      .set('Authorization', `Bearer ${token}`)
      .send({ cardId: creditCard.id })
      .expect(200)

    await request(app)
      .post('/api/user/credit-card/my/remove')
      .set('Authorization', `Bearer ${token}`)
      .send({ cardId: creditCard.id })
      .expect(409)
});