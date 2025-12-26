import express, { urlencoded } from "express";
import {createServer} from "node:http";

import {connectTosocket} from "./controllers/socketmanger.js"
import mongoose from "mongoose";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app=express();
const server = createServer(app);
const io = connectTosocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));

// routes calling
app.use("/api/v1/users",userRoutes);

app.get("/home",(req,res)=>
{
    return res.json({"hello":"world"})
});

const start =async()=>
{
    const connectionDb=await mongoose.connect("mongodb+srv://shrutiwagh1704_db_user:2qxnGwHfW26t4F19@cluster0.wbuobxf.mongodb.net/");
    console.log(`database connected ${connectionDb.connection.host}`);
    server.listen(app.get("port"), () => {
    console.log("LISTENIN ON PORT 8000");
    });
}

start();
