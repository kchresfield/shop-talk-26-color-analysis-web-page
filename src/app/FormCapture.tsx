/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from 'react';
import { fetchDropdownOptionsFromSupabase } from './fetchDropdownOptions';

const BUTTONS = [
    "Spring",
    "Autumn",
    "Winter",
    "Summer",
    "Light",
    "Deep",
    "Cool",
    "Muted",
    "Warm",
    "Bright",
];

export default function FormCapture() {
    const [form, setForm] = useState({ dropdown: "", inputText: "" });
    const [dropdown, setDropdown] = useState("");
    type DropdownOption = {
        phone: string; value: string; label: string; first_name: string; 
};
    const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>([]);
    const [selectedButton, setSelectedButton] = useState<string | null>(null);
   
    const [selectedOption, setSelectedOption] = useState<DropdownOption | null>(null);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState('SMS');
    const [manualName, setManualName] = useState("");
    const [manualPhone, setManualPhone] = useState("");

    // Fetch dropdown options from database
    React.useEffect(() => {
        fetchDropdownOptionsFromSupabase().then(setDropdownOptions);
    }, []);


    console.log("selectedOption:", selectedOption);


    // Input box
    const handleInput = (e: { target: { value: any; }; }) => {
        setForm({ ...form, inputText: e.target.value });
    };

    // Dropdown
    const handleDropdown = (e: { target: { value: any; }; }) => {
        const value = e.target.value;
        setForm(prev => ({ ...prev, dropdown: value }));
        if (value !== 'manual') {
            setForm(prev => ({ ...prev, inputText: '' }));
            // Find the selected option object
            const opt = dropdownOptions.find(o => o.value === value);
            setSelectedOption(opt || null);
        } else {
            setSelectedOption(null);
        }
    };

    // Manual Entry handlers
    const handleManualName = (e: { target: { value: React.SetStateAction<string>; }; }) => setManualName(e.target.value);
    interface ManualPhoneEvent {
        target: { value: string };
    }
    const handleManualPhone = (e: ManualPhoneEvent) => setManualPhone(e.target.value);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setSuccess(false);

        const formData = new FormData();
        formData.append("buttonSelection", JSON.stringify([selectedButton]));
        formData.append("inputText", form.inputText);

        if (form.dropdown === "manual") {
            formData.append("manualName", manualName);
            formData.append("manualPhone", manualPhone);
            formData.append("deliveryMethod", deliveryMethod);
        } else if (selectedOption) {
            // Assuming your dropdownOptions have value, label, and possibly phone fields
            formData.append("first_name", selectedOption.first_name || "");
            formData.append("phone", selectedOption.phone || "");
            formData.append("service", deliveryMethod);
        }

        try {
            const res = await fetch("/api/send-analysis", {
                method: "POST",
                body: formData,
            });
            if (res.ok) setSuccess(true);
        } catch (err) {
            // handle error
        } finally {
            setSending(false);
        }
    };

    // Delivery method selection
  const handleDeliveryMethod = (method: React.SetStateAction<string>) => {
    setDeliveryMethod(method);
  };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-8 bg-white rounded-xl shadow-lg p-8 w-full max-w-lg"
        >
            {/* Dropdown */}
            <div>
                <label className="block mb-2 font-bold">Dropdown:</label>
                <select value={form.dropdown} onChange={handleDropdown} className="border px-3 py-2 rounded text-black w-full bg-white">
                    <option value="">Select...</option>
                    {dropdownOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                    <option value="manual">Manual Entry</option>
                </select>
            </div>
            {form.dropdown === 'manual' && (
                <div>
                    <div>
                        <label className="block mb-2 font-bold">Manual Entry:</label>
                        <input type="text" value={manualName} onChange={handleManualName} className="border px-3 py-2 rounded text-black w-full mb-2 bg-white" placeholder="Name" />
                        <input type="text" value={manualPhone} onChange={handleManualPhone} className="border px-3 py-2 rounded text-black w-full bg-white" placeholder="Phone Number" />
                    </div>
                    <div>
                        <button
                            type="button"
                            className={deliveryMethod === 'SMS' ? "bg-blue-500 text-white px-4 py-2 rounded" : "bg-white text-black px-4 py-2 rounded border"}
                            onClick={() => handleDeliveryMethod('SMS')}
                        >
                            SMS
                        </button>
                        <button
                            type="button"
                            className={deliveryMethod === 'WhatsApp' ? "bg-blue-500 text-white px-4 py-2 rounded" : "bg-white text-black px-4 py-2 rounded border"}
                            onClick={() => handleDeliveryMethod('WhatsApp')}
                        >
                            WhatsApp
                        </button>
                    </div>
                </div>
            )}

            {/* 10 Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 w-full justify-items-center">
                {BUTTONS.map((label) => (
                    <button
                        type="button"
                        key={label}
                        className={`px-4 py-2 rounded font-medium w-28 transition-colors ${selectedButton === label
                                ? "bg-blue-600 text-white"
                                : "bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
                            }`}
                        onClick={() => setSelectedButton(label)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Send Button */}
            <div className="w-full flex justify-center mt-8">
                <button
                    type="submit"
                    className="w-80 py-5 rounded-full bg-blue-600 text-white text-2xl font-bold transition-all hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
                    disabled={
                        sending ||
                        !selectedButton ||
                        (
                            form.dropdown === "manual"
                                ? (!manualName || !manualPhone)
                                : !selectedOption || !selectedOption.first_name
                        )
                    }
                >
                    {sending ? "Sending..." : "Send"}
                </button>
            </div>
            {success && (
                <div className="text-green-600 font-semibold mt-2">Sent successfully!</div>
            )}
        </form>
    );
}