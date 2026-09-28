import { describe, expect, it } from 'vitest';
import { createUserSchema } from '@app/shared';

describe('user schema', () => {
  it('rejects a weak password', () => {
    const result = createUserSchema.safeParse({
      login: 'person',
      password: '123456',
      roleIds: ['11111111-1111-4111-8111-111111111111'],
      status: 'active',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a strong payload', () => {
    const result = createUserSchema.safeParse({
      login: 'person',
      password: 'StrongPass!123',
      roleIds: ['11111111-1111-4111-8111-111111111111'],
      status: 'active',
    });
    expect(result.success).toBe(true);
  });
});
