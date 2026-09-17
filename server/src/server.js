import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import productRoutes from "./routes/product.route.js";

dotenv.config();

const app=express();

app.use(cors());

app.use(express.json());
app.use("/api/products", productRoutes);

app.get("/",(req,res)=>{
        res.json({
            message:"chicken delivery api is running"
        });
});

const PORT = process.env.PORT || 5000;


const startserver= async ()=>{
       try{
        await connectDB();
        app.listen(PORT ,()=>{
    console.log("server running on port "+PORT)
       } )
     
}
catch (error) {
    console.error("Failed to start server:", error.message);
    }
}

startserver();