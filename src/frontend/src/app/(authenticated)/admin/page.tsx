'use client';

import { useState } from 'react';
import { backend } from '@/declarations/backend';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

console.log(process.env.NEXT_PUBLIC_VERSION, process.env.NEXT_PUBLIC_IC_HOST);

export default function Home() {
  const [greeting, setGreeting] = useState('');

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = event => {
    event.preventDefault();
    // @ts-expect-error types are wrong for DOM elements
    const name = (event.target as HTMLFormElement).elements.name.value;
    backend.greet(name).then(greeting => {
      setGreeting(greeting);
    });
    return false;
  };

  return (
    <main>
      <Image src="/logo2.svg" width={684} height={147} alt="DFINITY logo" />
      <br />
      <br />
      <form action="#" onSubmit={handleSubmit}>
        <label htmlFor="name">Enter your name: &nbsp;</label>
        <Input id="name" alt="Name" type="text" />
        <Button type="submit">Click Me!</Button>
      </form>
      <section id="greeting">{greeting}</section>
    </main>
  );
}
