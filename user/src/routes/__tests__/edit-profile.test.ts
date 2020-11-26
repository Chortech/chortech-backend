import request from "supertest";
import User from "../../models/user";
import { app } from "../../app";
import { users } from "../../test/setup";


it("should edit user's profile", async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
    await request(app)
      .put("/api/user/profile/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({ newName: 'Nima', picture: 'bullshit.jpeg'})
      .expect(200);
});


it("should not edit user's profile without an auth token", async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
    await request(app)
      .put("/api/user/profile/edit")
      .send({ newName: 'Nima', picture: 'bullshit.jpeg'})
      .expect(401);
});


it("should not edit user's profile with an invalid auth token", async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
    await request(app)
      .put("/api/user/profile/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({ newName: 'Nima', picture: 'bullshit.jpeg'})
      .expect(200);
});


it("should edit user's profile with only the picture", async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
    await request(app)
      .put("/api/user/profile/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({ newName: null, picture: 'bullshit.jpeg'})
      .expect(200);
});


it("should edit user's profile with only the name", async () => {
    const { id, token } = await global.signin(
      users[0].id,
      users[0].email,
      users[0].phone
    );
  
    await request(app)
      .put("/api/user/profile/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({ newName: 'nima', picture: null })
      .expect(200);
});