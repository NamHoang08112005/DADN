import React from "react";
import Link from "next/link";

const AboutPage: React.FC = () => (
  <div className="min-h-screen bg-[#efeff2] font-poppins">
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between px-6 py-5 md:px-10">
        <div className="text-2xl font-bold leading-none text-purple-600 md:text-4xl">Smart Home System</div>
        <nav>
          <ul className="flex items-center gap-6 text-base font-medium text-gray-700 md:gap-8 md:text-xl">
            <li>
              <Link href="/" className="hover:text-purple-600">
                Home
              </Link>
            </li>
            <li>
              <Link href="/features" className="hover:text-purple-600">
                Features
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-purple-600">
                Support
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-purple-600">
                Login
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main className="px-5 py-8 md:px-8 md:py-10">
      <section className="mx-auto rounded-xl bg-[#f4eff8] px-5 py-10 text-center md:px-8 md:py-12">
        <h1 className="mb-5 text-3xl font-extrabold text-purple-600 md:text-5xl">
          Welcome to Smart Home System
        </h1>
        <p className="mx-auto max-w-[900px] text-base leading-relaxed text-gray-600 md:text-2xl">
          Transform your living space with a smart home solution that&apos;s intuitive,
          innovative, and designed for you. Control lighting, temperature, security,
          and more-all from a single, user-friendly dashboard.
        </p>
        <img
          src="/img/smarthome001.png"
          alt="Smart Home Illustration"
          className="mx-auto mt-7 w-full max-w-[500px] rounded-lg"
        />
      </section>
    </main>
  </div>
);

export default AboutPage;
