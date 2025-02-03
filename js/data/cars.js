const cars = [
  {
    carId: "car001",
    ownerId: "user001",
    ownerName: "John Doe",
    carName: "Toyota Corolla 2023",
    categoryName: "Sedan",
    categoryId: "cat001",
    supercategoryId: "supercat001",
    basePrice: 50,
    highestBidPrice: 60,
    description: "A reliable and fuel-efficient sedan perfect for city driving.",
    availability: "Available",
    images: ["../assets/images/1.png", "../assets/images/2.jpeg", "../assets/images/3.jpeg"],
    city: "New York, NY",
    avgRating: 4.2,
    reviewCount: 120,
    createdAt: new Date("2023-01-15"),
    featured: ["Automatic", "4 Seats", "AC"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car002",
    ownerId: "user002",
    ownerName: "Jane Smith",
    carName: "Honda Civic 2022",
    categoryName: "Sedan",
    categoryId: "cat001",
    supercategoryId: "supercat001",
    basePrice: 45,
    highestBidPrice: 55,
    description: "A stylish and comfortable sedan with great mileage.",
    availability: "Available",
    images: ["../assets/images/4.jpeg", "../assets/images/5.jpeg", "../assets/images/6.jpeg"],
    city: "Los Angeles, CA",
    avgRating: 4.5,
    reviewCount: 95,
    createdAt: new Date("2023-02-10"),
    featured: ["Automatic", "5 Seats", "Bluetooth"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car003",
    ownerId: "user003",
    ownerName: "Mike Johnson",
    carName: "Ford Mustang 2021",
    categoryName: "Sports Car",
    categoryId: "cat002",
    supercategoryId: "supercat002",
    basePrice: 120,
    highestBidPrice: 140,
    description: "A powerful and iconic sports car for thrill-seekers.",
    availability: "Available",
    images: ["../assets/images/7.jpeg", "../assets/images/8.jpeg", "../assets/images/9.jpeg"],
    city: "Chicago, IL",
    avgRating: 4.8,
    reviewCount: 200,
    createdAt: new Date("2023-03-05"),
    featured: ["Manual", "2 Seats", "Turbo"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car004",
    ownerId: "user004",
    ownerName: "Emily Brown",
    carName: "Tesla Model 3 2023",
    categoryName: "Electric",
    categoryId: "cat003",
    supercategoryId: "supercat003",
    basePrice: 90,
    highestBidPrice: 100,
    description: "A sleek and eco-friendly electric car with autopilot.",
    availability: "Available",
    images: ["../assets/images/10.jpeg", "../assets/images/11.jpeg", "../assets/images/12.jpeg"],
    city: "San Francisco, CA",
    avgRating: 4.9,
    reviewCount: 300,
    createdAt: new Date("2023-04-20"),
    featured: ["Automatic", "5 Seats", "Autopilot"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car005",
    ownerId: "user005",
    ownerName: "David Wilson",
    carName: "Chevrolet Tahoe 2022",
    categoryName: "SUV",
    categoryId: "cat004",
    supercategoryId: "supercat004",
    basePrice: 80,
    highestBidPrice: 90,
    description: "A spacious and rugged SUV for family trips.",
    availability: "Available",
    images: ["../assets/images/13.jpeg", "../assets/images/14.jpeg", "../assets/images/15.jpeg"],
    city: "Houston, TX",
    avgRating: 4.3,
    reviewCount: 150,
    createdAt: new Date("2023-05-12"),
    featured: ["Automatic", "7 Seats", "4WD"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car006",
    ownerId: "user006",
    ownerName: "Sarah Lee",
    carName: "BMW X5 2023",
    categoryName: "Luxury SUV",
    categoryId: "cat005",
    supercategoryId: "supercat005",
    basePrice: 150,
    highestBidPrice: 170,
    description: "A luxurious and high-performance SUV with advanced features.",
    availability: "Available",
    images: ["../assets/images/16.jpeg", "../assets/images/17.jpeg", "../assets/images/18.jpeg"],
    city: "Miami, FL",
    avgRating: 4.7,
    reviewCount: 180,
    createdAt: new Date("2023-06-18"),
    featured: ["Automatic", "5 Seats", "Leather Seats"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car007",
    ownerId: "user007",
    ownerName: "Chris Evans",
    carName: "Audi A4 2022",
    categoryName: "Luxury Sedan",
    categoryId: "cat006",
    supercategoryId: "supercat006",
    basePrice: 70,
    highestBidPrice: 80,
    description: "A premium sedan with cutting-edge technology.",
    availability: "Available",
    images: ["../assets/images/19.jpeg", "../assets/images/20.jpeg", "../assets/images/21.jpeg"],
    city: "Seattle, WA",
    avgRating: 4.6,
    reviewCount: 130,
    createdAt: new Date("2023-07-22"),
    featured: ["Automatic", "5 Seats", "Sunroof"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car008",
    ownerId: "user008",
    ownerName: "Laura Taylor",
    carName: "Jeep Wrangler 2023",
    categoryName: "Off-Road",
    categoryId: "cat007",
    supercategoryId: "supercat007",
    basePrice: 100,
    highestBidPrice: 110,
    description: "A rugged and versatile off-road vehicle for adventurers.",
    availability: "Available",
    images: ["../assets/images/22.jpeg", "../assets/images/23.jpeg", "../assets/images/24.jpeg"],
    city: "Denver, CO",
    avgRating: 4.4,
    reviewCount: 110,
    createdAt: new Date("2023-08-30"),
    featured: ["Manual", "4 Seats", "4WD"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car009",
    ownerId: "user009",
    ownerName: "Daniel Harris",
    carName: "Hyundai Sonata 2023",
    categoryName: "Sedan",
    categoryId: "cat001",
    supercategoryId: "supercat001",
    basePrice: 55,
    highestBidPrice: 65,
    description: "A modern and affordable sedan with great features.",
    availability: "Available",
    images: ["../assets/images/25.jpeg", "../assets/images/26.jpeg", "../assets/images/27.jpeg"],
    city: "Atlanta, GA",
    avgRating: 4.1,
    reviewCount: 90,
    createdAt: new Date("2023-09-14"),
    featured: ["Automatic", "5 Seats", "Heated Seats"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car010",
    ownerId: "user010",
    ownerName: "Olivia Martinez",
    carName: "Kia Sorento 2022",
    categoryName: "SUV",
    categoryId: "cat004",
    supercategoryId: "supercat004",
    basePrice: 75,
    highestBidPrice: 85,
    description: "A family-friendly SUV with ample space and comfort.",
    availability: "Available",
    images: ["../assets/images/28.jpeg", "../assets/images/29.jpeg", "../assets/images/30.jpeg"],
    city: "Dallas, TX",
    avgRating: 4.0,
    reviewCount: 100,
    createdAt: new Date("2023-10-05"),
    featured: ["Automatic", "7 Seats", "Third Row"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car011",
    ownerId: "user011",
    ownerName: "Michael Clark",
    carName: "Subaru Outback 2023",
    categoryName: "Wagon",
    categoryId: "cat008",
    supercategoryId: "supercat008",
    basePrice: 65,
    highestBidPrice: 75,
    description: "A versatile and reliable wagon for all terrains.",
    availability: "Available",
    images: ["../assets/images/31.jpeg", "../assets/images/32.jpeg", "../assets/images/33.jpeg"],
    city: "Portland, OR",
    avgRating: 4.2,
    reviewCount: 85,
    createdAt: new Date("2023-11-10"),
    featured: ["Automatic", "5 Seats", "AWD"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car012",
    ownerId: "user012",
    ownerName: "Sophia Rodriguez",
    carName: "Volkswagen Golf 2022",
    categoryName: "Hatchback",
    categoryId: "cat009",
    supercategoryId: "supercat009",
    basePrice: 40,
    highestBidPrice: 50,
    description: "A compact and efficient hatchback for city driving.",
    availability: "Available",
    images: ["../assets/images/34.jpeg", "../assets/images/35.jpeg", "../assets/images/36.jpeg"],
    city: "Boston, MA",
    avgRating: 4.3,
    reviewCount: 95,
    createdAt: new Date("2023-12-01"),
    featured: ["Manual", "5 Seats", "Compact"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car013",
    ownerId: "user013",
    ownerName: "James White",
    carName: "Porsche 911 2023",
    categoryName: "Sports Car",
    categoryId: "cat002",
    supercategoryId: "supercat002",
    basePrice: 200,
    highestBidPrice: 220,
    description: "A high-performance sports car for enthusiasts.",
    availability: "Available",
    images: ["../assets/images/37.jpeg", "../assets/images/38.jpeg", "../assets/images/39.jpeg"],
    city: "Las Vegas, NV",
    avgRating: 4.9,
    reviewCount: 250,
    createdAt: new Date("2024-01-15"),
    featured: ["Automatic", "2 Seats", "Turbo"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car014",
    ownerId: "user014",
    ownerName: "Emma Garcia",
    carName: "Lexus RX 2023",
    categoryName: "Luxury SUV",
    categoryId: "cat005",
    supercategoryId: "supercat005",
    basePrice: 130,
    highestBidPrice: 140,
    description: "A luxurious and comfortable SUV with premium features.",
    availability: "Available",
    images: ["../assets/images/40.jpeg", "../assets/images/41.jpeg", "../assets/images/42.jpeg"],
    city: "Phoenix, AZ",
    avgRating: 4.7,
    reviewCount: 160,
    createdAt: new Date("2024-02-20"),
    featured: ["Automatic", "5 Seats", "Panoramic Roof"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  },
  {
    carId: "car015",
    ownerId: "user015",
    ownerName: "William Brown",
    carName: "Nissan Altima 2023",
    categoryName: "Sedan",
    categoryId: "cat001",
    supercategoryId: "supercat001",
    basePrice: 60,
    highestBidPrice: 70,
    description: "A stylish and efficient sedan for everyday use.",
    availability: "Available",
    images: ["../assets/images/43.jpeg", "../assets/images/44.jpeg", "../assets/images/45.jpeg"],
    city: "Philadelphia, PA",
    avgRating: 4.0,
    reviewCount: 80,
    createdAt: new Date("2024-03-25"),
    featured: ["Automatic", "5 Seats", "Blind Spot Monitor"],
    carType: Math.random() > 0.5 ? "Automatic" : "Manual"
  }
];

function generateStarRating(avgRating) {
  const fullStars = Math.floor(avgRating);
  const halfStar = avgRating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  return (
    "★".repeat(fullStars) +
    "⯨".repeat(halfStar) +
    "☆".repeat(emptyStars)
  );
}

function createCarCard(car) {
  const card = document.createElement("div");
  card.className = "car-card";
  const carousel = `
        <div class="carousel">
            <div class="carousel-images">
                ${car.images
      .map(
        (image, index) =>
          `<img src="${image}" alt="Car Image ${index + 1}" class="carousel-image ${index === 0 ? "active" : ""}">`
      )
      .join("")}
            </div>
            <button class="carousel-button prev" onclick="prevImage(this)">&#10094;</button>
            <button class="carousel-button next" onclick="nextImage(this)">&#10095;</button>
        </div>
    `;

  const carDetails = `
        <div class="car-details">
            <h3 class="car-name">${car.carName}</h3>
            <div class="car-features">
                ${car.featured.map((feature) => `<span class="feature">${feature}</span>`).join("")}
            </div>
            <div class="car-rating">
                <span class="stars">${generateStarRating(car.avgRating)}</span>
                <span class="rating-count">(${car.avgRating.toFixed(1)}/5, ${car.reviewCount} reviews)</span>
            </div>
            <div class="user-info">
                <svg class="user-icon" viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span class="user-name">${car.ownerName}</span>
            </div>
            <div class="car-price-city">
                <span class="price">$${car.basePrice}/day</span>
                <span class="city">${car.city}</span>
            </div>
        </div>
    `;
  card.innerHTML = carousel + carDetails;
  return card;
}

function renderCars() {
  const carsContainer = document.getElementById("cars-container");
  carsContainer.innerHTML = "";
  cars.forEach((car) => {
    const card = createCarCard(car);
    carsContainer.appendChild(card);
  });
}

function prevImage(button) {
  const carousel = button.parentElement;
  const images = carousel.querySelectorAll(".carousel-image");
  let activeIndex = Array.from(images).findIndex((img) =>
    img.classList.contains("active")
  );
  images[activeIndex].classList.remove("active");
  activeIndex = (activeIndex - 1 + images.length) % images.length;
  images[activeIndex].classList.add("active");
}

function nextImage(button) {
  const carousel = button.parentElement;
  const images = carousel.querySelectorAll(".carousel-image");
  let activeIndex = Array.from(images).findIndex((img) =>
    img.classList.contains("active")
  );

  images[activeIndex].classList.remove("active");
  activeIndex = (activeIndex + 1) % images.length;
  images[activeIndex].classList.add("active");
}

document.addEventListener("DOMContentLoaded", renderCars);