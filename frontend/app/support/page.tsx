import React from "react";
import Link from "next/link";

const team = [
    { name: "Trần Minh Hiếu", id: "2252216", role: "Leader", avatar: "https://ui-avatars.com/api/?name=Trần+Minh+Hiếu&background=8b5cf6&color=fff&size=128" },
    { name: "Nguyễn Nhật Khôi", id: "2252379", role: "Member", avatar: "https://ui-avatars.com/api/?name=Nguyễn+Nhật+Khôi&background=8b5cf6&color=fff&size=128" },
    { name: "Nguyễn Anh Khoa", id: "2252352", role: "Member", avatar: "https://ui-avatars.com/api/?name=Nguyễn+Anh+Khoa&background=8b5cf6&color=fff&size=128" },
    { name: "Nguyễn Quang Phú", id: "2252621", role: "Member", avatar: "https://ui-avatars.com/api/?name=Nguyễn+Quang+Phú&background=8b5cf6&color=fff&size=128" },
    { name: "Hà Thế Bình", id: "2152435", role: "Member", avatar: "https://ui-avatars.com/api/?name=Hà+Thế+Bình&background=8b5cf6&color=fff&size=128" },
];

const SupportPage = () => (
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
            <section className="flex flex-col items-center">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full mb-12 flex flex-col items-center">
                    <img src="https://cdn-icons-png.flaticon.com/512/1828/1828970.png" alt="Support Icon" className="w-20 h-20 mb-4" />
                    <h1 className="text-4xl font-bold text-purple-600 mb-2">Support & Contact</h1>
                    <p className="text-gray-600 mb-6 text-center">Need help or want to contribute? Reach out to our team! We're here to support you with any questions about Yolo:Home, smart home technology, or project collaboration.</p>
                    <div className="w-full bg-white rounded-lg p-4 mb-2 border border-purple-100 shadow">
                        <h2 className="text-lg font-bold text-purple-600 mb-2">Contact Information</h2>
                        <div className="flex flex-col gap-1">
                            <span><span className="font-semibold text-gray-800">Email:</span> <a href="mailto:phu.nguyenquang2004@hcmut.edu.vn" className="text-purple-600 underline">phu.nguyenquang2004@hcmut.edu.vn</a></span>
                            <span><span className="font-semibold text-gray-800">GitHub:</span> <a href="https://github.com/pdz1804/" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">https://github.com/pdz1804/</a></span>
                        </div>
                    </div>
                </div>
                <div className="w-full">
                    <h2 className="text-2xl font-bold text-purple-600 mb-6 text-center">Meet the Team</h2>
                    <div className="grid md:grid-cols-3 gap-8 justify-center">
                        {team.map((member, idx) => (
                            <div key={idx} className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                                <img src={member.avatar} alt={member.name + ' avatar'} className="w-20 h-20 rounded-full mb-3 border-4 border-purple-200" />
                                <div className="text-lg font-semibold text-purple-700 mb-1">{member.name}</div>
                                <div className="text-gray-500 mb-1">{member.role}</div>
                                <div className="text-gray-400 text-sm">ID: {member.id}</div>
                            </div>
                        ))}
                    </div>
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

export default SupportPage; 