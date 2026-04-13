import React from "react";
import Link from "next/link";

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
}

interface Technology {
  title: string;
  description: string;
  icon: string;
}

interface Reason {
  title: string;
  description: string;
  icon: string;
}

interface Testimonial {
  quote: string;
  author: string;
}

interface Stat {
  number: string;
  label: string;
}

const teamMembers: TeamMember[] = [
  { name: "Phu", role: "Lead Designer", description: "Phu crafts intuitive, visually stunning interfaces, ensuring every interaction feels effortless and delightful.", image: "https://avatars.githubusercontent.com/u/123137268?s=400&u=fd7655d243b91e49e442779e3676ca267b561bc4&v=4" },
  { name: "Hieu", role: "Software Engineer", description: "Hieu develops the core software that powers our smart home solutions.", image: "https://avatars.githubusercontent.com/u/152246636?v=4" },
  { name: "Khoa", role: "Product Manager", description: "Khoa leads the product development, ensuring our solutions meet user needs.", image: "https://avatars.githubusercontent.com/u/126898951?v=4" },
  { name: "Binh", role: "UX Designer", description: "Binh focuses on creating user-friendly experiences for our smart home dashboard.", image: "https://avatars.githubusercontent.com/u/152246636?v=4" },
  { name: "Khoi", role: "Hardware Engineer", description: "Khoi designs and integrates the hardware components of our smart home system.", image: "https://avatars.githubusercontent.com/u/167783879?v=4" },
];

const technologies: Technology[] = [
  { title: "Smart Hub", description: "The central brain connecting all your devices for seamless control and monitoring.", icon: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png" },
  { title: "Advanced Sensors", description: "Real-time tracking of temperature, humidity, and motion to keep your home optimized.", icon: "https://cdn-icons-png.flaticon.com/512/2936/2936884.png" },
  { title: "AI Integration", description: "Learns your habits and adjusts your home settings automatically for maximum comfort.", icon: "https://cdn-icons-png.flaticon.com/512/4712/4712035.png" },
];

const whyChooseUs: Reason[] = [
  { title: "Effortless Control", description: "Manage your home with an interface anyone can use.", icon: "https://cdn-icons-png.flaticon.com/512/1828/1828919.png" },
  { title: "Cutting-Edge Tech", description: "Stay ahead with AI, real-time alerts, and smart integrations.", icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" },
  { title: "24/7 Support", description: "Our team is here around the clock to assist you.", icon: "https://cdn-icons-png.flaticon.com/512/1828/1828970.png" },
];

const testimonials: Testimonial[] = [
  { quote: "This system transformed my home into a smart sanctuary. So easy to use!", author: "Phu" },
  { quote: "The real-time alerts give me peace of mind wherever I am.", author: "Maria" },
  { quote: "Top-notch support and innovative features. Highly recommend!", author: "James" },
];

const stats: Stat[] = [
  { number: "10,000+", label: "Homes Connected" },
  { number: "50+", label: "Countries Served" },
  { number: "99%", label: "Customer Satisfaction" },
];

const TeamCard: React.FC<TeamMember> = ({ name, role, description, image }) => (
  <div className="bg-white p-6 rounded-lg shadow text-center">
    <img src={image} alt={`${name} Avatar`} className="mx-auto mb-4 rounded-full w-24 h-24" />
    <h3 className="text-purple-600 text-xl font-bold mb-1">{name}</h3>
    <p className="text-gray-500 mb-2">{role}</p>
    <p className="text-gray-700 text-sm">{description}</p>
  </div>
);

const TechCard: React.FC<Technology> = ({ title, description, icon }) => (
  <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
    <img src={icon} alt={`${title} Icon`} className="w-12 h-12" />
    <div>
      <h3 className="text-purple-600 font-semibold">{title}</h3>
      <p className="text-gray-700 text-sm">{description}</p>
    </div>
  </div>
);

const WhyCard: React.FC<Reason> = ({ title, description, icon }) => (
  <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow">
    <img src={icon} alt={`${title} Icon`} className="w-10 h-10" />
    <p className="text-gray-700"><strong>{title}</strong>: {description}</p>
  </div>
);

const TestimonialCard: React.FC<Testimonial> = ({ quote, author }) => (
  <div className="bg-white p-6 rounded-lg border-purple-600 border-2 text-center">
    <p className="italic text-gray-600 mb-3">"{quote}"</p>
    <p className="text-purple-600 font-semibold">– {author}</p>
  </div>
);

const StatItem: React.FC<Stat> = ({ number, label }) => (
  <div className="text-center">
    <h3 className="text-3xl text-purple-600 font-bold">{number}</h3>
    <p className="text-gray-700">{label}</p>
  </div>
);

const AboutPage: React.FC = () => (
  <div className="min-h-screen bg-gray-100 font-poppins">
    {/* Header */}
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
      {/* Hero */}
      <section className="bg-gradient-to-b from-purple-50 to-white p-12 rounded-lg text-center">
        <h1 className="text-4xl font-bold text-purple-600 mb-4">Welcome to Smart Home System</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">Transform your living space with a smart home solution that's intuitive, innovative, and designed for you. Control lighting, temperature, security, and more—all from a single, user-friendly dashboard.</p>
        <img src="/img/smarthome001.png" alt="Smart Home Illustration" className="mt-6 mx-auto rounded-lg" />
      </section>

      {/* Team */}
      <section>
        <h2 className="text-center text-3xl font-bold text-purple-600 mb-8">Meet Our Team</h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
          {teamMembers.map((member, idx) => <TeamCard key={idx} {...member} />)}
        </div>
      </section>

      {/* Technology */}
      <section>
        <h2 className="text-center text-3xl font-bold text-purple-600 mb-8">Our Technology</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {technologies.map((tech, idx) => <TechCard key={idx} {...tech} />)}
        </div>
      </section>

      {/* Why Choose Us */}
      <section>
        <h2 className="text-center text-3xl font-bold text-purple-600 mb-8">Why Choose Us?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {whyChooseUs.map((reason, idx) => <WhyCard key={idx} {...reason} />)}
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <h2 className="text-center text-3xl font-bold text-purple-600 mb-8">What Our Users Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => <TestimonialCard key={idx} {...test} />)}
        </div>
      </section>

      {/* Stats */}
      <section>
        <h2 className="text-center text-3xl font-bold text-purple-600 mb-8">Our Impact</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, idx) => <StatItem key={idx} {...stat} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-purple-600 mb-4">Ready to Make Your Home Smarter?</h2>
        <p className="text-gray-700 mb-6">Join thousands of satisfied users and experience the future of living today.</p>
        <Link href="/login" className="inline-block bg-purple-600 text-white py-3 px-8 rounded-lg hover:bg-purple-700 transition">Get Started Now</Link>
      </section>
    </main>

    {/* Footer */}
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

export default AboutPage;
