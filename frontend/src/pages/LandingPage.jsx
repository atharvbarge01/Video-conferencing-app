import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const router = useNavigate();

    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>Video Call</h2>
                </div>
                <div className='navlist'>
                    <p onClick={() => { router("/aljk23") }}>Join as Guest</p>
                    <p onClick={() => { router("/auth") }}>Register</p>
                    <div onClick={() => { router("/auth") }} role='button'>
                        <span style={{ color: "black" }}>Login</span>
                    </div>
                </div>
            </nav>


            <div className="landingMainContainer">
                <div>
                    <h1><span style={{ color: "#FF9839" }}>Connect</span> with your loved Ones</h1>

                    <p>Bridge the distance with high-quality Video Call.</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div>

                    <img src="/mobile.png" alt="Mobile App Preview" />

                </div>
            </div>



        </div>
    )
}
