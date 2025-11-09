//! AUTH CONTROLELR

import { UserRepository } from "@repositories/UserRepository";
import { OfficerRepository } from "@repositories/OfficerRepository";
import { verifyPassword, generateToken } from "@services/authService";
import { UnauthorizedError } from "@utils/utils";


export async function loginUser(username: string, password: string): Promise<string> {
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


export async function loginOfficer(email: string, password: string): Promise<string> {
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
