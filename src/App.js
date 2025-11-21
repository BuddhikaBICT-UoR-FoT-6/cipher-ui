import { ThemeProvider } from './ThemeContext';
import CipherApp from './CipherApp';
import ThemeToggle from './ThemeToggle';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <ThemeToggle />
        <CipherApp />
      </div>
    </ThemeProvider>
  );
}

export default App;
