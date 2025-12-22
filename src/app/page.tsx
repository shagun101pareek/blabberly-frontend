import Navbar from './Components/Navbar';
import MainContent from './Components/MainContent';

export default function Home() {
  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <Navbar />
      <MainContent />
    </div>
  );
}
