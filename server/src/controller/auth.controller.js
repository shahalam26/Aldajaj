import User from "../model/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerUser=async(req,res)=>{

    try{
        const {name,email,phone,password}=req.body;
        const existinguser=await User.findOne({
            $or:[{email},{phone}]
        });
        if(existinguser){
           return res.status(409).json({
            success:false,
            message:"user already exists",
           });
        }
        const hashedpassword=await bcrypt.hash(password,12);

        const user = await User.create({
            name,email,phone,password:hashedpassword,
        })

        res.status(201).json({
            success:true,
            message:"user created successfully",
            user
        })
    }
    catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

const loginUser=async(req,res)=>{
    try{
        const {email,password}=req.body;

        const user= await User.findOne({email})

        if(!user){
            return res.status(401).json({
                success:false,
                message:"Invalid email or password",
            });

        }

        const isPasswordCorrect=await bcrypt.compare(password,user.password);

        if(!isPasswordCorrect){
            return res.status(401).json({
                success:false,
                message:"invalid user name or password",
            })
        }
        const token=jwt.sign({
            userId:user._id,
            role:user._role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn:"7d"
        }
    );

        res.status(200).json({
            success:true,
            message:"login successfull",
            token,
            user:{
                
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  
            },
        })
        
    }
    catch (error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

export { registerUser,loginUser };