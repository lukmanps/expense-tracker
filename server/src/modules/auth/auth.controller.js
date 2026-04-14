import { registerSchema, loginSchema, updateProfileSchema } from './auth.schema.js';
import * as authService from './auth.service.js';

export async function register(request, reply) {
  const data = registerSchema.parse(request.body);
  const user = await authService.createUser(data);
  const token = request.server.jwt.sign({ id: user.id, phone: user.phone });
  return reply.code(201).send({ user, token });
}

export async function login(request, reply) {
  const data = loginSchema.parse(request.body);
  const user = await authService.verifyUser(data);
  const token = request.server.jwt.sign({ id: user.id, phone: user.phone });
  return reply.send({ user, token });
}

export async function getMe(request, reply) {
  const user = await authService.getUserById(request.user.id);
  return reply.send({ user });
}

export async function updateProfile(request, reply) {
  const data = updateProfileSchema.parse(request.body);
  const user = await authService.updateUser(request.user.id, data);
  return reply.send({ user });
}
