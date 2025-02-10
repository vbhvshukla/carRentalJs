import { addItem, getItemByKey } from "./dbUtils.js";
import { generateRandomId } from "./generateId.js";

async function injectDemoData() {
    const userId = generateRandomId();
    const ownerId = "7566772153"; 
    const carId = "1489834364";

    const existingOwner = await getItemByKey("users", ownerId);
    if (!existingOwner) {
        await addItem("users", {
            userId: ownerId,
            username: "Olivia",
            email: "olivia@example.com",
            password: "87c1ab7a0a1cec50c4e8e101a99e6c5c91efc04f0effe85958a5d2ce32a202d3",
            role: "owner",
            isApproved: true,
            avgRating: 2.5,
            ratingCount: 3,
            reviewCount: 0,
            paymentPreference: "",
            verificationFile: "data:image/jpeg;base64,/9j/4AA"
        });
    }


    const existingUser = await getItemByKey("users", userId);
    if (!existingUser) {
        await addItem("users", {
            userId,
            username: "demoUser",
            email: `demo${userId}@user.com`,
            password: "password",
            role: "customer",
            isApproved: true,
            avgRating: 4.5,
            ratingCount: 10,
            reviewCount: 5,
            paymentPreference: "credit_card",
            verificationFile: null
        });
    }

    // await addItem("cars", {
    //     carId,
    //     carName: "Kia Sorento 2022",
    //     carType: "automatic",
    //     categoryId: "5731939043",
    //     categoryName: "SUV",
    //     city: "Noida",
    //     createdAt: new Date().toISOString(),
    //     description: "A family-friendly SUV with ample space and comfort.",
    //     featured: ["Automatic", "7 Seats", "Third Row"],
    //     images: [
    //         'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD…EREBERAREQEREBERAREQEREBERAREQEREBERAREQEREH/2Q==',
    //         'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD…BERAREQEREBERAREQEREBERAREQEREBERAREQEREBERB//9k=',
    //         'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD…RAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQf//Z'
    //     ],
    //     ownerId,
    //     ownerName: "Olivia",
    //     basePrice: 75,
    //     avgRating: 4.4,
    //     ratingCount: 21,
    //     availibility: "unavailable"
    // });

    for (let i = 1; i <= 5; i++) {
        await addItem("bookings", {
            bookingId: generateRandomId(),
            carId,
            carName: "Kia Sorento 2022",
            createdAt: new Date(Date.now() - i * 86400000).toISOString(),
            from: new Date(Date.now() - i * 86400000).toISOString(),
            to: new Date(Date.now() - (i - 1) * 86400000).toISOString(),
            bid: generateRandomId(),
            bidPrice: 75 + i * 5,
            isValid: true,
            ownerId,
            ownerName: "Olivia",
            userId,
            username: "demoUser"
        });
    }

    for (let i = 1; i <= 5; i++) {
        await addItem("bids", {
            bidId: generateRandomId(),
            carId,
            carName: "Kia Sorento 2022",
            createdAt: new Date(Date.now() - i * 86400000).toISOString(),
            from: new Date(Date.now() - i * 86400000).toISOString(),
            to: new Date(Date.now() - (i - 1) * 86400000).toISOString(),
            bidAmount: 75 + i * 5,
            ownerId,
            ownerName: "Olivia",
            status: i % 2 === 0 ? "Accepted" : "Rejected",
            userId,
            username: "demoUser"
        });
    }

    console.log("Demo data injected successfully!");
}

injectDemoData();