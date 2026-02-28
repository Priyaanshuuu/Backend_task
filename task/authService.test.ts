import { jest, describe, it, expect, beforeEach } from "@jest/globals";
jest.mock("@/lib/db/mongoose", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockUser = {
  _id: { toString: () => "user-id-123" },
  email: "test@example.com",
  passwordHash: "$2a$12$hashedpassword",
  createdAt: new Date("2024-01-01"),
};

jest.mock("@/lib/models/User_model", () => ({
  UserModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock("@/lib/utils/password", () => ({
  hashPassword: jest.fn().mockResolvedValue("$2a$12$hashedpassword"),
  comparePassword: jest.fn(),
}));

jest.mock("@/lib/utils/jwt", () => ({
  signAccessToken: jest.fn().mockReturnValue("mock.access.token"),
  signRefreshToken: jest.fn().mockReturnValue("mock.refresh.token"),
  verifyRefreshToken: jest.fn(),
}));

import { registerUser, loginUser } from "@/lib/services/authService";
import { UserModel } from "@/lib/models/User_model";
import { comparePassword } from "@/lib/utils/password";

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should create a new user and return tokens when email is unique", async () => {
      (UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      (UserModel.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await registerUser({ email: "test@example.com", password: "Password1" });

      expect(result.user.email).toBe("test@example.com");
      expect(result.user.id).toBe("user-id-123");
      expect(result.tokens.accessToken).toBe("mock.access.token");
      expect(result.tokens.refreshToken).toBe("mock.refresh.token");
    });

    it("should throw error when email already exists", async () => {
      (UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(
        registerUser({ email: "test@example.com", password: "Password1" })
      ).rejects.toThrow("An account with this email already exists!!");
    });
  });3

  describe("loginUser", () => {
    it("should return tokens for valid credentials", async () => {
      (UserModel.findOne as unknown as { mockReturnValue: Function }).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      (comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await loginUser({ email: "test@example.com", password: "Password1" });

      expect(result.user.email).toBe("test@example.com");
      expect(result.tokens.accessToken).toBe("mock.access.token");
    });

    it("should throw for non-existent user", async () => {
      (UserModel.findOne as unknown as { mockReturnValue: Function }).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(loginUser({ email: "ghost@example.com", password: "Password1" })).rejects.toThrow(
        "Invalid email or password"
      );
    });

    it("should throw for incorrect password", async () => {
      (UserModel.findOne as unknown as { mockReturnValue: Function }).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(loginUser({ email: "test@example.com", password: "WrongPass1" })).rejects.toThrow(
        "Invalid email or password"
      );
    });
  });
});