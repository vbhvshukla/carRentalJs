function setCookie(name,value,days){
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name){
    const cookies = document.cookie.split(';');
    for(const cookie of cookies){
        const [key,value] = cookie.split('=');
        if(key === name) return value;
    }
    return null;
}
export {getCookie,setCookie};