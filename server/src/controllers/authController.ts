//! AUTH CONTROLELR

import { UserRepository } from "@repositories/UserRepository";
import { OfficerRepository } from "@repositories/OfficerRepository";
import { verifyPassword, generateToken } from "@services/authService";
import { UnauthorizedError } from "@utils/utils";


export async function loginUserByUsername(username: string, password: string): Promise<string> {
  const userRepo = new UserRepository();
  
  const user = await userRepo.getUserByUsername(username);
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid username or password");
  }
  
  return generateToken({
    id: user.id,
    username: user.username,
    type: "user"
  });
}
export async function loginUserByMail(email: string, password: string): Promise<string> {
  const userRepo = new UserRepository();

  const user = await userRepo.getUserByEmail(email);
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }
  return generateToken({
    id: user.id,
    username: user.username,
    type: "user"
  });
}


export async function loginOfficerByMail(email: string, password: string): Promise<string> {
  const officerRepo = new OfficerRepository();

  const officer = await officerRepo.getOfficerByEmail(email);
  const isValid = await verifyPassword(password, officer.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }
  return generateToken({
    id: officer.id,
    username: officer.email, // Use email as username in token
    type: officer.role
  });
}
export async function loginOfficerByUsername(username: string, password: string): Promise<string> {
  const officerRepo = new OfficerRepository();

  const officers = await officerRepo.getOfficersByUsername(username);
  if (officers.length === 0) {
    throw new UnauthorizedError("Invalid username or password");
  }
  const officer = officers[0];
  const isValid = await verifyPassword(password, officer.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid username or password");
  }
  return generateToken({
    id: officer.id,
    username: officer.email, // Use email as username in token
    type: officer.role
  });
}

export async function loginUser(identifier: string, password: string, isEmail: boolean): Promise<string> {
  return isEmail 
    ? loginUserByMail(identifier, password)
    : loginUserByUsername(identifier, password);
}

export async function loginOfficer(identifier: string, password: string, isEmail: boolean): Promise<string> {
  return isEmail 
    ? loginOfficerByMail(identifier, password)
    : loginOfficerByUsername(identifier, password);
}


export async function getUserByTelegramUsername(telegramUsername: string) {
  const userRepo = new UserRepository();
  const user = await userRepo.getUseryTelegramUsername(telegramUsername);
  if (!user) {
    throw new UnauthorizedError("No user associated with this Telegram username");
  }
  return generateToken({
    id: user.id,
    username: user.username,
    type: "user"
  });
}