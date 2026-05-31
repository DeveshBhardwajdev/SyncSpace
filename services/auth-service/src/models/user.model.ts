import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document{
    name : string ;
    email : string ;
    password : string ;
    role : 'candidate' | 'interviewer' | 'admin';
    isVerified : boolean ;
    refreshToken? : string ;
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
            required : [true , "Password is required"],
            minLength : [8 , "Password must be atleast 8 characters"],
        },
        role : {
            type : String ,
            enum : ['candidate' , 'interviewer' ,'admin'],
            default : 'candidate',
        },

        isVerified: {
            type : Boolean,
            default : false,
        },
        refreshToken: {
            type : String,
            default : null,
        },
    },
    {
        timestamps : true ,
    }
);

const User = mongoose.model<IUser>('User',UserSchema);

export default User;