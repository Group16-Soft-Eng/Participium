//! AUTH CONTROLELR
import { UserRepository } from "@repositories/UserRepository";
import { OfficerRepository } from "@repositories/OfficerRepository";
import { verifyPassword, generateToken, saveSession } from "@services/authService";
import { UnauthorizedError } from "@utils/utils";


export async function loginUserByUsername(username: string, password: string): Promise<string> {
  const userRepo = new UserRepository();
  
  const user = await userRepo.getUserByUsername(username);
  
  if (!user.password) {
    throw new UnauthorizedError("Invalid username or password");
  }
  
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid username or password");
  }
  
  const token = generateToken({
    id: user.id,
    username: user.username,
    type: "user"
  });
  
  // Save session in Redis
  await saveSession(user.id, token, "web");
  
  return token;
}
export async function loginUserByMail(email: string, password: string): Promise<string> {
  const userRepo = new UserRepository();

  const user = await userRepo.getUserByEmail(email);
  
  if (!user.password) {
    throw new UnauthorizedError("Invalid email or password");
  }
  
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }
  
  const token = generateToken({
    id: user.id,
    username: user.username,
    type: "user"
  });
  
  // Save session in Redis
  await saveSession(user.id, token, "web");
  
  return token;
}


export async function loginOfficerByMail(email: string, password: string): Promise<string> {
  const officerRepo = new OfficerRepository();

  const officer = await officerRepo.getOfficerByEmail(email);
  
  if (!officer.password) {
    throw new UnauthorizedError("Invalid email or password");
  }
  
  const isValid = await verifyPassword(password, officer.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }
  
  const token = generateToken({
    id: officer.id,
    username: officer.email, // Use email as username in token
    type: officer.role
  });
  
  // Save session in Redis
  await saveSession(officer.id, token, "web");
  
  return token;
}
export async function loginOfficerByUsername(username: string, password: string): Promise<string> {
  const officerRepo = new OfficerRepository();

  const officers = await officerRepo.getOfficersByUsername(username);
  if (officers.length === 0) {
    throw new UnauthorizedError("Invalid username or password");
  }
  const officer = officers[0];
  
  if (!officer.password) {
    throw new UnauthorizedError("Invalid username or password");
  }
  
  const isValid = await verifyPassword(password, officer.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid username or password");
  }
  
  const token = generateToken({
    id: officer.id,
    username: officer.email, // Use email as username in token
    type: officer.role
  });
  
  // Save session in Redis
  await saveSession(officer.id, token, "web");
  
  return token;
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
  
  const token = generateToken({
    id: user.id,
    username: user.username,
    type: "user",
    sessionType: "telegram"
  });
  
  // Save session in Redis as telegram session
  await saveSession(user.id, token, "telegram");
  
  return token;
}