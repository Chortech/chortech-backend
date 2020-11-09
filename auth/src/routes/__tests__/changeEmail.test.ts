import { requireAuth } from '@chortec/common';
import request from 'supertest';
import { app } from '../../app';
import { setExpire, Token } from '../../utils/jwt';


const signUpEmail = async () => {
    await global.mockVerification('example@domain.com');
    await request(app).post('api/auth/signup').send({
        email: 'example@domain',
        name: 'nameee',
        password: 'password'
    });
};

const signUpPhone = async () => {
    await global.mockVerification("09333333333");
    await request(app)
        .post("/api/auth/signup")
        .send({ phone: "09333333333", name: "nameee", password: "password" })
        .expect(201);
  };

const login = async (password: string, email?: string, phone?: string) => {
    const req = await request(app)
        .post('api/auth/login')
        .send(phone ? { phone, password } : { email, password })
        .expect(200);
    
    const { id } = req.body;
    const token: Token = req.body.token;

    return {
        id,
        token: `Bearer ${token.access}`
    };
};

beforeEach(async () => {
    await signUpEmail();
    await signUpPhone();
});


it('should not change email without an authentication token with email', async () => {
    await request(app)
        .put('/api/auth/change-email')
        .send({ 
            newEmail: 'hello@gmail.com' 
        })
        .expect(401);
});