"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // your Navbar component

export default function FieldInput() {
  const [step, setStep] = useState("form");
  const [formData, setFormData] = useState<{
    name: string;
    aadhaar: string;
    phone: string;
    email: string;
    farmLocation: string;
    farmSize: string;
    cropType: string;
    damageDescription: string;
    dateFrom: string;
    dateTo: string;
    rainfallRange: string;
    declaration: boolean;
    images: File[];
  }>({
    name: "",
    aadhaar: "",
    phone: "",
    email: "",
    farmLocation: "",
    farmSize: "",
    cropType: "",
    damageDescription: "",
    dateFrom: "",
    dateTo: "",
    rainfallRange: "",
    declaration: false,
    images: [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;

    // Convert kebab-case (farm-location) → camelCase (farmLocation)
    const camelCaseKey = id.replace(/-([a-z])/g, (_, char) =>
      char.toUpperCase()
    );

    setFormData({
      ...formData,
      [camelCaseKey]: value,
    });
  };

  const handleFileUpload = (files: File[]) => {
    setFormData({ ...formData, images: files });
  };

  const handleToggle = () => {
    setFormData({ ...formData, declaration: !formData.declaration });
  };

  const handleProceed = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to submit this claim?"
    );
    if (!confirmed) return;

    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "images" && Array.isArray(value)) {
        value.forEach((file) => data.append("files", file)); // ✅ Safe
      } else if (typeof value === "boolean") {
        data.append(key, value ? "true" : "false"); // ✅ Convert boolean to string
      } else if (typeof value === "string") {
        data.append(key, value); // ✅ Regular text fields
      }
    });

    try {
      console.log("Submitting form data:", formData);
      const res = await fetch("http://127.0.0.1:8000/api/claims", {
        method: "POST",
        body: data, // No headers! FormData handles it automatically
      });

      if (res.ok) {
        const result = await res.json();
        alert(`✅ Claim submitted successfully!\nClaim ID: ${result.claim_id}`);
        console.log(result); // optional: see PDF URL, etc.
      } else {
        alert("❌ Failed to submit claim. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Network error. Please try again later.");
    }
  };

  const handleConfirm = () => {
    console.log("Submitting form:", formData);
    // TODO: Send data to backend here
  };

  return (
    <div className="">
      <Navbar />

      {step === "form" && (
        <FieldSet className=" py-5 flex flex-row w-full h-screen">
          {/* LEFT SIDE */}
          <FieldGroup className="min-w-[50%] px-5 overflow-y-auto pr-4 space-y-4">
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Ravi Kumar"
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="aadhaar">Aadhaar Number</FieldLabel>
              <Input
                id="aadhaar"
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="ravi@example.com"
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="farm-location">Farm Location</FieldLabel>
              <Input
                id="farm-location"
                placeholder="28.6139, 77.2090"
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="farm-size">
                Farm Area (acres/hectares)
              </FieldLabel>
              <Input id="farm-size" placeholder="2.5" onChange={handleChange} />
            </Field>

            <Field>
              <FieldLabel htmlFor="crop-type">Crop Type</FieldLabel>
              <Input
                id="crop-type"
                placeholder="Wheat"
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="damage-description">
                Damage Description
              </FieldLabel>
              <textarea
                id="damage-description"
                placeholder="Describe the damage..."
                className="w-full p-2 border rounded"
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="date-from">
                Date of Incident (Start)
              </FieldLabel>
              <Input id="date-from" type="date" onChange={handleChange} />
            </Field>

            <Field>
              <FieldLabel htmlFor="date-to">Date of Incident (End)</FieldLabel>
              <Input id="date-to" type="date" onChange={handleChange} />
            </Field>

            <Field>
              <FieldLabel htmlFor="rainfall-range">
                Rainfall Duration (Days)
              </FieldLabel>
              <Input
                id="rainfall-range"
                type="number"
                onChange={handleChange}
              />
            </Field>
          </FieldGroup>

          {/* RIGHT SIDE */}
          <FieldGroup className="min-w-[40%] px-5">
            <div>
              <Field>
                <FieldLabel>Upload Images or Proof</FieldLabel>
                <FileUpload onChange={handleFileUpload} />
              </Field>

              <div className="flex items-center mt-4">
                <Switch
                  id="declaration"
                  checked={formData.declaration}
                  onCheckedChange={handleToggle}
                />
                <Label htmlFor="declaration" className="ml-2">
                  I confirm all information is accurate.
                </Label>
              </div>
            </div>

            <Button
              onClick={handleProceed}
              variant="default"
              className="w-min bg-green-400 hover:bg-green-500 self-end mt-8"
            >
              Proceed
            </Button>
          </FieldGroup>
        </FieldSet>
      )}
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
    <nav className="flex w-screen top-0 left-0 items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
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
