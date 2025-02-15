const validators = {
    required: (value) => value !== undefined && value !== null && value !== '',
    minLength: (value, length) => value.length >= length,
    maxLength: (value, length) => value.length <= length,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    number: (value) => !isNaN(value) && value >= 0,
    password: (value) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value), // Minimum 8 characters, at least one letter and one number
    file: (value) => value instanceof File && value.size > 0,
    date: (value) => !isNaN(Date.parse(value)),
    amount: (value) => !isNaN(value) && value > 0,
    city: (value) => /^[a-zA-Z\s]+$/.test(value),
    carName: (value) => /^[a-zA-Z0-9][a-zA-Z0-9\s]+$/.test(value),
    basePrice: (value) => !isNaN(value) && value >= 0,
    description: (value) => value.length <= 500,
    carType: (value) => ['automatic', 'manual'].includes(value.toLowerCase()), 
    citySelect: (value) => ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur",
        "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna",
        "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli",
        "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad",
        "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur",
        "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli-Dharwad", "Bareilly", "Mysore", "Moradabad", "Gurgaon",
        "Aligarh", "Jalandhar", "Tiruchirappalli", "Bhubaneswar", "Salem", "Mira-Bhayandar", "Thiruvananthapuram",
        "Bhiwandi", "Saharanpur", "Guntur", "Amravati", "Bikaner", "Noida", "Jamshedpur", "Bhilai", "Cuttack",
        "Firozabad", "Kochi", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Nanded", "Kolhapur", "Ajmer",
        "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi", "Ulhasnagar", "Nellore", "Jammu", "Sangli",
        "Belgaum", "Mangalore", "Ambattur", "Tirunelveli", "Malegaon", "Gaya", "Jalgaon", "Udaipur", "Maheshtala",
        "Tiruppur", "Davanagere", "Kozhikode", "Akola", "Kurnool", "Bokaro", "South Dumdum"].includes(value),
    startDate: (value) => !isNaN(Date.parse(value)),
    endDate: (value, startDate) => !isNaN(Date.parse(value)) && new Date(value) >= new Date(startDate),
};

const validateField = (value, rules, formData) => {
    for (let rule in rules) {
        if (!validators[rule](value, rules[rule] === 'startDate' ? formData['startDate'] : rules[rule])) {
            return false;
        }
    }
    return true;
};

const validateForm = (formData, formRules) => {
    const errors = {};
    for (let field in formRules) {
        if (!validateField(formData[field], formRules[field], formData)) {
            errors[field] = `Invalid value for ${field}`;
        }
    }
    return errors;
};

export { validateField, validateForm };