import { requireAuth } from '@chortec/common';
import request from 'supertest';
import { app } from '../../app';
import { setExpire, Token } from '../../utils/jwt';


const signUpEmail = async () => {
    await global.mockVerification('example@domain.com');
    await request(app)
        .post('/api/auth/signup')
        .send({
            email: 'example@domain.com',
            name: 'nameee',
            password: 'password'
        });
};

const signUpPhone = async () => {
    await global.mockVerification('09171234567');
    await request(app)
        .post('/api/auth/signup')
        .send({ phone: '09171234567', name: 'nameee', password: 'password' })
        .expect(201);
};

const login = async (password: string, email?: string, phone?: string) => {
    const req = await request(app)
        .post('/api/auth/login')
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


it('should not change phone without an authentication token with email', async () => {
    await request(app)
        .put('/api/auth/change-phone')
        .send({ 
            newPhone: '09171234568' 
        })
        .expect(401);
});

it('should not change phone with an invalid authentication token with email', async () => {
    await request(app)
        .put('/api/auth/change-phone')
        .set('Authorization', 'jfsalfjlasjfljsda')
        .send({ 
            newPhone: '09171234568' 
        })
        .expect(401);
});

it('should not change phone with an expired authentication token with email', async () => {
    setExpire(1);
    const { id, token } = await login('password', 'example@domain.com', undefined);
    await global.delay(1000);
    await request(app)
        .put('/api/auth/change-phone')
        .set('Authorization', token)
        .send({ 
            newPhone: '09171234568'
        })
        .expect(403);
});

it('should not change phone without an authentication token with phone', async () => {
    await request(app)
        .put('/api/auth/change-phone')
        .send({ 
            newPhone: '09171234568'
        })
        .expect(401);
});

it('should not change email with an invalid authentication token with phone', async () => {
    await request(app)
        .put('/api/auth/change-phone')
        .set('Authorization', 'jfsalfjlasjfljsda')
        .send({ 
            newPhone: '09171234568'  
        })
        .expect(401);
});

it('should not change phone with an expired authentication token with phone', async () => {
    setExpire(1);
    const { id, token } = await login('password', undefined, '09171234567');
    await global.delay(1000);
    await request(app)
        .put('/api/auth/change-phone')
        .set('Authorization', token)
        .send({ 
            newPhone: '09171234568'  
        })
        .expect(403);
});

// it('should not change email if the email has already been registered', async () => {
//     const { id, token } = await login('password', undefined, '09171234567');
//     await mockVerification('hello@domain.com');

//     await request(app)
//         .put('/api/auth/change-phone')
//         .set('Authorization', token)
//         .send({ 
//             newPhone: '09171234568' 
//         })
//         .expect(409);
// });

// it('should not change email if the new email is not verified', async () => {
//     const { id, token } = await login('password', undefined, '09171234567');

//     await request(app)
//         .put('/api/auth/change-phone')
//         .set('Authorization', token)
//         .send({ 
//             newPhone: '09171234568' 
//         })
//         .expect(400);
// });

it('should change phone if the new phone is verified', async () => {
    const { id, token } = await login('password', undefined, '09171234567');

    await global.mockVerification('09171234568');
    await request(app)
        .put('/api/auth/change-phone')
        .set('Authorization', token)
        .send({ 
            newPhone: '09171234568' 
        })
        .expect(200);
});

it('should login with the new phone', async () => {
    const { id, token } = await login('password', undefined, '09171234567');

    await global.mockVerification('09171234568');
    await request(app)
        .put('/api/auth/change-phone')
        .set('Authorization', token)
        .send({ 
            newPhone: '09171234568' 
        });
    
    await request(app)
        .post('/api/auth/login')
        .send({ phone: '09171234568'  , password: 'password' })
        .expect(200);
});