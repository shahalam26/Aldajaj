import mongoose from "mongoose";


const connectDb = async ()=>{

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongo db connected");
    }
    catch (error){
         console.error("mongo db connection failed:", error); 
        process.exit(1);
    }
}

export default connectDb;