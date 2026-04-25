import { User, UserSchema } from './user.schema';

describe('UserSchema', () => {
  it('defines the basic user fields and timestamps', () => {
    expect(User.name).toBe('User');
    expect(UserSchema.path('username').isRequired).toBe(true);
    expect(UserSchema.path('username').options.unique).toBe(true);
    expect(UserSchema.path('email').isRequired).toBe(true);
    expect(UserSchema.path('email').options.unique).toBe(true);
    expect(UserSchema.get('timestamps')).toBe(true);
  });
});
