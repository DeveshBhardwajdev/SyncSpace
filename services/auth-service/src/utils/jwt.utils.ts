import  jwt, { SignOptions }  from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const hashPassword = async(plainTextPassword:string): Promise<string> =>{
    const saltRounds = 12 ;
    const hashed = await bcrypt.hash(plainTextPassword ,saltRounds);
    return hashed;
};

export const comparePassword = async (plainTextPassword : string , hashedPassword : string): Promise<boolean> =>{
    const isMatch = await bcrypt.compare(plainTextPassword , hashedPassword);
    return isMatch;
}

export const generateAccessToken = (userId : string , role : string) : string =>{
    const secret =process.env.JWT_ACCESS_SECRET;

    if(!secret){
        throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
    }

    const option : SignOptions ={
        expiresIn : (process.env.JWT_ACCESS_SECRET || '15m ') as SignOptions['expiresIn']
    }

    return jwt.sign(
        {userId , role},
        secret ,
        option
    );
};

export const generateRefreshToken = (userId : string): string =>{
    const secret =process.env.JWT_ACCESS_SECRET;

    if(!secret){
        throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
    }

    const option : SignOptions ={
        expiresIn : (process.env.JWT_ACCESS_SECRET || '7d') as SignOptions['expiresIn']
    }

    return jwt.sign(
        {userId},
        secret , 
        option
    );
};

