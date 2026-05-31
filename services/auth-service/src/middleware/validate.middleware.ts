import { Request, Response,NextFunction } from "express";
import {body , validationResult } from 'express-validator';

export const registerValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({min:2 , max:50})
        .withMessage("Name must be between 2 and 50 characters"),

    body('email')
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please Provide a valid Email Address")
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage("Password is Required")
        .isLength({min:8})
        .withMessage("Password Must be 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain atleast one uppercase letter , one lowercase letter and one number"),
];

export const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Enter Valid Email Address")
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage("Password is Required"),
];

export const handleValidationError = (
    req : Request ,
    res : Response ,
    next : NextFunction
): void =>{
    const error = validationResult(req);

    if(error.isEmpty()){
        next();
        return;
    }
    
    const extractedErrors = error.array().map((err)=>err.msg);

    res.status(400).json({
        success: false ,
        message : 'Validation Failed',
        errors : extractedErrors,
    });
};
