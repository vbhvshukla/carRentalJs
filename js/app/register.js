import { addItem, getItemByIndex } from '../utils/dbUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    function generateRandomId() {
        const randomFourDigits = Math.floor(1000 + Math.random() * 9000);
        const timestampLastSix = Date.now().toString().slice(-6);
        return `${randomFourDigits}${timestampLastSix}`;
    }

    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const errorMessage = document.getElementById('error-message');

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const role = document.getElementById('role').value.toLowerCase();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const verificationFile = document.getElementById('verificationFile').files[0];

        if (!username || !email || !password || !confirmPassword || !verificationFile || !role) {
            errorMessage.textContent = 'All fields are required!';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match!';
            return;
        }

        const existingEmail = await getItemByIndex('users', 'email', email);

        if (existingEmail) {
            errorMessage.textContent = 'Email is already registered!';
            return;
        }
        const hashedPassword = CryptoJS.SHA256(password).toString();

        const userId = generateRandomId();

        const user = {
            userId,
            username,
            email,
            password: hashedPassword,
            role,
            isApproved: role === 'owner' ? false : true,
            avgRating: 0,
            reviewCount: 0,
            paymentPreference: '',
        };

        if (role === 'owner' && verificationFile) {
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
            if (!allowedTypes.includes(verificationFile.type)) {
                errorMessage.textContent = "Invalid file format. Upload PNG, JPG, JPEG, or PDF.";
                return;
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                user.verificationFile = e.target.result;
                saveUser(user);
            };
            reader.readAsDataURL(verificationFile);
        } else {
            saveUser(user);
        }
    });

    function saveUser(user) {
        addItem('users', user)
            .then(() => {
                alert('User registered successfully!');
                window.location.href = './login.html';
            })
            .catch((error) => {
                document.getElementById('error-message').textContent = `Error: ${error.message}`;
            });
    }

    document.getElementById('role').addEventListener('change', function (event) {
        const ownerFileInput = document.getElementById('owner-file-input');
        ownerFileInput.style.display = event.target.value === 'owner' ? 'block' : 'none';
    });
});
