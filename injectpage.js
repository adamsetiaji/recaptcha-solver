const key = "6LfMEAwTAAAAAK5MkDsHyDg-SE7wisIDM1-5mDQs";

// Bersihkan konten yang ada
document.body.innerHTML = '';
document.head.innerHTML = '';

// Tambahkan meta viewport untuk responsif
const meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'width=device-width, initial-scale=1.0';
document.head.appendChild(meta);

// Tambahkan title
const title = document.createElement('title');
title.textContent = 'reCAPTCHA Verification';
document.head.appendChild(title);

// Tambahkan style
const style = document.createElement('style');
style.textContent = `
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    body {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
        background: linear-gradient(135deg, #000080, #0000b3);
        color: white;
    }
    
    .container {
        width: 100%;
        max-width: 900px;
        text-align: center;
        animation: fadeIn 0.8s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .header {
        margin-bottom: 30px;
    }
    
    .header h1 {
        font-size: 32px;
        margin-bottom: 10px;
    }
    
    .header p {
        font-size: 18px;
        opacity: 0.9;
    }
    
    .card {
        background-color: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        color: #333;
        margin-bottom: 20px;
    }
    
    .scale {
        transform: scale(1.2);
        transform-origin: center;
        margin: 20px auto;
        position: relative;
        z-index: 9999;
    }
    
    .g-recaptcha {
        position: relative !important;
        z-index: 9999 !important;
        display: inline-block;
    }
    
    .g-recaptcha iframe {
        position: relative !important;
        z-index: 9999 !important;
    }
    
    .textarea-label {
        display: block;
        margin-bottom: 10px;
        font-weight: bold;
        text-align: left;
    }
    
    textarea {
        width: 100%;
        height: 250px;
        margin-top: 10px;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #ccc;
        resize: vertical;
        font-family: monospace;
        font-size: 14px;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    textarea:focus {
        outline: none;
        border-color: #4c6bc0;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(76, 107, 192, 0.2);
    }
    
    .copy-button {
        display: inline-block;
        margin-top: 15px;
        padding: 12px 20px;
        background-color: #4c6bc0;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: background-color 0.3s, transform 0.2s;
    }
    
    .copy-button:hover {
        background-color: #3949ab;
        transform: translateY(-2px);
    }
    
    .copy-button:active {
        transform: translateY(0);
    }
    
    .footer {
        margin-top: 20px;
        font-size: 14px;
        opacity: 0.8;
    }
    
    @media (max-width: 768px) {
        .scale {
            transform: scale(1);
        }
        
        .card {
            padding: 20px;
        }
    }
`;
document.head.appendChild(style);

// Buat struktur DOM
const container = document.createElement('div');
container.className = 'container';

// Header
const header = document.createElement('div');
header.className = 'header';

const heading = document.createElement('h1');
heading.textContent = 'Verifikasi reCAPTCHA';

const subheading = document.createElement('p');
subheading.textContent = 'Silakan lengkapi verifikasi untuk mendapatkan token akses';

header.appendChild(heading);
header.appendChild(subheading);
container.appendChild(header);

// Card
const card = document.createElement('div');
card.className = 'card';

// Form & reCAPTCHA
const form = document.createElement('form');
form.method = 'POST';

const recaptchaWrapper = document.createElement('div');
recaptchaWrapper.style.textAlign = 'center';
recaptchaWrapper.style.marginBottom = '20px';

const recaptchaDiv = document.createElement('div');
recaptchaDiv.className = 'g-recaptcha scale';
recaptchaDiv.dataset.sitekey = key;
recaptchaDiv.dataset.callback = 'submit';

recaptchaWrapper.appendChild(recaptchaDiv);
form.appendChild(recaptchaWrapper);

// Textarea container
const textareaContainer = document.createElement('div');
textareaContainer.style.width = '100%';

const textareaLabel = document.createElement('label');
textareaLabel.className = 'textarea-label';
textareaLabel.htmlFor = 'g-recaptcha-response';
textareaLabel.textContent = 'Token reCAPTCHA:';

const displayTextarea = document.createElement('textarea');
displayTextarea.id = 'g-recaptcha-response';
displayTextarea.name = 'g-recaptcha-response';
displayTextarea.placeholder = 'Token akan muncul di sini setelah verifikasi selesai...';
displayTextarea.readOnly = true;

const copyButton = document.createElement('button');
copyButton.type = 'button';
copyButton.id = 'copyButton';
copyButton.className = 'copy-button';
copyButton.textContent = 'Salin Token';

textareaContainer.appendChild(textareaLabel);
textareaContainer.appendChild(displayTextarea);
textareaContainer.appendChild(copyButton);
form.appendChild(textareaContainer);

card.appendChild(form);
container.appendChild(card);

// Footer
const footer = document.createElement('div');
footer.className = 'footer';

const footerText = document.createElement('p');
footerText.textContent = '© 2025 Layanan Verifikasi';

footer.appendChild(footerText);
container.appendChild(footer);

// Tambahkan ke body
document.body.appendChild(container);

// Script untuk reCAPTCHA & fungsi salin
window.submit = function(token) {
    document.getElementById('g-recaptcha-response').value = token;
    return false;
};

// Tambahkan fungsi tombol salin
document.getElementById('copyButton').addEventListener('click', function() {
    const tokenField = document.getElementById('g-recaptcha-response');
    tokenField.select();
    document.execCommand('copy');
    
    const originalText = this.textContent;
    this.textContent = 'Tersalin!';
    this.style.backgroundColor = '#4CAF50';
    
    setTimeout(() => {
        this.textContent = originalText;
        this.style.backgroundColor = '';
    }, 2000);
});

// Tambahkan script reCAPTCHA
const script = document.createElement('script');
script.src = 'https://www.google.com/recaptcha/api.js';
script.async = true;
script.defer = true;
document.head.appendChild(script);
