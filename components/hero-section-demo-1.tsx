"use client";

import { motion } from "motion/react";
import { InfiniteMovingCards } from "./ui/infinite-moving-cards";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSectionOne() {
  const router = useRouter();

  return (
    <div className="relative flex  flex-col items-center justify-center">
      <Navbar />
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="px-4 py-10 md:py-20 ">
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-green-600 md:text-4xl lg:text-7xl dark:text-slate-300">
          {"Smart Insurance Claims for Every Farmer"
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>
        <div className="mb-8">
          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
              delay: 0.8,
            }}
            className="relative z-10 mx-auto max-w-3xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400"
          >
            AgriSat makes it easy for farmers to report crop damage and get
            their insurance claims processed faster. Farmers can upload field
            photos, confirm their location, and quickly get a verified report to
            share with insurers
          </motion.p>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
              delay: 1,
            }}
            className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => router.push("/FormPage")}
              className="w-60 transform rounded-lg bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Create Report
            </button>
            <button className="w-60 transform rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900">
              Learn More
            </button>
          </motion.div>
        </div>

        <InfiniteMovingCards
          speed="slow"
          items={[
            {
              quote:
                "FarmSure made the whole insurance claim process smooth and fast. I submitted my photos and got confirmation the same day!",
              name: "Ravi Kumar",
              title: "Wheat Farmer, Punjab",
            },
            {
              quote:
                "It used to take me weeks to get verification from insurance agents. Now it’s just a few clicks with FarmSure!",
              name: "Sita Devi",
              title: "Rice Farmer, Bihar",
            },
            {
              quote:
                "The satellite image and weather data features are amazing. My claim was approved without any confusion.",
              name: "Anil Patil",
              title: "Sugarcane Farmer, Maharashtra",
            },
            {
              quote:
                "I loved how FarmSure automatically filled my location and verified rainfall data. Very farmer-friendly app!",
              name: "Kavita Reddy",
              title: "Cotton Grower, Telangana",
            },
            {
              quote:
                "Uploading images and generating the claim report was super easy. The interface is clean and fast.",
              name: "Mohan Singh",
              title: "Maize Farmer, Haryana",
            },
            {
              quote:
                "With FarmSure, I didn’t have to visit any office. Everything was done from my phone and verified online.",
              name: "Rajesh Sharma",
              title: "Mustard Farmer, Rajasthan",
            },
            {
              quote:
                "The app automatically checked the weather and matched it with my damage report. It felt very transparent.",
              name: "Lakshmi Nair",
              title: "Paddy Farmer, Kerala",
            },
            {
              quote:
                "Earlier, I faced issues proving drought damage. FarmSure’s report made my claim approval much easier.",
              name: "Manoj Gupta",
              title: "Soybean Farmer, Madhya Pradesh",
            },
            {
              quote:
                "Simple design, clear instructions, and fast results. Every farmer should have access to tools like this.",
              name: "Neha Verma",
              title: "Horticulture Farmer, Uttar Pradesh",
            },
            {
              quote:
                "This platform saved me time and travel costs. The digital proof PDF looked professional and was accepted instantly.",
              name: "Dinesh Yadav",
              title: "Groundnut Farmer, Gujarat",
            },
          ]}
        />
      </div>
    </div>
  );
}

const Navbar = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    setIsDark(!isDark);
  };

  return (
    <nav className="flex w-screen items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-bold md:text-2xl">🌽</h1>
        <h1 className="text-base font-bold md:text-2xl">AgriSat</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="w-24 transform rounded-lg bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-32 dark:bg-white dark:text-black dark:hover:bg-gray-200">
          Home
        </button>

        {/* 🌗 Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          title="Toggle dark mode"
        >
          {isDark ? "🌞" : "🌙"}
        </button>
      </div>
    </nav>
  );
};
