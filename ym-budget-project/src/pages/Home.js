import React from 'react';
import logo from '../images/NATIONAL_white.png';
import slide from '../images/steps.png';

import '../App.css';

function Home() {
    return (
        <div>
            <div className='home'>
                <img src={logo} alt="YM Logo" style={{ height: 150 }} />
                <h2>YM Budget Tracking App!</h2>
                <a href="https://ymsisters.org/" target="_blank" rel="noopener noreferrer">
                    Visit YM Main Website
                </a>
            </div>
            <div className='steps'>
                <h2>Steps</h2>
                <a
                    href="/YM%20Treasurers%20Training%20Presentation.pptx"
                    download
                >
                    Download Training Slides
                </a>
            </div>
        </div>
    );
}

export default Home;
