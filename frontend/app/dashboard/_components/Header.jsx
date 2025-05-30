"use client";
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { UserButton } from '@clerk/nextjs'
import { useEffect } from 'react';
function Header() {
  const path = usePathname();

useEffect
(() => {
    // Scroll to the top of the page when the component mounts
console.log(path);
  }, []); // Dependency array includes path to re-run effect on path change
  return (
    <div className='flex p-4 items-center justify-between bg-secondary shadow-md'>
      <Image src="/logo.svg" alt="Logo" width={150} height={50} className="inline-block mr-2" />
      <ul className='hidden md:flex gap-4'>
        <li className={`hover:text-primary hover:font-bold transition-all cursor-pointer ${path == '/dashboard' && 'text-primary font-bold'}`}>Dashboard</li>
        <li className={`hover:text-primary hover:font-bold transition-all cursor-pointer ${path == '/dashboard/questions' && 'text-primary font-bold'}`}>Questions</li>
        <li className={`hover:text-primary hover:font-bold transition-all cursor-pointer ${path == '/dashboard/upgrade' && 'text-primary font-bold'}`}>Upgrade</li>
        <li className={`hover:text-primary hover:font-bold transition-all cursor-pointer ${path == '/dashboard/how' && 'text-primary font-bold'}`}>How it works?</li>
      </ul>
      <UserButton />
    </div>
  )
}

export default Header
