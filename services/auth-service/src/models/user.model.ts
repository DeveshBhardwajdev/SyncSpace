import mongoose, { Document, Schema } from "mongoose";

// The enum is defined once here and imported everywhere else
// This means "UserRole.CANDIDATE" is the only valid way to say 'candidate'
// TypeScript will catch any typo at compile time before it becomes a bug
export enum UserRole {
    CANDIDATE = 'candidate',
    INTERVIEWER = 'interviewer',
    ADMIN = 'admin',
}

export interface IUser extends Document{
    name : string ;
    email : string ;
    password : string ;
    role : UserRole ;
    isVerified : boolean ;
    refreshToken? : string ;
    provider : string ;
    providerId : string ;
    createdAt : Date ;
    updatedAt : Date ;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type : String , 
            required : [true , "Name is required"],
            trim : true ,
            minLength : [2 , "Name must be atleast 2 characters"],  
            maxLength : [50 , "Name must not exceed 50 characters"],  
        },
        email:{
            type : String ,
            required: true ,
            unique : true ,
            trim : true ,
            lowercase : true ,
        },
        password : {
            type : String ,
            required : false,
            minLength : [8 , "Password must be atleast 8 characters"],
        },
        role : {
            type : String ,
            // Now references the enum values instead of raw strings
            enum : Object.values(UserRole),
            default : UserRole.CANDIDATE,
        },

        isVerified: {
            type : Boolean,
            default : false,
        },
        refreshToken: {
            type : String,
            default : null,
        },
        provider: {
            type: String,
            required: true,
            default: "local",
        },
        providerId: {
            type: String,
            required: false,
        },
    },
    {
        timestamps : true ,
    }
);

const User = mongoose.model<IUser>('User',UserSchema);

export default User;