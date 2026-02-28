import {connectDB} from "@/lib/db/mongoose"
import { UserModel } from "../models/User_model"
import {hashPassword , comparePassword} from "@/lib/utils/password"
import {signAccessToken , signRefreshToken , verifyRefreshToken} from "../../lib/utils/jwt"
import { RegisterInput , LoginInput } from "../validators/authSchema"
import { AuthTokens , PublicUser } from "@/types"

export interface RegisterResult {
    user : PublicUser;
    tokens : AuthTokens; 
}

export interface LoginResult {
    user : PublicUser;
    tokens : AuthTokens;
}

export async function registerUser(input : RegisterInput): Promise<RegisterResult>{
    await connectDB();
    const existingUser = await UserModel.findOne({ email : input.email}).lean();
    if(existingUser){
        const err = new Error("An account with this email already exists!!");
        // (err as NodeJS.ErrorException).code = "EMAIL_TAKEN";
        throw err
    } 
    const passwordHash = await hashPassword(input.password);
    const user = await UserModel.create({email: input.email , passwordHash});

    const tokens = generateTokenPair(user._id.toString() , user.email);

    return {
        user : {
            id: user._id.toString(),
            email : user.email,
            createdAt : user.createdAt,
        },
        tokens
    }
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  await connectDB();

  const user = await UserModel.findOne({ email: input.email }).select("+passwordHash");

  if (!user) {

    throw new Error("Invalid email or password");
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const tokens = generateTokenPair(user._id.toString(), user.email);

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt,
    },
    tokens,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  await connectDB();

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("Refresh token is invalid or expired");
  }

  const user = await UserModel.findById(payload.sub).lean();
  if (!user) {
    throw new Error("User no longer exists");
  }

  const accessToken = signAccessToken({ sub: user._id.toString(), email: user.email });
  return { accessToken };
}


function generateTokenPair(userId: string, email: string): AuthTokens {
  return {
    accessToken: signAccessToken({ sub: userId, email }),
    refreshToken: signRefreshToken(userId),
  };
}