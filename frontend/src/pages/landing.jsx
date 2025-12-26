import React from 'react'
import "../App.css";
import { Link, useNavigate } from 'react-router-dom';

export default function landing() {

    const router = useNavigate();
  return (
    <>
        <div className='landingPageContainer'>
            <div className='nav'>
                <div className='navHeader'>
                    <h2>Connecto</h2>
                </div>

                <div className='navList'>
                    <p onClick={()=>{
                       router("/llmmnn")
                    }}>join as guest</p>

                    <p onClick={()=>{
                    router("/auth")}}>register</p>

                    <div onClick={()=>{
                    router("/auth")}} role='button'>Login
                    </div>
                </div>
            </div>

            <div className="landingMainPageContainer">
                <div>
                    <h1><span style={{color:"#FF9839"}}>Connect</span> with your loved once</h1>
                    <p>Cover a distance by Connecto</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div>
                    <img src='/mobile.png'/>
                </div>
            </div>
        </div>
    </>
  )
}
