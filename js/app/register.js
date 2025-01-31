import { addItem, getItemByIndex } from '../utils/dbUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    function generateRandomId() {
        const randomFourDigits = Math.floor(1000 + Math.random() * 9000); 
        const timestampLastSix = Date.now().toString().slice(-6); 
        return `${randomFourDigits}${timestampLastSix}`;
    }

    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('error-message');

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match!';
            return;
        } else {
            errorMessage.textContent = '';
        }

        const userId = generateRandomId().toString();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const role = document.getElementById('role').value;
        const verificationFile = document.getElementById('verificationFile').files[0];

        const user = {
            userId,
            username,
            email,
            password,
            role,
        };

        getItemByIndex('users', 'email', email).then(existingUser => {
            if (existingUser) {
                errorMessage.textContent = 'Email is already registered!';
                return;
            }

            if (role === 'owner' && verificationFile) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    user.verificationFile = e.target.result;
                    addItem('users', user).then(() => {
                        alert('User registered successfully!');
                        window.location.href = './login.html';
                    }).catch((error) => {
                        errorMessage.textContent = `Error: ${error.message}`;
                    });
                };
                reader.readAsDataURL(verificationFile);
            } else {
                addItem('users', user).then(() => {
                    alert('User registered successfully!');
                    window.location.href = './login.html';
                }).catch((error) => {
                    errorMessage.textContent = `Error: ${error.message}`;
                });
            }
        }).catch((error) => {
            errorMessage.textContent = `Error: ${error.message}`;
        });
    });

    document.getElementById('role').addEventListener('change', function (event) {
        const ownerFileInput = document.getElementById('owner-file-input');
        if (event.target.value === 'owner') {
            ownerFileInput.style.display = 'block';
        } else {
            ownerFileInput.style.display = 'none';
        }
    });
});