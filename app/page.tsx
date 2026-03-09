import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{
        fontSize: '3.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Mental Health Tracker
      </h1>
      <p style={{
        fontSize: '1.2rem',
        color: '#ccc',
        marginBottom: '3rem',
        maxWidth: '600px'
      }}>
        Your safe space to track daily activities, monitor your mood, and improve your mental well-being.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <Link href="/login" style={{
          padding: '1rem 2rem',
          borderRadius: '30px',
          background: 'var(--accent-gradient)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          transition: 'transform 0.2s',
          boxShadow: '0 5px 15px rgba(0, 210, 255, 0.3)'
        }}>
          Get Started
        </Link>
      </div>
    </main>
  );
}
