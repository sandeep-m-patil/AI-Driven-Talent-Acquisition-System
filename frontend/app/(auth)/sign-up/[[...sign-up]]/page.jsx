import {  SignUp } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="h-screen flex">
      {/* Left Side - Branding */}
      <div className="flex w-1/2 bg-gradient-to-tr from-blue-800 to-purple-700 justify-around items-center">
        <div>
          <h1 className="text-white font-bold text-4xl font-sans">ADSTAS</h1>
          <p className="text-white mt-1">
            The most popular AI Driven Smart Talent Acquisition System
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-1/2 justify-center items-center bg-white">
 <SignUp/>
      </div>
    </div>
  );
}
