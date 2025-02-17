export const dbSchema = {
  "users": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "password": "string",
    "role": "string",
    "isApproved": "boolean",
    "avgRating": "number",
    "ratingCount": "number",
    "paymentPreference": "string",
    "verificationFile": "string"
  },
  "cars": {
    "carId": "string",
    "carName": "string",
    "carType": "string",
    "city": "string",
    "createdAt": "string",
    "description": "string",
    "isAvailableForLocal": "boolean",
    "isAvailableForOutstation": "boolean",
    "avgRating": "number",
    "ratingCount": "number",
    "images": ["string"],
    "featured": ["string"],
    "category": {
      "categoryId": "string",
      "categoryName": "string"
    },
    "owner": {
      "userId": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "isApproved": "boolean",
      "avgRating": "number",
      "ratingCount": "number",
      "paymentPreference": "string"
    },
    "rentalOptions": {
      "local": {
        "pricePerHour": "number", //price per hour
        "maxKmPerHour": "number", //max limit to be drivable in an hour
        "extraHourRate": "number", //if user extends the range limit
        "extraKmRate": "number" //if user extends the range limit
      },
      "outstation": {
        "pricePerDay": "number", //price per day
        "pricePerKm": "number", //per km charge for outstations
        "minimumKmChargeable": "number", //minimum chargeable even if user drives 10 km after booking for 24 hours
        "maxKmLimitPerDay":"number",
        "extraDayRate": "number", //if extra hours is 8+ hours this rate would be applicable 
        "extraHourlyRate": "number", //if extra hours is less than 8 hours
        "extraKmRate": "number" //flat km rate applicable no matter the case 
      }
    }
  },
  "bookings": {
    "bookingId": "string",
    "fromTimestamp": "string",
    "toTimestamp": "string",
    "status": ["pending", "confirmed", "completed", "cancelled"],
    "createdAt": "string",
    "rentalType": "string",
    "bid": {
      "bidId": "string",
      "fromTimestamp": "string",
      "toTimestamp": "string",
      "status": "string",
      "createdAt": "string",
      "bidAmount": "number",
      "rentalType": "string",
      "bidBaseFare": "number",
      "user": {
        "userId": "string",
        "username": "string",
        "email": "string",
        "role": "string",
        "paymentPreference": "string",
        "avgRating": "number",
        "ratingCount": "number"
      },
      "car": {
        "carId": "string",
        "carName": "string",
        "carType": "string",
        "city": "string",
        "createdAt": "string",
        "description": "string",
        "isAvailableForLocal": "boolean",
        "isAvailableForOutstation": "boolean",
        "avgRating": "number",
        "ratingCount": "number",
        "images": ["string"],
        "featured": ["string"],
        "category": {
          "categoryId": "string",
          "categoryName": "string"
        },
        "owner": {
          "userId": "string",
          "username": "string",
          "email": "string",
          "role": "string",
          "isApproved": "boolean",
          "avgRating": "number",
          "ratingCount": "number",
          "paymentPreference": "string"
        },
        "rentalOptions": {
          "local": {
            "pricePerHour": "number", //price per hour
            "maxKmPerHour": "number", //max limit to be drivable in an hour
            "extraHourRate": "number", //if user extends the range limit
            "extraKmRate": "number" //if user extends the range limit
          },
          "outstation": {
            "pricePerDay": "number", //price per day
            "pricePerKm": "number", //per km charge for outstations
            "minimumKmChargeable": "number", //minimum chargeable even if user drives 10 km after booking for 24 hours
            "extraDayRate": "number", //if extra hours is 8+ hours this rate would be applicable 
            "extraHourlyRate": "number", //if extra hours is less than 8 hours
            "extraKmRate": "number" //flat km rate applicable no matter the case 
          }
        }
      },
    },
    //Calculated after booking is over
    "baseFare": "number",
    "extraKmCharges": "number",
    "extraHourCharges": "number",
    "totalFare": "number"

  },
  "bids": {
    "bidId": "string",
    "fromTimestamp": "string",
    "toTimestamp": "string",
    "status": "string",
    "createdAt": "string",
    "bidAmount": "number",
    "rentalType": "string",
    "bidBaseFare": "number",
    "user": {
      "userId": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "paymentPreference": "string",
      "avgRating": "number",
      "ratingCount": "number"
    },
    "car": {
      "carId": "string",
      "carName": "string",
      "carType": "string",
      "city": "string",
      "createdAt": "string",
      "description": "string",
      "isAvailableForLocal": "boolean",
      "isAvailableForOutstation": "boolean",
      "avgRating": "number",
      "ratingCount": "number",
      "images": ["string"],
      "featured": ["string"],
      "category": {
        "categoryId": "string",
        "categoryName": "string"
      },
      "owner": {
        "userId": "string",
        "username": "string",
        "email": "string",
        "role": "string",
        "isApproved": "boolean",
        "avgRating": "number",
        "ratingCount": "number",
        "paymentPreference": "string"
      },
      "rentalOptions": {
        "local": {
          "pricePerHour": "number", //price per hour
          "maxKmPerHour": "number", //max limit to be drivable in an hour
          "extraHourRate": "number", //if user extends the range limit
          "extraKmRate": "number" //if user extends the range limit
        },
        "outstation": {
          "pricePerDay": "number", //price per day
          "pricePerKm": "number", //per km charge for outstations
          "maxKmLimitPerDay" : "number",
          "minimumKmChargeable": "number", //minimum chargeable even if user drives 10 km after booking for 24 hours
          "extraDayRate": "number", //if extra hours is 8+ hours this rate would be applicable 
          "extraHourlyRate": "number", //if extra hours is less than 8 hours
          "extraKmRate": "number" //flat km rate applicable no matter the case 
        }
      }
    },
  },
  "categories": {
    "categoryId": "string",
    "categoryName": "string"
  },
  "conversations": {
    "chatId": "string",
    "lastMessage": "string",
    "lastTimestamp": "string",
    "owner": {
      "userId": "string",
      "username": "string",
      "email": "string"
    },
    "user": {
      "userId": "string",
      "username": "string",
      "email": "string"
    }
  },
  "messages": {
    "messageId": "string",
    "chatId": "string",
    "message": "string",
    "hasAttachment": "boolean",
    "attachment": "string",
    "createdAt": "string",
    "fromUser": {
      "userId": "string",
      "username": "string",
      "email": "string"
    },
    "toUser": {
      "userId": "string",
      "username": "string",
      "email": "string"
    }
  },
  "carAvailability": {
    "carId": "string",
    "fromTimestamp": "Date()",
    "toTimestamp": "Date()",
  }
}
