import React from 'react';
import ReactDOM from 'react-dom/client';
//import './index.css';
import App from './App';
import favicon from './images/NATIONAL_white.png';

// Programmatically set favicon to use the YM logo from src/images
try {
    const setFavicon = (url) => {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = url;
    };
    setFavicon(favicon);
    // also set apple-touch-icon if present
    let apple = document.querySelector("link[rel='apple-touch-icon']");
    if (!apple) {
        apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(apple);
    }
    apple.href = favicon;
} catch (e) {
    // ignore if running in non-browser environment
    // console.warn('Could not set favicon dynamically', e);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
        <React.StrictMode>
                <App />
        </React.StrictMode>
);