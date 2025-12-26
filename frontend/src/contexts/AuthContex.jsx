import axios from "axios";
import {createContext } from "react";
import { useContext,useState } from "react";
import { useNavigate } from "react-router-dom";
import HttpStatus from "http-status";
import server from "../environment";





export const AuthContext=createContext({});

const client = axios.create({
    baseURL:`${server}/api/v1/users`
})



export const AuthProvider = ({children})=>
{
    const authContext=useContext(AuthContext);

    const [userData,setUserData]=useState(authContext);
    const router = useNavigate();

    const handleRegister = async(name,username,password)=>
    {
        try{
            let request =await client.post("/register",
                {
                    name:name,
                    username:username,
                    password:password
                }
            )

            if(request.status==HttpStatus.CREATED)
            {
                return request.data.message;
                // res.status(httpStatus.CREATED).json({message:"User Registered"})
            }

        }
        catch(err){
            throw err;

        }
    }

    const handleLogin=async (username,password)=>
    {
        try{
            let request =await client.post("/login",{
                username:username,
                password:password
            });

            if(request.status===HttpStatus.OK)
            {
                localStorage.setItem("token",request.data.token);
                // return request.data.message;
                router("/home")

            }
        }
        catch(err)
        {
            throw err;
        }
    }

    const getHistoryOfUser = async () =>
    {
        try
        {
            let request = await client.get("/get_all_activity", {
                params:{
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        }
        catch(err)
        {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode)=>
    {
        try 
        {
            let request = await client.post("/add_to_activity", {
                token:localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        }
        catch(e)
        {
            throw e;
        }
    }
    

    const data={
        userData,setUserData,handleRegister,getHistoryOfUser,addToUserHistory,handleLogin
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}