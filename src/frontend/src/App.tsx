import { useState } from 'react';
import { backend } from './declarations/backend';

function App() {
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
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      <form action="#" onSubmit={handleSubmit}>
        <label htmlFor="name">Enter your name: &nbsp;</label>
        <input id="name" alt="Name" type="text" />
        <button type="submit">Click Me!</button>
      </form>
      <section id="greeting">{greeting}</section>
    </main>
  );
}

export default App;
