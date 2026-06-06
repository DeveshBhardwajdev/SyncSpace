import { Request, Response } from "express";
import User from "../models/user.model";
import redis from '../config/redis';
import jwt from "jsonwebtoken";

import {
    hashPassword,
    comparePassword ,
    generateAccessToken ,
    generateRefreshToken ,
    verifyRefreshToken  
} from '../utils/jwt.utils' ;

export const register = async (req:Request , res:Response): Promise<void> =>{
    try{
        const {name, email , password} = req.body ;

        const existingUser = await User.findOne({email});

        if(existingUser){
            res.status(409).json({
                success : false ,
                message : "An Account with this email already exist",
            });
            return ;
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await User.create({
            name ,
            email ,
            password : hashedPassword ,
        });

        const accessToken = generateAccessToken(
            newUser._id.toString(),
            newUser.role
        );

        const refreshToken = generateRefreshToken(newUser._id.toString());

        newUser.refreshToken = refreshToken;
        await newUser.save();

        res.status(201).json({
            success : true ,
            message : "Account Created Successfully",
            date : {
                user : {
                    id: newUser._id,
                    name:newUser.name,
                    email:newUser.email,
                    role:newUser.role,
                    isVerified:newUser.isVerified,
                },
                accessToken,
                refreshToken,
            },
        });
    }catch(error : unknown){

        if(
            typeof error === 'object' &&
            error != null &&
            'code' in error && 
            (error as {code : number}).code === 11000
        ){
            res.status(409).json({
                success : false ,
                message : "An account with this email Already Exist",
            });
            return;
        }

        console.error('Register error:' , error);
        res.status(500).json({
            success : false ,
            message : "Something went wrong please try again",
        });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',  
      });
      return;
    }

    const accessToken = generateAccessToken(
      user._id.toString(),
      user.role
    );

    const refreshToken = generateRefreshToken(user._id.toString());

    
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }); 

    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
    });
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Get the access token from the Authorization header
    // The header looks like: "Bearer eyJhbGc..."
    // We split by space and take the second part — the actual token
    
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
   

    if (accessToken) {
      // Step 2: Decode the token to find out when it expires
      // We use jwt.decode (not verify) because we don't need to validate it here
      // We just need the expiry time so we know how long to blacklist it
      const decoded = jwt.decode(accessToken) as { exp?: number } | null;

      if (decoded && decoded.exp) {
        // Step 3: Calculate how many seconds remain until the token expires
        // decoded.exp is a Unix timestamp (seconds since 1970)
        // Date.now() returns milliseconds so we divide by 1000
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);

        if (ttl > 0) {
          // Step 4: Write the token to Redis blacklist with TTL
          // Key format: "blacklist:TOKEN_STRING"
          // Value: "1" (we only care that the key exists, not the value)
          // EX ttl: Redis will automatically delete this key after ttl seconds
          await redis.set(`blacklist:${accessToken}`, '1', 'EX', ttl);
        }
      }
    }

    // Step 5: Clear the refresh token cookie from the browser
    // httpOnly: true means JavaScript cannot read this cookie (XSS protection)
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
    });
  }
};

// ─── Refresh Token ─────────────────────────────────────────────────────────
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    // Step 1: Read the refresh token from the httpOnly cookie
    // Cookies are automatically sent by the browser on every request
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
      return;
    }

    // Step 2: Check if this refresh token has been blacklisted in Redis
    // This catches stolen/reused tokens that were already rotated
    const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);

    if (isBlacklisted) {
      // This is a serious security event — someone is reusing an old refresh token
      // Clear the cookie immediately
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      res.status(401).json({
        success: false,
        message: 'Refresh token reuse detected. Please login again.',
      });
      return;
    }

    // Step 3: Verify the refresh token signature and expiry
    // verifyRefreshToken throws if invalid — caught by catch block below
    const decoded = verifyRefreshToken(refreshToken);

    // Step 4: Find the user in MongoDB to make sure they still exist
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
      return;
    }

    // Step 5: Blacklist the OLD refresh token in Redis
    // This is the core of rotation — old token can never be used again
    const oldTokenDecoded = jwt.decode(refreshToken) as { exp?: number } | null;

    if (oldTokenDecoded && oldTokenDecoded.exp) {
      const ttl = oldTokenDecoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redis.set(`blacklist:${refreshToken}`, '1', 'EX', ttl);
      }
    }

    // Step 6: Generate brand new access token and refresh token
    const newAccessToken = generateAccessToken(
      user._id.toString(),
      user.role
    );
    const newRefreshToken = generateRefreshToken(
      user._id.toString()
    );

    // Step 7: Send new refresh token as httpOnly cookie
    // httpOnly means JavaScript cannot read this cookie — XSS protection
    // maxAge is 7 days in milliseconds
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Step 8: Send new access token in response body
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    // Both mean the token is invalid — user must login again
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token. Please login again.',
    });
  }
};