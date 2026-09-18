import User from "../model/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import OTP from "../model/otp.model.js";

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
const requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const normalizedPhone = phone.trim();

    // Remove previous OTP for this phone
    await OTP.deleteMany({
      phone: normalizedPhone,
      purpose: "LOGIN",
    });

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP before storing it
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({
      phone: normalizedPhone,
      otpHash,
      expiresAt,
      purpose: "LOGIN",
    });

    // DEVELOPMENT ONLY
    console.log(`OTP for ${normalizedPhone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const normalizedPhone = phone.trim();

    const otpRecord = await OTP.findOne({
      phone: normalizedPhone,
      purpose: "LOGIN",
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts",
      });
    }

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (otpHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    let user = await User.findOne({
      phone: normalizedPhone,
    });

    if (!user) {
      user = await User.create({
        name: "Customer",
        phone: normalizedPhone,
        isPhoneVerified: true,
      });
    } else {
      user.isPhoneVerified = true;
      await user.save();
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export { registerUser,loginUser ,requestOTP,verifyOTP  };