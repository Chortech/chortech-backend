import request from "supertest";
import { app } from "../../app";
import { users } from "../../test/setup";

it('should create a credit card', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .post('/api/user/credit-card/create')
    .set("Authorization", `Bearer ${token}`)
    .send({ number: '1234567812345678', name: 'nima' })
    .expect(201);
});


it('should not create a credit card without an auth token', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
    await request(app)
      .post('/api/user/credit-card/create')
      .send({ number: '1234567812345678', name: 'nima' })
      .expect(401);
});

it('should not create a credit card with an invalid auth token', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
    await request(app)
      .post('/api/user/credit-card/create')
      .set("Authorization", 'lasdkjflajskfwlj')
      .send({ number: '1234567812345678', name: 'nima' })
      .expect(401);
});


it('should not create a credit card without a card number', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
    await request(app)
      .post('/api/user/credit-card/create')
      .set("Authorization", `Bearer ${token}`)
      .send({ name: 'nima' })
      .expect(400);
});


it('should not create a credit card with an invalid card number', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .post('/api/user/credit-card/create')
    .set("Authorization", `Bearer ${token}`)
    .send({ number: '123456789', name: 'nima' })
    .expect(400);
});


it('should not create a credit card without a name', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
    await request(app)
      .post('/api/user/credit-card/create')
      .set("Authorization", `Bearer ${token}`)
      .send({ number: '1234567812345678' })
      .expect(400);
});


it('should not create a credit card without name and number', async () => {
  const { id, token } = await global.signin(
    users[0].id,
    users[0].email,
    users[0].phone
  );

  await request(app)
    .post('/api/user/credit-card/create')
    .set("Authorization", `Bearer ${token}`)
    .expect(400);
});


it('should not create a credit card that already exsists', async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );

    await request(app)
      .post('/api/user/credit-card/create')
      .set("Authorization", `Bearer ${token}`)
      .send({ number: '1234567812345678', name: 'nima' })
      .expect(201);
  
    await request(app)
      .post('/api/user/credit-card/create')
      .set("Authorization", `Bearer ${token}`)
      .send({ number: '1234567812345678', name: 'nima' })
      .expect(409);
});