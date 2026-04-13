import React from "react";
import Link from "next/link";

const features = [
    {
        title: "Environmental Monitoring & Automation",
        description: "Monitor temperature, humidity, and more. Devices respond automatically for optimal comfort.",
        icon: "https://cdn-icons-png.flaticon.com/512/2917/2917995.png"
    },
    {
        title: "Voice Recognition",
        description: "Control your home hands-free with advanced voice commands.",
        icon: "https://cdn-icons-png.flaticon.com/512/3602/3602123.png"
    },
    {
        title: "Facial Recognition",
        description: "Personalized access control using AI-powered facial recognition.",
        icon: "https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
    },
    {
        title: "Fire Detection",
        description: "Real-time fire and hazard detection using computer vision.",
        icon: "https://cdn-icons-png.flaticon.com/512/482/482138.png"
    },
    {
        title: "Web Dashboard",
        description: "Monitor and control your smart home from anywhere via a dedicated web app.",
        icon: "https://cdn-icons-png.flaticon.com/512/1828/1828859.png"
    }
];

const useCases = [
    {
        id: "UC001",
        name: "Smart Door with Face Recognition and Password",
        description: "The user authenticates with the system to open the door.",
        icon: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png"
    },
    {
        id: "UC002",
        name: "Voice-Controlled Fan System",
        description: "The user uses the voice to control the fan.",
        icon: "https://cdn-icons-png.flaticon.com/512/3602/3602123.png"
    },
    {
        id: "UC003",
        name: "Auto Light Control with Sensor",
        description: "The light would be toggled by the state of the sensor.",
        icon: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png"
    },
    {
        id: "UC004",
        name: "Monitoring Air Quality",
        description: "The air quality would be displayed for monitoring.",
        icon: "https://cdn-icons-png.flaticon.com/512/2936/2936884.png"
    },
    {
        id: "UC005",
        name: "Monitoring Sensors by Application",
        description: "The user can monitor and display the information of the sensors through the team application.",
        icon: "https://cdn-icons-png.flaticon.com/512/1828/1828859.png"
    },
    {
        id: "UC006",
        name: "Controlling Sensors by Application",
        description: "The user can control the sensors through the team application.",
        icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
    },
    {
        id: "UC007",
        name: "Fire Detection",
        description: "The system detects fire and announces to the user.",
        icon: "https://cdn-icons-png.flaticon.com/512/482/482138.png"
    }
];

const FeaturesPage = () => (
    <div className="min-h-screen bg-gray-100 font-poppins">
        <header className="bg-white shadow sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center p-6">
                <div className="text-2xl font-bold text-purple-600">Smart Home System</div>
                <nav>
                    <ul className="flex gap-8">
                        <li><Link href="/" className="text-gray-800 hover:text-purple-600 font-medium">Home</Link></li>
                        <li><Link href="/features" className="text-gray-800 hover:text-purple-600 font-medium">Features</Link></li>
                        <li><Link href="/about" className="text-gray-800 hover:text-purple-600 font-medium">About Us</Link></li>
                        <li><Link href="/support" className="text-gray-800 hover:text-purple-600 font-medium">Support</Link></li>
                    </ul>
                </nav>
            </div>
        </header>
        <main className="container mx-auto p-8 space-y-16">
            <section className="text-center">
                <h1 className="text-4xl font-bold text-purple-600 mb-4">Key Features</h1>
                <p className="text-gray-600 max-w-2xl mx-auto mb-8">Yolo:Home brings together AI, IoT, and automation for a truly smart living experience. Explore our platform's standout features below.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-lg shadow text-center flex flex-col items-center">
                            <img src={feature.icon} alt={feature.title + ' icon'} className="w-16 h-16 mb-4" />
                            <h3 className="text-xl font-bold text-purple-600 mb-2">{feature.title}</h3>
                            <p className="text-gray-700">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>
            <section className="text-center">
                <h2 className="text-3xl font-bold text-purple-600 mb-4">Use Cases</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow mb-8">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b text-purple-600">ID</th>
                                <th className="py-2 px-4 border-b text-purple-600">Use-case Name</th>
                                <th className="py-2 px-4 border-b text-purple-600">Description</th>
                                <th className="py-2 px-4 border-b text-purple-600">Icon</th>
                            </tr>
                        </thead>
                        <tbody>
                            {useCases.map((uc, idx) => (
                                <tr key={idx} className="text-gray-700">
                                    <td className="py-2 px-4 border-b font-mono">{uc.id}</td>
                                    <td className="py-2 px-4 border-b font-semibold">{uc.name}</td>
                                    <td className="py-2 px-4 border-b">{uc.description}</td>
                                    <td className="py-2 px-4 border-b"><img src={uc.icon} alt={uc.name + ' icon'} className="w-8 h-8 mx-auto" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
        <footer className="bg-purple-600 text-white text-center py-8">
            <p>© 2025 Smart Home System. All rights reserved.</p>
            <p className="mt-2">
                <Link href="/privacy" className="underline">Privacy Policy</Link> |
                <Link href="/terms" className="underline">Terms of Service</Link> |
                <Link href="/contact" className="underline">Contact Us</Link>
            </p>
        </footer>
    </div>
);

export default FeaturesPage; 