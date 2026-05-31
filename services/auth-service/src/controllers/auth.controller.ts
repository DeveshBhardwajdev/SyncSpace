import { Request, Response } from "express";
import User from "../models/user.model";

import {
    hashPassword,
    comparePassword ,
    generateAccessToken ,
    generateRefreshToken ,
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