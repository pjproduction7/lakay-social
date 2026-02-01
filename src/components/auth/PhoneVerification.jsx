import React, { useState } from "react";

export default function PhoneVerification({ onVerified, onClose }) {
  const [step, setStep] = useState("enter");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const handleSendCode = () => {
    if (phone.length < 8) {
      alert("Please enter a valid number");
      return;
    }
    alert("Verification code 1234 sent to: " + phone);
    setStep("verify");
  };

  const handleVerify = () => {
    if (code === "1234") {
      alert("✅ Phone verified!");
      onVerified(phone);
    } else {
      alert("❌ Invalid code. Try 1234.");
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto bg-slate-800 shadow-2xl rounded-2xl border border-slate-700 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📱 Phone Setup</h2>
        <button onClick={onClose} className="text-slate-400">✕</button>
      </div>

      {step === "enter" ? (
        <>
          <p className="text-sm text-slate-400 mb-4">Connect your phone to enable calling features.</p>
          <input
            type="tel"
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl w-full mb-4 text-white"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={handleSendCode} className="bg-yellow-500 text-black font-bold py-3 rounded-xl w-full shadow-lg">
            Send Verification Code
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl w-full mb-4 text-white"
            placeholder="Enter code (1234)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={handleVerify} className="bg-green-500 text-white font-bold py-3 rounded-xl w-full shadow-lg">
            Verify & Connect
          </button>
        </>
      )}
    </div>
  );
}