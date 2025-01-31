function setCookie(name,value,days){
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const [key, value] = cookies[i].split("=");
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

export {getCookie,setCookie};