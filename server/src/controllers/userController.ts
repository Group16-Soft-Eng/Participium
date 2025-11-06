//! USER CONTROLLER

import { User } from "@dto/User";
import { UserRepository } from "@repositories/UserRepository";
import { mapUserDAOToDTO } from "@services/mapperService";


export async function getAllUsers(): Promise<User[]> {
  const userRepo = new UserRepository();
  const users = await userRepo.getAllUsers();
  return users.map(mapUserDAOToDTO); // pattern che avevamo usato a GeoControl
}


export async function getUser(username: string): Promise<User> {
  const userRepo = new UserRepository();
  const user = await userRepo.getUserByUsername(username);
  return mapUserDAOToDTO(user);
}


export async function createUser(userDto: User): Promise<User> {
  const userRepo = new UserRepository();
  const createdUser = await userRepo.createUser(
    userDto.username!,
    userDto.firstName!,
    userDto.lastName!,
    userDto.email!,
    userDto.password! // will be hashed in repository, not here (quindi qui la passo plain)
  );
  return mapUserDAOToDTO(createdUser);
}

export async function deleteUser(username: string): Promise<void> {
  const userRepo = new UserRepository();
  await userRepo.deleteUser(username);
}


export async function logoutUser(): Promise<void> {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token
  //TODO: capire se ci serve ancora o no
  return;
}
