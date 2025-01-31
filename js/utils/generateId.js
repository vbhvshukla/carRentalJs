function generateRandomId() {
    const randomFourDigits = Math.floor(1000 + Math.random() * 9000);
    const timestampLastSix = Date.now().toString().slice(-6);
    return `${randomFourDigits}${timestampLastSix}`;
}

export {generateRandomId}
